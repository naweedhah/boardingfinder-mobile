import { config } from '@/config';

/**
 * Error raised for any failed API call. `fields` carries Laravel's per-field validation
 * messages (e.g. `{ price: ['Price must be...'] }`) so forms can show them inline.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly fields: Record<string, string[]> = {},
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** No response at all: offline, DNS failure, server down. */
  get isNetworkError() {
    return this.status === 0;
  }
}

type TokenGetter = () => string | null;
type UnauthorizedHandler = () => void;

let getToken: TokenGetter = () => null;
let onUnauthorized: UnauthorizedHandler = () => {};

/** Wired up once by the AuthProvider; keeps this module free of React. */
export function configureApiClient(options: { getToken: TokenGetter; onUnauthorized: UnauthorizedHandler }) {
  getToken = options.getToken;
  onUnauthorized = options.onUnauthorized;
}

export type Query = Record<string, string | number | boolean | null | undefined>;

export function buildUrl(path: string, query?: Query): string {
  const url = `${config.apiUrl}/api/${path.replace(/^\/+/, '')}`;
  if (!query) return url;

  const params = Object.entries(query)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);

  return params.length ? `${url}?${params.join('&')}` : url;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  query?: Query;
  /** Plain objects are sent as JSON; FormData as multipart. */
  body?: unknown;
  signal?: AbortSignal;
}

export async function api<T>(path: string, { method = 'GET', query, body, signal }: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let payload: BodyInit | undefined;
  if (body instanceof FormData) {
    payload = body; // fetch sets the multipart boundary itself
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), { method, headers, body: payload, signal });
  } catch (error) {
    if ((error as Error)?.name === 'AbortError') throw error;
    throw new ApiError("Can't reach BoardingFinder. Check your connection and try again.", 0);
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    // 401 = no/unknown token, 403 with a token = revoked, expired or suspended. Both end the session.
    if (token && (response.status === 401 || (response.status === 403 && isTokenRejection(data)))) {
      onUnauthorized();
    }
    throw new ApiError(data?.message ?? `Request failed (${response.status})`, response.status, data?.fields ?? {});
  }

  return data as T;
}

function isTokenRejection(data: { message?: string } | null): boolean {
  return data?.message === 'Token is not Valid!' || data?.message === 'Account access has been suspended.';
}
