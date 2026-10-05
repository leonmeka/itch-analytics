import { Typography } from 'heroui-native/text';
import { useEffect, useRef, useState } from 'react';
import { Modal, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { type FileDownload, WebView, type WebViewMessageEvent } from 'react-native-webview';
import { useImportPayments, useMarkSynced } from '../api/queries';
import { Icon, type IconName } from '../components/icon.component';
import { PageHeader } from '../components/page-header.component';
import { Button } from '../components/ui/button';
import {
  CHALLENGE_TIMEOUT_MS,
  DASHBOARD_URL,
  detectScript,
  EXPORT_URL,
  fetchScript,
  MAX_REPROBES,
  REPROBE_DELAY_MS,
  type SyncEngineMessage,
} from '../utils/sync.engine';

type SyncStatus = 'connecting' | 'verifying' | 'needs-login' | 'stalled' | 'importing' | 'failed';

const statusCopy: Record<SyncStatus, string> = {
  connecting: 'Connecting to itch.io…',
  verifying:
    'Cloudflare is verifying this browser. Hang tight — the sync continues on its own once it clears. Do not close this window.',
  'needs-login': 'Sign in to itch.io below. The sync picks up on its own once you are in.',
  stalled: 'Verification is taking unusually long. Complete any check shown below, then try again.',
  importing: 'Reading your purchase export…',
  failed: 'Import failed. Check your connection and try again.',
};

const statusIcon: Record<SyncStatus, IconName> = {
  connecting: 'download',
  verifying: 'info',
  'needs-login': 'account',
  stalled: 'info',
  importing: 'download',
  failed: 'info',
};

export function ItchSyncScreen({ userId, onClose }: { userId: string; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const webviewRef = useRef<WebView>(null);
  const urlRef = useRef(DASHBOARD_URL);
  const csvRef = useRef<string | null>(null);
  const syncingRef = useRef(false);
  const challengedAtRef = useRef<number | null>(null);
  const reprobeCountRef = useRef(0);
  const reprobeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const importer = useImportPayments();
  const markSynced = useMarkSynced();
  const [status, setStatus] = useState<SyncStatus>('connecting');
  const [source, setSource] = useState(DASHBOARD_URL);
  const [navKey, setNavKey] = useState(0);

  const fetchExport = () => {
    webviewRef.current?.injectJavaScript(fetchScript(EXPORT_URL));
  };

  const scheduleReprobe = () => {
    if (reprobeCountRef.current >= MAX_REPROBES) {
      setStatus('stalled');
      return;
    }
    reprobeCountRef.current += 1;
    if (reprobeTimerRef.current) clearTimeout(reprobeTimerRef.current);
    reprobeTimerRef.current = setTimeout(fetchExport, REPROBE_DELAY_MS);
  };

  const sync = async (csv: string) => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    csvRef.current = csv;
    if (reprobeTimerRef.current) {
      clearTimeout(reprobeTimerRef.current);
      reprobeTimerRef.current = null;
    }
    setStatus('importing');
    try {
      await importer.mutateAsync({ userId, csv });
      await markSynced();
      onClose();
    } catch {
      setStatus('failed');
    } finally {
      syncingRef.current = false;
    }
  };

  const handleMessage = (event: WebViewMessageEvent) => {
    if (syncingRef.current) return;

    let message: SyncEngineMessage;
    try {
      message = JSON.parse(event.nativeEvent.data) as SyncEngineMessage;
    } catch {
      return;
    }

    switch (message.kind) {
      case 'csv':
        challengedAtRef.current = null;
        reprobeCountRef.current = 0;
        void sync(message.csv);
        break;
      case 'challenge':
        setStatus((prev) => (prev === 'importing' || prev === 'failed' ? prev : 'verifying'));
        if (challengedAtRef.current == null) challengedAtRef.current = Date.now();
        break;
      case 'login':
        challengedAtRef.current = null;
        if (status !== 'importing' && status !== 'failed') setStatus('needs-login');
        break;
      case 'ready':
        challengedAtRef.current = null;
        reprobeCountRef.current = 0;
        if (status !== 'importing' && status !== 'failed') setStatus('connecting');
        fetchExport();
        break;
      case 'page':
        if (message.url.includes('/login')) {
          setStatus('needs-login');
        } else if (status === 'connecting') {
          setStatus('stalled');
        }
        break;
      case 'fetch-blocked':
      case 'fetch-error':
        scheduleReprobe();
        break;
    }
  };

  const handleFileDownload = (event: { nativeEvent: FileDownload }) => {
    const { downloadUrl } = event.nativeEvent;
    if (!downloadUrl) return;
    webviewRef.current?.injectJavaScript(fetchScript(downloadUrl));
  };

  const detect = () => {
    if (urlRef.current.startsWith('https://itch.io/')) {
      webviewRef.current?.injectJavaScript(detectScript);
    }
  };

  useEffect(() => {
    if (status !== 'verifying') return;
    const timer = setInterval(() => {
      if (
        challengedAtRef.current != null &&
        Date.now() - challengedAtRef.current > CHALLENGE_TIMEOUT_MS
      ) {
        setStatus((prev) => (prev === 'verifying' ? 'stalled' : prev));
      }
    }, 5_000);
    return () => clearInterval(timer);
  }, [status]);

  useEffect(
    () => () => {
      if (reprobeTimerRef.current) clearTimeout(reprobeTimerRef.current);
    },
    [],
  );

  const tryAgain = () => {
    setStatus('connecting');
    challengedAtRef.current = null;
    reprobeCountRef.current = 0;
    webviewRef.current?.reload();
  };

  const openExportPage = () => {
    setStatus('connecting');
    challengedAtRef.current = null;
    reprobeCountRef.current = 0;
    setSource(EXPORT_URL);
    setNavKey((key) => key + 1);
  };

  const retryImport = () => {
    if (csvRef.current) void sync(csvRef.current);
  };

  return (
    <Modal
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
      onDismiss={onClose}
    >
      <View className="flex-1 bg-app-background" style={{ paddingTop: insets.top }}>
        <PageHeader title="Sync purchases" backLabel="Close sync" onBack={onClose} />
        {status === 'connecting' || status === 'importing' ? null : (
          <View className="mx-5 mb-3 rounded-app-card bg-app-surface p-3">
            <View className="flex-row items-start gap-2">
              <Icon name={statusIcon[status]} size={16} />
              <Typography
                type="body-xs"
                className="flex-1 text-app-muted"
                accessibilityLiveRegion="polite"
              >
                {statusCopy[status]}
              </Typography>
            </View>
            {status === 'stalled' ? (
              <View className="flex-row gap-2 pt-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-10 flex-1 rounded-full bg-app-well"
                  onPress={tryAgain}
                >
                  <Button.Label className="text-[13px] text-app-foreground">Try again</Button.Label>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-10 flex-1 rounded-full bg-app-well"
                  onPress={openExportPage}
                >
                  <Button.Label className="text-[13px] text-app-foreground">
                    Open export page
                  </Button.Label>
                </Button>
              </View>
            ) : null}
            {status === 'failed' ? (
              <Button
                size="sm"
                className="mt-2 h-10 rounded-full bg-app-accent"
                onPress={retryImport}
              >
                <Button.Label className="text-app-accent-ink">Retry import</Button.Label>
              </Button>
            ) : null}
          </View>
        )}
        <View className="flex-1" style={{ paddingBottom: insets.bottom }}>
          <WebView
            key={navKey}
            ref={webviewRef}
            source={{ uri: source }}
            style={{ flex: 1 }}
            allowsBackForwardNavigationGestures
            useSharedProcessPool={false}
            incognito={false}
            originWhitelist={['https://*', 'http://*', 'about:*']}
            onNavigationStateChange={(state) => {
              urlRef.current = state.url;
            }}
            onLoadEnd={detect}
            onMessage={handleMessage}
            onFileDownload={handleFileDownload}
            onContentProcessDidTerminate={tryAgain}
          />
        </View>
      </View>
    </Modal>
  );
}
