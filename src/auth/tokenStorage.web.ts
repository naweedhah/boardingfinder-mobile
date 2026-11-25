/**
 * Web build (used for quick previews in a desktop browser). Browsers have no keystore, so the
 * token falls back to sessionStorage: it is cleared when the tab closes. The native app uses
 * SecureStore (see tokenStorage.ts).
 */
const TOKEN_KEY = 'bf.token';
const USER_KEY = 'bf.user';

const store = () => (typeof sessionStorage === 'undefined' ? null : sessionStorage);

export const tokenStorage = {
  getToken: async () => store()?.getItem(TOKEN_KEY) ?? null,
  getUser: async () => store()?.getItem(USER_KEY) ?? null,
  async save(token: string, userJson: string) {
    store()?.setItem(TOKEN_KEY, token);
    store()?.setItem(USER_KEY, userJson);
  },
  saveUser: async (userJson: string) => store()?.setItem(USER_KEY, userJson),
  async clear() {
    store()?.removeItem(TOKEN_KEY);
    store()?.removeItem(USER_KEY);
  },
};
