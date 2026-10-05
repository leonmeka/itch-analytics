import { type Ref, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { useImportPayments, useImportViews, useMarkSynced } from '../api/queries';
import {
  analyticsUrl,
  CHALLENGE_FALLBACK_MS,
  DASHBOARD_URL,
  detectScript,
  EXPORT_URL,
  fetchJsonScript,
  fetchScript,
  MAX_REPROBES,
  REPROBE_DELAY_MS,
  STALL_WATCHDOG_MS,
  type SyncEngineMessage,
} from '../utils/sync.engine';

export type PaymentsSyncHandle = { start: () => void };

export function formatLastSynced(iso: string | null): string {
  if (!iso) return 'Never synced';
  const elapsed = Date.now() - new Date(iso).getTime();
  if (elapsed < 60_000) return 'just now';
  if (elapsed < 3_600_000) return `${Math.floor(elapsed / 60_000)}m ago`;
  if (elapsed < 86_400_000) return `${Math.floor(elapsed / 3_600_000)}h ago`;
  return `${Math.floor(elapsed / 86_400_000)}d ago`;
}

type SyncPhase = 'idle' | 'running' | 'error';

export type PaymentsSyncPhase = SyncPhase;

// Runs the itch.io sync inside a hidden WebView: no browser UI unless itch.io
// demands a login or an interactive Cloudflare check — then the parent opens
// the visible sync screen and this engine steps aside. Sync only ever runs on
// an explicit start() call (header button, empty state); never on navigation.
// Renders nothing visible; the parent surfaces phase via onPhaseChange.
export function PaymentsSync({
  userId,
  ref,
  onNeedsVisible,
  onPhaseChange,
}: {
  userId: string;
  ref?: Ref<PaymentsSyncHandle>;
  onNeedsVisible: () => void;
  onPhaseChange?: (phase: PaymentsSyncPhase) => void;
}) {
  const importer = useImportPayments();
  const viewsImporter = useImportViews();
  const markSynced = useMarkSynced();
  const [phase, setPhase] = useState<SyncPhase>('idle');
  const phaseChangeRef = useRef(onPhaseChange);
  phaseChangeRef.current = onPhaseChange;

  useEffect(() => {
    phaseChangeRef.current?.(phase);
  }, [phase]);
  const webviewRef = useRef<WebView>(null);
  const urlRef = useRef(DASHBOARD_URL);
  const targetRef = useRef<'payments' | 'views'>('payments');
  const reprobeCountRef = useRef(0);
  const reprobeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const watchdogRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activityRef = useRef(Date.now());
  const resolvedRef = useRef(false);
  const syncingRef = useRef(false);

  const clearTimers = () => {
    for (const timer of [reprobeTimerRef, fallbackTimerRef, watchdogRef]) {
      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
      }
    }
  };

  useEffect(
    () => () => {
      for (const timer of [reprobeTimerRef, fallbackTimerRef, watchdogRef]) {
        if (timer.current) clearTimeout(timer.current);
      }
    },
    [],
  );

  const fetchExport = () => {
    targetRef.current = 'payments';
    webviewRef.current?.injectJavaScript(fetchScript(EXPORT_URL));
  };

  const fetchViews = () => {
    targetRef.current = 'views';
    webviewRef.current?.injectJavaScript(fetchJsonScript(analyticsUrl()));
  };

  const scheduleReprobe = () => {
    if (reprobeCountRef.current >= MAX_REPROBES) {
      syncingRef.current = false;
      clearTimers();
      setPhase('error');
      return;
    }
    reprobeCountRef.current += 1;
    if (reprobeTimerRef.current) clearTimeout(reprobeTimerRef.current);
    reprobeTimerRef.current = setTimeout(() => {
      if (targetRef.current === 'views') fetchViews();
      else fetchExport();
    }, REPROBE_DELAY_MS);
  };

  // The hidden WebView can't show an interactive challenge; give it a short
  // chance to auto-solve, then hand over to the visible sync screen.
  const scheduleVisibleFallback = () => {
    if (fallbackTimerRef.current) return;
    fallbackTimerRef.current = setTimeout(() => {
      fallbackTimerRef.current = null;
      if (resolvedRef.current) return;
      onNeedsVisible();
      setPhase('idle');
    }, CHALLENGE_FALLBACK_MS);
  };

  const syncCsv = async (csv: string) => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    clearTimers();
    try {
      await importer.mutateAsync({ userId, csv });
      await markSynced();
      // Hand the re-entry guard back before the views fetch — syncViews
      // checks the same flag.
      syncingRef.current = false;
      fetchViews();
    } catch {
      syncingRef.current = false;
      setPhase('error');
    }
  };

  const syncViews = async (payload: string) => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    clearTimers();
    try {
      await viewsImporter.mutateAsync({
        userId,
        payload: JSON.parse(payload) as Record<string, unknown>,
      });
      setPhase('idle');
    } catch {
      setPhase('error');
    } finally {
      syncingRef.current = false;
    }
  };

  const handleMessage = (event: WebViewMessageEvent) => {
    activityRef.current = Date.now();

    let message: SyncEngineMessage;
    try {
      message = JSON.parse(event.nativeEvent.data) as SyncEngineMessage;
    } catch {
      return;
    }

    switch (message.kind) {
      case 'csv':
        resolvedRef.current = true;
        void syncCsv(message.csv);
        break;
      case 'analytics':
        resolvedRef.current = true;
        void syncViews(message.payload);
        break;
      case 'challenge':
        resolvedRef.current = false;
        scheduleVisibleFallback();
        break;
      case 'login':
        onNeedsVisible();
        setPhase('idle');
        break;
      case 'ready':
        resolvedRef.current = true;
        if (fallbackTimerRef.current) {
          clearTimeout(fallbackTimerRef.current);
          fallbackTimerRef.current = null;
        }
        reprobeCountRef.current = 0;
        fetchExport();
        break;
      case 'page':
        if (message.url?.includes('/login')) {
          onNeedsVisible();
          setPhase('idle');
        } else {
          scheduleReprobe();
        }
        break;
      case 'fetch-blocked':
      case 'fetch-error':
        scheduleReprobe();
        break;
    }
  };

  const detect = () => {
    if (urlRef.current.startsWith('https://itch.io/')) {
      webviewRef.current?.injectJavaScript(detectScript);
    }
  };

  const start = () => {
    if (phase === 'running' || syncingRef.current) return;
    clearTimers();
    resolvedRef.current = false;
    reprobeCountRef.current = 0;
    activityRef.current = Date.now();
    setPhase('running');
    watchdogRef.current = setInterval(() => {
      if (Date.now() - activityRef.current > STALL_WATCHDOG_MS && !syncingRef.current) {
        clearTimers();
        setPhase('error');
      }
    }, 10_000);
  };

  const startRef = useRef(start);
  startRef.current = start;

  useImperativeHandle(ref, () => ({ start: () => startRef.current() }));

  return phase === 'running' ? (
    <View className="absolute top-0 left-0 h-0 w-0 overflow-hidden" pointerEvents="none">
      <WebView
        ref={webviewRef}
        source={{ uri: DASHBOARD_URL }}
        style={{ width: 0, height: 0 }}
        useSharedProcessPool={false}
        incognito={false}
        originWhitelist={['https://*', 'http://*', 'about:*']}
        onNavigationStateChange={(state) => {
          urlRef.current = state.url;
        }}
        onLoadEnd={detect}
        onMessage={handleMessage}
        onContentProcessDidTerminate={() => {
          if (phase === 'running' && !resolvedRef.current) webviewRef.current?.reload();
        }}
      />
    </View>
  ) : null;
}
