import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { endpoints } from '@/api/endpoints';
import type { ChatDetail, ListingDetail, Message } from '@/api/types';
import { useSendMessage, useToggleSaved } from '@/hooks/api';
import { queryKeys } from '@/hooks/queryKeys';
import { mergeIncomingMessage } from '@/realtime/RealtimeProvider';

jest.mock('@/api/endpoints', () => ({
  endpoints: { toggleSaved: jest.fn(), sendMessage: jest.fn(), listing: jest.fn(), savedListings: jest.fn() },
}));
// The provider module imports pusher-js/laravel-echo; only its pure helper is under test here.
jest.mock('@/realtime/pusher', () => ({ __esModule: true, default: jest.fn() }));

const mocked = endpoints as jest.Mocked<typeof endpoints>;

function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity, staleTime: Infinity }, mutations: { gcTime: Infinity } } });
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  return { client, wrapper };
}

const message = (overrides: Partial<Message>): Message => ({
  id: 'm1',
  chatId: 'c1',
  userId: 'me',
  text: 'Hello',
  scamFlag: 'safe',
  createdAt: '2026-11-25T10:00:00Z',
  ...overrides,
});

describe('useToggleSaved', () => {
  beforeEach(() => jest.clearAllMocks());

  it('flips the heart before the server answers', async () => {
    const { client, wrapper } = setup();
    client.setQueryData(queryKeys.listing('p1'), { id: 'p1', isSaved: false } as ListingDetail);
    let resolve!: (v: { message: string }) => void;
    mocked.toggleSaved.mockReturnValue(new Promise((r) => (resolve = r)));

    const { result } = await renderHook(() => useToggleSaved('p1'), { wrapper });
    await act(() => result.current.mutate());

    await waitFor(() => expect(client.getQueryData<ListingDetail>(queryKeys.listing('p1'))?.isSaved).toBe(true));
    await act(async () => resolve({ message: 'Listing saved' }));
  });

  it('rolls back when the request fails (e.g. offline)', async () => {
    const { client, wrapper } = setup();
    client.setQueryData(queryKeys.listing('p1'), { id: 'p1', isSaved: true } as ListingDetail);
    mocked.toggleSaved.mockRejectedValue(new Error('offline'));
    mocked.listing.mockReturnValue(new Promise(() => {})); // keep the post-error refetch pending

    const { result } = await renderHook(() => useToggleSaved('p1'), { wrapper });
    await act(async () => {
      await result.current.mutateAsync().catch(() => {});
    });

    expect(client.getQueryData<ListingDetail>(queryKeys.listing('p1'))?.isSaved).toBe(true);
  });
});

describe('useSendMessage', () => {
  beforeEach(() => jest.clearAllMocks());
  const chat = (messages: Message[]): ChatDetail => ({ id: 'c1', userIDs: [], seenBy: [], lastMessage: null, updatedAt: '', messages });

  it('shows the message immediately, then swaps in the stored copy', async () => {
    const { client, wrapper } = setup();
    client.setQueryData(queryKeys.chat('c1'), chat([]));
    let resolve!: (m: Message) => void;
    mocked.sendMessage.mockReturnValue(new Promise((r) => (resolve = r)));

    const { result } = await renderHook(() => useSendMessage('c1', 'me'), { wrapper });
    await act(() => result.current.mutate('Is the room free?'));

    await waitFor(() => {
      const messages = client.getQueryData<ChatDetail>(queryKeys.chat('c1'))!.messages;
      expect(messages).toHaveLength(1);
      expect(messages[0]).toMatchObject({ text: 'Is the room free?', pending: true });
    });

    await act(async () => resolve(message({ id: 'server-1', text: 'Is the room free?' })));

    const messages = client.getQueryData<ChatDetail>(queryKeys.chat('c1'))!.messages;
    expect(messages).toEqual([expect.objectContaining({ id: 'server-1' })]);
    expect(messages[0]!.pending).toBeUndefined();
  });

  it('does not duplicate when the WebSocket echo arrived first', async () => {
    const { client, wrapper } = setup();
    client.setQueryData(queryKeys.chat('c1'), chat([]));
    const saved = message({ id: 'server-1' });
    mocked.sendMessage.mockImplementation(async () => {
      client.setQueryData<ChatDetail>(queryKeys.chat('c1'), (c) => mergeIncomingMessage(c, saved));
      return saved;
    });

    const { result } = await renderHook(() => useSendMessage('c1', 'me'), { wrapper });
    await act(async () => {
      await result.current.mutateAsync('Hello');
    });

    expect(client.getQueryData<ChatDetail>(queryKeys.chat('c1'))!.messages.map((m) => m.id)).toEqual(['server-1']);
  });

  it('removes the pending bubble if sending fails', async () => {
    const { client, wrapper } = setup();
    client.setQueryData(queryKeys.chat('c1'), chat([]));
    mocked.sendMessage.mockRejectedValue(new Error('offline'));

    const { result } = await renderHook(() => useSendMessage('c1', 'me'), { wrapper });
    await act(async () => {
      await result.current.mutateAsync('Hello').catch(() => {});
    });

    expect(client.getQueryData<ChatDetail>(queryKeys.chat('c1'))!.messages).toEqual([]);
  });
});

describe('mergeIncomingMessage', () => {
  const base: ChatDetail = { id: 'c1', userIDs: [], seenBy: [], lastMessage: null, updatedAt: '', messages: [message({})] };

  it('appends new messages and updates the preview', () => {
    const next = mergeIncomingMessage(base, message({ id: 'm2', text: 'Yes, still free' }));
    expect(next?.messages).toHaveLength(2);
    expect(next?.lastMessage).toBe('Yes, still free');
  });

  it('ignores duplicates and messages for other chats', () => {
    expect(mergeIncomingMessage(base, message({}))).toBe(base);
    expect(mergeIncomingMessage(base, message({ id: 'x', chatId: 'other' }))).toBe(base);
  });
});
