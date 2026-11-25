import { useQueryClient } from '@tanstack/react-query';
import Echo from 'laravel-echo';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import type { AppNotification, ChatDetail, ChatSummary, Message } from '@/api/types';
import { useAuth } from '@/auth/AuthProvider';
import { tokenStorage } from '@/auth/tokenStorage';
import { config } from '@/config';
import { queryKeys } from '@/hooks/queryKeys';
import Pusher from './pusher';

type Connection = 'idle' | 'connecting' | 'connected' | 'unavailable';
const RealtimeContext = createContext<Connection>('idle');

/** Appends a live message to an open conversation's cache, ignoring duplicates. */
export function mergeIncomingMessage(chat: ChatDetail | undefined, message: Message): ChatDetail | undefined {
  if (!chat || chat.id !== message.chatId) return chat;
  if (chat.messages.some((m) => m.id === message.id)) return chat;
  return { ...chat, lastMessage: message.text, messages: [...chat.messages, message] };
}

/**
 * One WebSocket connection to Laravel Reverb per signed-in session. The API authorises the
 * private channel `users.{id}` with the same bearer token the REST calls use. Events are
 * written straight into the React Query cache, so every screen updates without polling.
 * If Reverb is unreachable the app still works; screens refresh on focus instead.
 */
export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { state } = useAuth();
  const queryClient = useQueryClient();
  const [connection, setConnection] = useState<Connection>('idle');
  const userId = state.status === 'signedIn' ? state.user.id : null;

  useEffect(() => {
    if (!userId) return;
    let echo: Echo<'reverb'> | null = null;
    let cancelled = false;

    (async () => {
      const token = await tokenStorage.getToken();
      if (!token || cancelled) return;

      setConnection('connecting');
      echo = new Echo({
        broadcaster: 'reverb',
        Pusher,
        key: config.reverb.key,
        wsHost: config.reverb.host,
        wsPort: config.reverb.port,
        wssPort: config.reverb.port,
        forceTLS: config.reverb.scheme === 'https',
        enabledTransports: ['ws', 'wss'],
        authEndpoint: `${config.apiUrl}/api/broadcasting/auth`,
        auth: { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } },
      });

      const pusher = (echo.connector as { pusher: { connection: { bind: (e: string, cb: (s: { current: string }) => void) => void } } }).pusher;
      pusher.connection.bind('state_change', ({ current }) => {
        setConnection(current === 'connected' ? 'connected' : current === 'unavailable' || current === 'failed' ? 'unavailable' : 'connecting');
      });

      echo
        .private(`users.${userId}`)
        .listen('.message.new', (message: Message) => {
          queryClient.setQueryData<ChatDetail>(queryKeys.chat(message.chatId), (chat) => mergeIncomingMessage(chat, message));
          queryClient.setQueryData<ChatSummary[]>(queryKeys.chats, (chats) =>
            chats?.map((c) => (c.id === message.chatId ? { ...c, lastMessage: message.text, seenBy: [] } : c)),
          );
          void queryClient.invalidateQueries({ queryKey: queryKeys.chats });
        })
        .listen('.notification.new', (notification: AppNotification) => {
          void queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
          if (notification.type.startsWith('booking')) {
            void queryClient.invalidateQueries({ queryKey: queryKeys.bookings });
          }
        })
        .listen('.notification.read', () => void queryClient.invalidateQueries({ queryKey: queryKeys.notifications }));
    })();

    return () => {
      cancelled = true;
      echo?.disconnect();
      setConnection('idle');
    };
  }, [userId, queryClient]);

  return <RealtimeContext.Provider value={connection}>{children}</RealtimeContext.Provider>;
}

export const useRealtimeConnection = () => useContext(RealtimeContext);
