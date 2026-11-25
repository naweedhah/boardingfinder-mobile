import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';

import { endpoints } from '@/api/endpoints';
import { useAuth } from '@/auth/AuthProvider';
import { Button, ChipGroup, TextField } from '@/components/ui';
import { notify } from '@/lib/dialogs';
import { applyServerErrors } from '@/lib/useServerErrors';
import { spacing, useColors } from '@/theme';
import { registerSchema, type RegisterValues } from '@/validation/schemas';

type TextFieldName = 'fullName' | 'username' | 'email' | 'phone' | 'password';

const TEXT_FIELDS: { name: TextFieldName; label: string; props?: object }[] = [
  { name: 'fullName', label: 'Full name', props: { autoComplete: 'name', textContentType: 'name' } },
  { name: 'username', label: 'Username', props: { autoCapitalize: 'none', autoCorrect: false } },
  { name: 'email', label: 'Email', props: { autoCapitalize: 'none', keyboardType: 'email-address', autoComplete: 'email' } },
  { name: 'phone', label: 'Phone (10 digits)', props: { keyboardType: 'phone-pad', autoComplete: 'tel' } },
  { name: 'password', label: 'Password', props: { secureTextEntry: true, autoComplete: 'new-password' } },
];

export default function RegisterScreen() {
  const c = useColors();
  const { signIn } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: '', username: '', email: '', phone: '', password: '', role: 'student' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await endpoints.register(values);
    } catch (error) {
      // 409 = username/email taken; show it under the right field.
      if (error instanceof Error && 'status' in error && error.status === 409) {
        const field = /username/i.test(error.message) ? 'username' : 'email';
        setError(field, { message: error.message });
        return;
      }
      setFormError(applyServerErrors(error, setError));
      return;
    }
    try {
      await signIn(values.username, values.password);
    } catch {
      notify('Account created', 'Please sign in with your new account.');
      router.back();
    }
  });

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Controller
          control={control}
          name="role"
          render={({ field }) => (
            <ChipGroup
              label="I am a"
              value={field.value}
              onChange={field.onChange}
              error={errors.role?.message}
              options={[
                { value: 'student', label: 'Student' },
                { value: 'boardingOwner', label: 'Boarding owner' },
              ]}
            />
          )}
        />
        {TEXT_FIELDS.map(({ name, label, props }) => (
          <Controller
            key={name}
            control={control}
            name={name}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                label={label}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors[name]?.message}
                {...props}
              />
            )}
          />
        ))}
        <Controller
          control={control}
          name="gender"
          render={({ field }) => (
            <ChipGroup
              label="Gender"
              value={field.value}
              onChange={field.onChange}
              error={errors.gender?.message}
              options={[
                { value: 'female', label: 'Female' },
                { value: 'male', label: 'Male' },
                { value: 'other', label: 'Other' },
                { value: 'preferNotToSay', label: 'Prefer not to say' },
              ]}
            />
          )}
        />
        {formError ? <Text style={[styles.formError, { color: c.danger }]}>{formError}</Text> : null}
        <Button title="Create account" onPress={onSubmit} loading={isSubmitting} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.xl },
  formError: { marginBottom: spacing.md, fontWeight: '600' },
});
