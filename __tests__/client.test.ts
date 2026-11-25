import { api, ApiError, buildUrl, configureApiClient } from '@/api/client';
import { listingQuery } from '@/api/endpoints';

const json = (status: number, body: unknown) =>
  Promise.resolve({ ok: status >= 200 && status < 300, status, json: () => Promise.resolve(body) } as Response);

describe('api client', () => {
  const fetchMock = jest.fn();
  const onUnauthorized = jest.fn();
  let token: string | null = 'secret-token';

  beforeEach(() => {
    fetchMock.mockReset();
    onUnauthorized.mockReset();
    token = 'secret-token';
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    configureApiClient({ getToken: () => token, onUnauthorized });
  });

  it('sends the bearer token and JSON body', async () => {
    fetchMock.mockReturnValue(json(200, { ok: true }));

    await api('posts/1/book', { method: 'POST', body: { a: 1 } });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('http://localhost:8000/api/posts/1/book');
    expect(init.headers.Authorization).toBe('Bearer secret-token');
    expect(init.headers['Content-Type']).toBe('application/json');
    expect(init.body).toBe('{"a":1}');
  });

  it('omits the Authorization header when signed out', async () => {
    token = null;
    fetchMock.mockReturnValue(json(200, []));
    await api('posts');
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBeUndefined();
  });

  it("turns a 422 into an ApiError carrying Laravel's per-field messages", async () => {
    fetchMock.mockReturnValue(
      json(422, { message: 'Title must be between 5 and 60 characters.', fields: { title: ['Title must be between 5 and 60 characters.'] } }),
    );

    const error = (await api('boardings/add', { method: 'POST', body: {} }).catch((e: ApiError) => e)) as ApiError;

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(422);
    expect(error.fields.title).toEqual(['Title must be between 5 and 60 characters.']);
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it('ends the session when the server rejects the token', async () => {
    fetchMock.mockReturnValue(json(403, { message: 'Token is not Valid!' }));
    await expect(api('chats')).rejects.toThrow('Token is not Valid!');
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it('does not sign out on an ordinary 403 (e.g. a students-only action)', async () => {
    fetchMock.mockReturnValue(json(403, { message: 'Only students can send booking requests' }));
    await expect(api('posts/1/book', { method: 'POST' })).rejects.toThrow('Only students');
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it('reports network failures as status 0 so the UI can show cached data', async () => {
    fetchMock.mockRejectedValue(new TypeError('Network request failed'));
    const error = (await api('posts').catch((e: ApiError) => e)) as ApiError;
    expect(error.isNetworkError).toBe(true);
  });
});

describe('query building', () => {
  it('drops empty values and encodes the rest', () => {
    expect(buildUrl('posts', { city: 'Nugegoda & Kohuwala', minPrice: undefined, area: '' })).toBe(
      'http://localhost:8000/api/posts?city=Nugegoda%20%26%20Kohuwala',
    );
  });

  it('sends near-me searches as lat/lng/radius and ignores the city', () => {
    expect(listingQuery({ boardingType: 'annex', near: { lat: 6.914678, lng: 79.972412, radiusKm: 2 } })).toEqual({
      boardingType: 'annex',
      city: undefined,
      lat: '6.91468',
      lng: '79.97241',
      radiusKm: 2,
    });
  });
});
