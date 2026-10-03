import * as SecureStore from 'expo-secure-store';

const LAST_SYNCED_KEY = 'itch.payments.last-synced.v1';

export async function loadLastSynced(): Promise<string | null> {
  try {
    return (await SecureStore.getItemAsync(LAST_SYNCED_KEY)) ?? null;
  } catch {
    return null;
  }
}

export async function saveLastSynced(syncedAt: Date): Promise<void> {
  try {
    await SecureStore.setItemAsync(LAST_SYNCED_KEY, syncedAt.toISOString());
  } catch {}
}
