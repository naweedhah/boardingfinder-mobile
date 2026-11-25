import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import { radius, spacing, useColors } from '@/theme';

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}) {
  const c = useColors();
  const background = variant === 'primary' ? c.primary : variant === 'danger' ? c.danger : c.chipBg;
  const color = variant === 'secondary' ? c.text : c.primaryText;
  const inactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: background, opacity: inactive ? 0.6 : pressed ? 0.85 : 1 },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={color} /> : <Text style={[styles.buttonText, { color }]}>{title}</Text>}
    </Pressable>
  );
}

export function TextField({ label, error, ...props }: TextInputProps & { label: string; error?: string }) {
  const c = useColors();
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: c.text }]}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={c.muted}
        {...props}
        style={[
          styles.input,
          { color: c.text, backgroundColor: c.surface, borderColor: error ? c.danger : c.border },
          props.multiline && { minHeight: 110, textAlignVertical: 'top' },
          props.style,
        ]}
      />
      {error ? (
        <Text accessibilityRole="alert" style={[styles.error, { color: c.danger }]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

/** Single-choice row of chips (used for gender, role, room type). */
export function ChipGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  error,
}: {
  label?: string;
  options: { value: T; label: string }[];
  value: T | undefined;
  onChange: (value: T) => void;
  error?: string;
}) {
  const c = useColors();
  return (
    <View style={styles.field}>
      {label ? <Text style={[styles.label, { color: c.text }]}>{label}</Text> : null}
      <View style={styles.chips}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => onChange(option.value)}
              style={[styles.chip, { backgroundColor: selected ? c.primary : c.chipBg }]}
            >
              <Text style={{ color: selected ? c.primaryText : c.text, fontWeight: '600' }}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
      {error ? <Text style={[styles.error, { color: c.danger }]}>{error}</Text> : null}
    </View>
  );
}

export function Centered({ children }: { children: ReactNode }) {
  return <View style={styles.centered}>{children}</View>;
}

export function LoadingView() {
  const c = useColors();
  return (
    <Centered>
      <ActivityIndicator size="large" color={c.primary} />
    </Centered>
  );
}

export function ErrorView({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const c = useColors();
  const message = error instanceof Error ? error.message : 'Something went wrong.';
  return (
    <Centered>
      <Text style={[styles.emptyTitle, { color: c.text }]}>{"Couldn't load this"}</Text>
      <Text style={[styles.emptyText, { color: c.muted }]}>{message}</Text>
      {onRetry ? <Button title="Try again" variant="secondary" onPress={onRetry} style={{ marginTop: spacing.lg }} /> : null}
    </Centered>
  );
}

export function EmptyState({ title, message }: { title: string; message?: string }) {
  const c = useColors();
  return (
    <Centered>
      <Text style={[styles.emptyTitle, { color: c.text }]}>{title}</Text>
      {message ? <Text style={[styles.emptyText, { color: c.muted }]}>{message}</Text> : null}
    </Centered>
  );
}

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: 'neutral' | 'success' | 'warning' | 'danger' }) {
  const c = useColors();
  const color = { neutral: c.muted, success: c.success, warning: c.warning, danger: c.danger }[tone];
  return (
    <View style={[styles.badge, { borderColor: color }]}>
      <Text style={{ color, fontSize: 12, fontWeight: '700' }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { fontSize: 16, fontWeight: '700' },
  field: { marginBottom: spacing.md },
  label: { fontSize: 14, fontWeight: '600', marginBottom: spacing.xs },
  input: { borderWidth: 1, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: 10, fontSize: 16 },
  error: { fontSize: 13, marginTop: spacing.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.pill },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  emptyTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  emptyText: { fontSize: 15, textAlign: 'center', marginTop: spacing.sm },
  badge: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2, alignSelf: 'flex-start' },
});
