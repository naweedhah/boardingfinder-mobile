import { addListingSchema, registerSchema, signInSchema } from '@/validation/schemas';

const firstError = (result: { success: boolean; error?: { issues: { message: string }[] } }) =>
  result.success ? null : result.error!.issues[0]!.message;

describe('registerSchema mirrors the API rules', () => {
  const valid = {
    fullName: "Nadeesha O'Brien-Perera",
    username: 'nadeesha_p',
    email: '  Nadeesha@Example.com ',
    phone: '0771234567',
    password: 'password123',
    gender: 'female',
    role: 'student',
  };

  it('accepts a valid sign-up and normalises the email', () => {
    const result = registerSchema.safeParse(valid);
    expect(result.success).toBe(true);
    expect(result.data?.email).toBe('nadeesha@example.com');
  });

  it.each([
    [{ fullName: 'Bob 3' }, 'Full name can only contain letters and common name symbols.'],
    [{ username: 'a b' }, 'Username must be 3-20 characters and use only letters, numbers, or underscores.'],
    [{ email: 'nope' }, 'Enter a valid email address.'],
    [{ phone: '077123' }, 'Phone number must contain exactly 10 digits.'],
    [{ password: 'short' }, 'Password must be at least 8 characters long.'],
    [{ role: 'admin' }, 'Select a valid user type.'],
  ])('rejects %j', (override, message) => {
    expect(firstError(registerSchema.safeParse({ ...valid, ...override }))).toBe(message);
  });
});

describe('signInSchema', () => {
  it('trims the username', () => {
    expect(signInSchema.parse({ username: '  kasun ', password: 'password123' }).username).toBe('kasun');
  });
});

describe('addListingSchema', () => {
  const valid = {
    title: 'Single room near SLIIT',
    location: '12 Temple Road',
    city: 'Malabe',
    price: '25000',
    capacity: '2',
    boardingType: 'singleRoom',
    genderAllowed: 'any',
    description: 'A bright, quiet single room with a desk, fan and fast Wi-Fi close to campus.',
    latitude: 6.9147,
    longitude: 79.9733,
    photos: ['file:///room.jpg'],
  };

  it('accepts a complete listing', () => {
    expect(addListingSchema.safeParse(valid).success).toBe(true);
  });

  it.each([
    [{ title: 'Room' }, 'Title must be between 5 and 60 characters.'],
    [{ price: '25,000' }, 'Monthly rent must be a whole number.'],
    [{ price: '0' }, 'Monthly rent must be between 1 and 1,000,000.'],
    [{ capacity: '99' }, 'Capacity must be between 1 and 50.'],
    [{ description: '<p>Nice room near campus</p>' }, 'Description must be at least 10 words.'],
    [{ photos: [] }, 'Add at least one photo of the room.'],
    // Swapped latitude/longitude puts the pin in the Indian Ocean.
    [{ latitude: 79.9733, longitude: 6.9147 }, 'The map pin must be in Sri Lanka.'],
  ])('rejects %j', (override, message) => {
    expect(firstError(addListingSchema.safeParse({ ...valid, ...override }))).toBe(message);
  });

  it('allows a listing without a map pin', () => {
    expect(addListingSchema.safeParse({ ...valid, latitude: null, longitude: null }).success).toBe(true);
  });
});
