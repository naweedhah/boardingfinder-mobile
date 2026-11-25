import { Platform } from 'react-native';

import type { AddListingValues } from '@/validation/schemas';

/**
 * Builds the multipart body for `POST /api/boardings/add`. Photos go up as `images[]` (PHP only
 * keeps repeated fields when the name ends in []). On iOS/Android, React Native's FormData
 * accepts `{ uri, name, type }` file parts; the web build must send real Blobs.
 */
export async function buildListingFormData(values: AddListingValues): Promise<FormData> {
  const form = new FormData();
  form.append('title', values.title.trim());
  form.append('location', values.location.trim());
  form.append('city', values.city.trim());
  form.append('price', values.price);
  form.append('capacity', values.capacity);
  form.append('boardingType', values.boardingType);
  form.append('genderAllowed', values.genderAllowed);
  form.append('description', values.description.trim());
  if (values.latitude !== null && values.longitude !== null) {
    form.append('latitude', values.latitude.toFixed(7));
    form.append('longitude', values.longitude.toFixed(7));
  }

  for (const [index, uri] of values.photos.entries()) {
    const name = `room-${index + 1}.jpg`;
    if (Platform.OS === 'web') {
      const blob = await (await fetch(uri)).blob();
      form.append('images[]', blob, name);
    } else {
      form.append('images[]', { uri, name, type: 'image/jpeg' } as unknown as Blob);
    }
  }
  return form;
}
