import { z } from 'zod';

/**
 * Client-side validation. The rules and messages mirror the Laravel Form Requests, so users see
 * the same wording whether a mistake is caught on the phone or by the server, and the server
 * stays the authority (its 422 field errors are shown inline too).
 */

export const SRI_LANKA = { minLat: 5.85, maxLat: 9.9, minLng: 79.5, maxLng: 81.95 } as const;

export const signInSchema = z.object({
  username: z.string().trim().min(3, 'Enter a valid username to continue.'),
  password: z.string().min(8, 'Password must be at least 8 characters long.'),
});
export type SignInValues = z.infer<typeof signInSchema>;

export const registerSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Full name must be at least 2 characters long.')
    .regex(/^[A-Za-z\s'.-]+$/, 'Full name can only contain letters and common name symbols.'),
  username: z
    .string()
    .trim()
    .regex(/^[a-zA-Z0-9_]{3,20}$/, 'Username must be 3-20 characters and use only letters, numbers, or underscores.'),
  email: z.string().trim().toLowerCase().pipe(z.email('Enter a valid email address.')),
  phone: z.string().trim().regex(/^\d{10}$/, 'Phone number must contain exactly 10 digits.'),
  password: z.string().min(8, 'Password must be at least 8 characters long.'),
  gender: z.enum(['male', 'female', 'other', 'preferNotToSay'], 'Select a valid gender.'),
  role: z.enum(['student', 'boardingOwner'], 'Select a valid user type.'),
});
export type RegisterValues = z.infer<typeof registerSchema>;

const wordCount = (html: string) =>
  html
    .replace(/<[^>]*>/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

/** Number typed into a text field: digits only, within bounds. */
const integerField = (label: string, min: number, max: number) =>
  z
    .string()
    .trim()
    .regex(/^\d+$/, `${label} must be a whole number.`)
    .refine((v) => Number(v) >= min && Number(v) <= max, `${label} must be between ${min} and ${max.toLocaleString()}.`);

export const addListingSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(5, 'Title must be between 5 and 60 characters.')
      .max(60, 'Title must be between 5 and 60 characters.'),
    location: z.string().trim().min(3, 'Address must be at least 3 characters.').max(255),
    city: z.string().trim().min(3, 'City must be at least 3 characters.').max(100),
    price: integerField('Monthly rent', 1, 1_000_000),
    capacity: integerField('Capacity', 1, 50),
    boardingType: z.enum(['singleRoom', 'sharedRoom', 'annex', 'hostel', 'houseShare']),
    genderAllowed: z.enum(['male', 'female', 'any']),
    description: z.string().refine((v) => wordCount(v) >= 10, 'Description must be at least 10 words.'),
    latitude: z.number().nullable(),
    longitude: z.number().nullable(),
    photos: z.array(z.string()).min(1, 'Add at least one photo of the room.').max(5, 'You can add up to 5 photos.'),
  })
  .refine(
    (v) =>
      v.latitude === null ||
      v.longitude === null ||
      (v.latitude >= SRI_LANKA.minLat &&
        v.latitude <= SRI_LANKA.maxLat &&
        v.longitude >= SRI_LANKA.minLng &&
        v.longitude <= SRI_LANKA.maxLng),
    { message: 'The map pin must be in Sri Lanka.', path: ['latitude'] },
  );
export type AddListingValues = z.infer<typeof addListingSchema>;

export const reviewSchema = z.object({
  rating: z.number().int().min(1, 'Rating must be between 1 and 5').max(5, 'Rating must be between 1 and 5'),
  comment: z.string().trim().max(2000, 'Keep the review under 2000 characters.').optional(),
});

export const messageSchema = z.string().trim().min(1, 'Message text is required').max(5000, 'Message is too long.');
