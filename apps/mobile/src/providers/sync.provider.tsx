import { createContext, type ReactNode, useContext, useRef, useState } from 'react';
import { useImportGames } from '../api/queries';
import {
  PaymentsSync,
  type PaymentsSyncHandle,
  type PaymentsSyncPhase,
} from '../components/payments-sync.component';
import { ItchSyncScreen } from '../screens/itch-sync.screen';
import { fetchItchGames } from '../utils/itch.api';
import { loadItchToken } from '../utils/sync.storage';

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
// on-device games sync, so any tab can trigger a full sync. The engine stays
// mounted across tab switches; a login/Cloudflare challenge hands over to the
// visible ItchSyncScreen.
export function SyncProvider({ userId, children }: { userId: string | null; children: ReactNode }) {
  const syncRef = useRef<PaymentsSyncHandle>(null);
  const importGames = useImportGames();
  const [phase, setPhase] = useState<PaymentsSyncPhase>('idle');
  const [syncOpen, setSyncOpen] = useState(false);
  const gamesRunningRef = useRef(false);

  // Games sync runs on-device: fetch api.itch.io/profile/games with the
  // itch OAuth token stored at login, then hand the payload to the backend
  // ingestion endpoint.
  const syncGamesOnDevice = async (id: string): Promise<void> => {
    const token = await loadItchToken();

    if (!token) {
      console.warn('games sync skipped: no itch.io token on device — log in again');
      return;
    }

    const payload = await fetchItchGames(token);
    await importGames.mutateAsync({ userId: id, payload: payload as Record<string, unknown> });
  };

  const startSync = () => {
    if (!userId || phase !== 'idle' || gamesRunningRef.current) return;

    syncRef.current?.start();

    gamesRunningRef.current = true;
    void syncGamesOnDevice(userId)
      .catch((error) => console.warn('on-device games sync failed', error))
      .finally(() => {
        gamesRunningRef.current = false;
      });
  };

  return (
    <SyncContext.Provider
      value={{
        startSync,
        closeSync: () => setSyncOpen(false),
        phase,
        gamesSyncing: importGames.isPending,
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
