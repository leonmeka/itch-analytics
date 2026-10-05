import * as SecureStore from 'expo-secure-store';

export async function loadMigratedValue(key: string, previousKey: string): Promise<string | null> {
  const current = await SecureStore.getItemAsync(key);
  if (current !== null) return current;
  const previous = await SecureStore.getItemAsync(previousKey);
  if (previous !== null) {
    await SecureStore.setItemAsync(key, previous);
    await SecureStore.deleteItemAsync(previousKey);
  }
  return previous;
}
