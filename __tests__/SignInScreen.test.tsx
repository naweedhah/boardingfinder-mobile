import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { ApiError } from '@/api/client';
import SignInScreen from '@/app/sign-in';

const mockSignIn = jest.fn();
jest.mock('@/auth/AuthProvider', () => ({ useAuth: () => ({ signIn: mockSignIn }) }));
jest.mock('expo-router', () => {
  const { Text } = jest.requireActual('react-native');
  return { Link: ({ children }: { children: React.ReactNode }) => <Text>{children}</Text> };
});

describe('SignInScreen', () => {
  beforeEach(() => mockSignIn.mockReset());

  it('validates on the phone before calling the API', async () => {
    await render(<SignInScreen />);
    await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Enter a valid username to continue.')).toBeOnTheScreen();
    expect(screen.getByText('Password must be at least 8 characters long.')).toBeOnTheScreen();
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('signs in with the trimmed username', async () => {
    mockSignIn.mockResolvedValue({ id: 'u1' });
    await render(<SignInScreen />);

    await fireEvent.changeText(screen.getByLabelText('Username'), '  demo_student ');
    await fireEvent.changeText(screen.getByLabelText('Password'), 'password123');
    await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => expect(mockSignIn).toHaveBeenCalledWith('demo_student', 'password123'));
  });

  it("shows the server's message for wrong credentials", async () => {
    mockSignIn.mockRejectedValue(new ApiError('Invalid Credentials!', 401));
    await render(<SignInScreen />);

    await fireEvent.changeText(screen.getByLabelText('Username'), 'demo_student');
    await fireEvent.changeText(screen.getByLabelText('Password'), 'wrong-password');
    await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Invalid Credentials!')).toBeOnTheScreen();
  });
});
