import * as SecureStore from 'expo-secure-store';
import { loadMigratedValue } from './secure-storage.utils';

const LAST_SYNCED_KEY = 'scratch.payments.last-synced.v1';
const ITCH_TOKEN_KEY = 'scratch.oauth.access-token.v1';

export async function loadLastSynced(): Promise<string | null> {
  try {
    return (await loadMigratedValue(LAST_SYNCED_KEY, 'itch.payments.last-synced.v1')) ?? null;
  } catch {
    return null;
  }
}

export async function saveLastSynced(syncedAt: Date): Promise<void> {
  try {
    await SecureStore.setItemAsync(LAST_SYNCED_KEY, syncedAt.toISOString());
  } catch {}
}

export async function loadItchToken(): Promise<string | null> {
  try {
    return (await loadMigratedValue(ITCH_TOKEN_KEY, 'itch.oauth.access-token.v1')) ?? null;
  } catch {
    return null;
  }
}

export async function saveItchToken(token: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(ITCH_TOKEN_KEY, token);
  } catch {}
}

export async function deleteItchToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(ITCH_TOKEN_KEY);
    await SecureStore.deleteItemAsync('itch.oauth.access-token.v1');
  } catch {}
}
