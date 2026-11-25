import * as SecureStore from 'expo-secure-store';

/**
 * The API token lives in the iOS Keychain / Android Keystore, never in AsyncStorage (which is
 * an unencrypted file). The cached profile is stored next to it so the app can open offline.
 */
const TOKEN_KEY = 'bf.token';
const USER_KEY = 'bf.user';

export const tokenStorage = {
  getToken: () => SecureStore.getItemAsync(TOKEN_KEY),
  getUser: () => SecureStore.getItemAsync(USER_KEY),
  async save(token: string, userJson: string) {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    await SecureStore.setItemAsync(USER_KEY, userJson);
  },
  saveUser: (userJson: string) => SecureStore.setItemAsync(USER_KEY, userJson),
  async clear() {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
  },
};
