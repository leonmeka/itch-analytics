import * as SecureStore from 'expo-secure-store';

const LAST_SYNCED_KEY = 'itch.payments.last-synced.v1';
const ITCH_TOKEN_KEY = 'itch.oauth.access-token.v1';

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

export async function loadItchToken(): Promise<string | null> {
  try {
    return (await SecureStore.getItemAsync(ITCH_TOKEN_KEY)) ?? null;
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
  } catch {}
}
