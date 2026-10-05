import { createContext, type ReactNode, useContext, useRef, useState } from 'react';
import { useSyncGames } from '../api/queries';
import {
  PaymentsSync,
  type PaymentsSyncHandle,
  type PaymentsSyncPhase,
} from '../components/payments-sync.component';
import { ItchSyncScreen } from '../screens/itch-sync.screen';

type SyncContextValue = {
  startSync: () => void;
  closeSync: () => void;
  phase: PaymentsSyncPhase;
  gamesSyncing: boolean;
  syncOpen: boolean;
};

const SyncContext = createContext<SyncContextValue | null>(null);

export function useSync(): SyncContextValue {
  const value = useContext(SyncContext);

  if (!value) {
    throw new Error('useSync must be used within a SyncProvider');
  }

  return value;
}

// Owns the hidden itch.io sync engine (payments CSV + analytics views) and the
// server-side games sync, so any tab can trigger a full sync. The engine stays
// mounted across tab switches; a login/Cloudflare challenge hands over to the
// visible ItchSyncScreen.
export function SyncProvider({ userId, children }: { userId: string | null; children: ReactNode }) {
  const syncRef = useRef<PaymentsSyncHandle>(null);
  const syncGames = useSyncGames();
  const [phase, setPhase] = useState<PaymentsSyncPhase>('idle');
  const [syncOpen, setSyncOpen] = useState(false);
  const gamesRunningRef = useRef(false);

  const startSync = () => {
    if (!userId || phase !== 'idle' || gamesRunningRef.current) return;

    syncRef.current?.start();

    gamesRunningRef.current = true;
    void syncGames.mutateAsync({ userId }).finally(() => {
      gamesRunningRef.current = false;
    });
  };

  return (
    <SyncContext.Provider
      value={{
        startSync,
        closeSync: () => setSyncOpen(false),
        phase,
        gamesSyncing: syncGames.isPending,
        syncOpen,
      }}
    >
      {children}
      {userId ? (
        <PaymentsSync
          ref={syncRef}
          userId={userId}
          onNeedsVisible={() => setSyncOpen(true)}
          onPhaseChange={setPhase}
        />
      ) : null}
      {syncOpen && userId ? (
        <ItchSyncScreen userId={userId} onClose={() => setSyncOpen(false)} />
      ) : null}
    </SyncContext.Provider>
  );
}
