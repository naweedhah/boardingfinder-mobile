import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';

import { ApiError } from '@/api/client';

/**
 * Copies Laravel's 422 field errors onto the matching form fields, so a rule only the server
 * can check (e.g. "username already taken") appears under the right input.
 */
export function applyServerErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fieldMap: Partial<Record<string, Path<T>>> = {},
): string | null {
  if (!(error instanceof ApiError)) return 'Something went wrong. Please try again.';

  let matched = false;
  for (const [serverField, messages] of Object.entries(error.fields)) {
    const field = (fieldMap[serverField] ?? serverField) as Path<T>;
    if (messages[0]) {
      setError(field, { type: 'server', message: messages[0] });
      matched = true;
    }
  }
  return matched ? null : error.message;
}
