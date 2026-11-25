/**
 * Build-time configuration. Expo inlines `EXPO_PUBLIC_*` variables when it bundles the app,
 * so they must be read with static `process.env.EXPO_PUBLIC_X` expressions (no destructuring).
 */
const trimSlash = (url: string) => url.replace(/\/+$/, '');

export const config = {
  apiUrl: trimSlash(process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000'),
  reverb: {
    key: process.env.EXPO_PUBLIC_REVERB_KEY ?? 'boardingfinder-local-key',
    host: process.env.EXPO_PUBLIC_REVERB_HOST ?? 'localhost',
    port: Number(process.env.EXPO_PUBLIC_REVERB_PORT ?? 8080),
    scheme: process.env.EXPO_PUBLIC_REVERB_SCHEME ?? 'http',
  },
} as const;
