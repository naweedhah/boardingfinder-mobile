import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { endpoints } from '@/api/endpoints';
import type { Message } from '@/api/types';
import { useCurrentUser } from '@/auth/AuthProvider';
import { ErrorView, LoadingView } from '@/components/ui';
import { useChat, useSendMessage } from '@/hooks/api';
import { notify } from '@/lib/dialogs';
import { timeAgo } from '@/lib/format';
import { radius, spacing, useColors } from '@/theme';
import { messageSchema } from '@/validation/schemas';

export default function ChatScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const c = useColors();
  const me = useCurrentUser();
  const insets = useSafeAreaInsets();
  const { data: chat, error, isLoading, refetch } = useChat(id);
  const send = useSendMessage(id, me.id);
  const [text, setText] = useState('');
  const listRef = useRef<FlatList<Message>>(null);

  // Opening the conversation marks it read for this user.
  useEffect(() => {
    endpoints.markChatRead(id).catch(() => {});
  }, [id, chat?.messages.length]);

  function submit() {
    const parsed = messageSchema.safeParse(text);
    if (!parsed.success) return;
    setText('');
    send.mutate(parsed.data, {
      onError: (e) => {
        setText(parsed.data); // give the text back so nothing is lost
        notify('Message not sent', e.message);
      },
    });
  }

  if (isLoading) return <LoadingView />;
  if (!chat) return <ErrorView error={error} onRetry={() => void refetch()} />;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <Stack.Screen options={{ title: name ?? 'Chat' }} />
      <FlatList
        ref={listRef}
        data={chat.messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        renderItem={({ item }) => {
          const mine = item.userId === me.id;
          return (
            <View style={[styles.bubbleRow, { justifyContent: mine ? 'flex-end' : 'flex-start' }]}>
              <View
                style={[
                  styles.bubble,
                  { backgroundColor: mine ? c.bubbleMine : c.bubbleTheirs, borderColor: c.border, opacity: item.pending ? 0.6 : 1 },
                ]}
              >
                {!mine && item.scamFlag && item.scamFlag !== 'safe' ? (
                  <Text accessibilityRole="alert" style={[styles.warning, { color: c.danger }]}>
                    ⚠ This message looks {item.scamFlag === 'danger' ? 'like a scam' : 'suspicious'}. Never pay before visiting.
                  </Text>
                ) : null}
                <Text style={{ color: mine ? '#fff' : c.text, fontSize: 16 }}>{item.text}</Text>
                <Text style={[styles.time, { color: mine ? '#E0EAF7' : c.muted }]}>
                  {item.pending ? 'Sending…' : timeAgo(item.createdAt)}
                </Text>
              </View>
            </View>
          );
        }}
      />
      <View style={[styles.composer, { backgroundColor: c.surface, borderColor: c.border, paddingBottom: insets.bottom + spacing.sm }]}>
        <TextInput
          accessibilityLabel="Message"
          placeholder="Write a message"
          placeholderTextColor={c.muted}
          value={text}
          onChangeText={setText}
          multiline
          maxLength={5000}
          style={[styles.input, { color: c.text, backgroundColor: c.background }]}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Send"
          onPress={submit}
          disabled={!text.trim()}
          style={[styles.send, { backgroundColor: c.primary, opacity: text.trim() ? 1 : 0.5 }]}
        >
          <Text style={{ color: c.primaryText, fontWeight: '800' }}>Send</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.md, gap: spacing.sm },
  bubbleRow: { flexDirection: 'row' },
  bubble: { maxWidth: '80%', borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderWidth: StyleSheet.hairlineWidth },
  warning: { fontWeight: '700', marginBottom: 4, fontSize: 13 },
  time: { fontSize: 11, marginTop: 2, textAlign: 'right' },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, padding: spacing.sm, borderTopWidth: 1 },
  input: { flex: 1, maxHeight: 120, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 10, fontSize: 16 },
  send: { paddingHorizontal: spacing.lg, paddingVertical: 12, borderRadius: radius.md },
});
