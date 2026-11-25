import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/AuthProvider';
import { Button, TextField } from '@/components/ui';
import { applyServerErrors } from '@/lib/useServerErrors';
import { spacing, useColors } from '@/theme';
import { signInSchema, type SignInValues } from '@/validation/schemas';

export default function SignInScreen() {
  const c = useColors();
  const { signIn } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignInValues>({ resolver: zodResolver(signInSchema), defaultValues: { username: '', password: '' } });

  const onSubmit = handleSubmit(async ({ username, password }) => {
    setFormError(null);
    try {
      await signIn(username, password);
      // Stack.Protected swaps to the app automatically once signed in.
    } catch (error) {
      setFormError(applyServerErrors(error, setError));
    }
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={[styles.brand, { color: c.primary }]}>BoardingFinder</Text>
          <Text style={[styles.tagline, { color: c.muted }]}>Student rooms near your campus</Text>

          <Controller
            control={control}
            name="username"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                label="Username"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="username"
                textContentType="username"
                error={errors.username?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                label="Password"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                secureTextEntry
                autoComplete="current-password"
                textContentType="password"
                onSubmitEditing={() => void onSubmit()}
                error={errors.password?.message}
              />
            )}
          />

          {formError ? (
            <Text accessibilityRole="alert" style={[styles.formError, { color: c.danger }]}>
              {formError}
            </Text>
          ) : null}

          <Button title="Sign in" onPress={onSubmit} loading={isSubmitting} />

          <Link href="/register" style={StyleSheet.flatten([styles.link, { color: c.primary }])}>
            New here? Create an account
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl },
  brand: { fontSize: 32, fontWeight: '800', textAlign: 'center' },
  tagline: { fontSize: 16, textAlign: 'center', marginTop: spacing.xs, marginBottom: spacing.xl },
  formError: { marginBottom: spacing.md, fontWeight: '600' },
  link: { textAlign: 'center', marginTop: spacing.lg, fontWeight: '600', fontSize: 15 },
});
