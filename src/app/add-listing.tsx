import { zodResolver } from '@hookform/resolvers/zod';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button, ChipGroup, TextField } from '@/components/ui';
import { useAddListing } from '@/hooks/api';
import { notify } from '@/lib/dialogs';
import { boardingTypeLabel } from '@/lib/format';
import { buildListingFormData } from '@/lib/listingForm';
import { applyServerErrors } from '@/lib/useServerErrors';
import { radius, spacing, useColors } from '@/theme';
import { addListingSchema, type AddListingValues } from '@/validation/schemas';

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  quality: 0.7, // keeps uploads well under the API's 8 MB per-photo limit
  allowsEditing: true,
  aspect: [4, 3],
};

export default function AddListingScreen() {
  const c = useColors();
  const addListing = useAddListing();
  const [formError, setFormError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const {
    control,
    handleSubmit,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AddListingValues>({
    resolver: zodResolver(addListingSchema),
    defaultValues: {
      title: '',
      location: '',
      city: '',
      price: '',
      capacity: '1',
      boardingType: 'singleRoom',
      genderAllowed: 'any',
      description: '',
      latitude: null,
      longitude: null,
      photos: [],
    },
  });
  const [photos, latitude, longitude] = useWatch({ control, name: ['photos', 'latitude', 'longitude'] });

  async function addPhoto(source: 'camera' | 'library') {
    if (photos.length >= 5) return;
    if (source === 'camera') {
      const { granted } = await ImagePicker.requestCameraPermissionsAsync();
      if (!granted) {
        notify('Camera access needed', 'Allow camera access in Settings to photograph the room.');
        return;
      }
    }
    const result =
      source === 'camera' ? await ImagePicker.launchCameraAsync(PICKER_OPTIONS) : await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
    if (!result.canceled && result.assets[0]) {
      setValue('photos', [...photos, result.assets[0].uri], { shouldValidate: true });
    }
  }

  async function pinCurrentLocation() {
    setLocating(true);
    try {
      const { granted } = await Location.requestForegroundPermissionsAsync();
      if (!granted) {
        notify('Location access needed', 'Allow location access to pin the listing where you are standing.');
        return;
      }
      const { coords } = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setValue('latitude', coords.latitude, { shouldValidate: true });
      setValue('longitude', coords.longitude, { shouldValidate: true });
    } finally {
      setLocating(false);
    }
  }

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      const result = await addListing.mutateAsync(await buildListingFormData(values));
      notify('Listing published', result.boarding.title);
      router.back();
    } catch (error) {
      setFormError(applyServerErrors(error, setError, { 'images.0': 'photos', images: 'photos' }));
    }
  });

  const text = (name: 'title' | 'location' | 'city' | 'price' | 'capacity' | 'description', label: string, props: object = {}) => (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value } }) => (
        <TextField label={label} value={value} onChangeText={onChange} onBlur={onBlur} error={errors[name]?.message} {...props} />
      )}
    />
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={[styles.section, { color: c.text }]}>Photos ({photos.length}/5)</Text>
        <ScrollView horizontal contentContainerStyle={styles.photos}>
          {photos.map((uri) => (
            <Pressable
              key={uri}
              accessibilityLabel="Remove photo"
              onPress={() => setValue('photos', photos.filter((p) => p !== uri), { shouldValidate: true })}
            >
              <Image source={uri} style={styles.photo} contentFit="cover" />
              <Text style={styles.remove}>✕</Text>
            </Pressable>
          ))}
        </ScrollView>
        <View style={styles.row}>
          {Platform.OS !== 'web' ? (
            <Button title="Take photo" variant="secondary" onPress={() => addPhoto('camera')} style={{ flex: 1 }} disabled={photos.length >= 5} />
          ) : null}
          <Button title="From library" variant="secondary" onPress={() => addPhoto('library')} style={{ flex: 1 }} disabled={photos.length >= 5} />
        </View>
        {errors.photos ? <Text style={{ color: c.danger, marginTop: 4 }}>{errors.photos.message}</Text> : null}

        <Text style={[styles.section, { color: c.text }]}>Details</Text>
        {text('title', 'Title', { placeholder: 'e.g. Single room near SLIIT' })}
        {text('location', 'Address')}
        {text('city', 'City')}
        <View style={styles.row}>
          <View style={{ flex: 1 }}>{text('price', 'Rent per month (LKR)', { keyboardType: 'number-pad' })}</View>
          <View style={{ flex: 1 }}>{text('capacity', 'Capacity', { keyboardType: 'number-pad' })}</View>
        </View>
        <Controller
          control={control}
          name="boardingType"
          render={({ field }) => (
            <ChipGroup
              label="Room type"
              value={field.value}
              onChange={field.onChange}
              options={Object.entries(boardingTypeLabel).map(([value, label]) => ({ value: value as AddListingValues['boardingType'], label }))}
            />
          )}
        />
        <Controller
          control={control}
          name="genderAllowed"
          render={({ field }) => (
            <ChipGroup
              label="Tenants"
              value={field.value}
              onChange={field.onChange}
              options={[
                { value: 'any', label: 'Anyone' },
                { value: 'female', label: 'Female only' },
                { value: 'male', label: 'Male only' },
              ]}
            />
          )}
        />
        {text('description', 'Description (at least 10 words)', { multiline: true })}

        <Text style={[styles.section, { color: c.text }]}>Map pin</Text>
        <Text style={{ color: c.muted, marginBottom: spacing.sm }}>
          {latitude !== null && longitude !== null
            ? `Pinned at ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
            : 'Stand at the boarding and pin it, so students can find it with "Near me".'}
        </Text>
        <Button title={latitude !== null ? 'Re-pin current location' : 'Pin current location'} variant="secondary" onPress={pinCurrentLocation} loading={locating} />
        {errors.latitude ? <Text style={{ color: c.danger, marginTop: 4 }}>{errors.latitude.message}</Text> : null}

        {formError ? <Text style={[styles.formError, { color: c.danger }]}>{formError}</Text> : null}
        <Button title="Publish listing" onPress={onSubmit} loading={isSubmitting} style={{ marginTop: spacing.xl }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, paddingBottom: 48 },
  section: { fontSize: 17, fontWeight: '800', marginTop: spacing.lg, marginBottom: spacing.sm },
  photos: { gap: spacing.sm, marginBottom: spacing.sm },
  photo: { width: 110, height: 82, borderRadius: radius.sm, backgroundColor: '#ccd5e3' },
  remove: { position: 'absolute', top: 4, right: 6, color: '#fff', fontWeight: '900', textShadowColor: '#000', textShadowRadius: 4 },
  row: { flexDirection: 'row', gap: spacing.sm },
  formError: { marginTop: spacing.md, fontWeight: '600' },
});
