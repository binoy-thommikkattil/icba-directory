import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Login from '@/app/login/page';
import { authUsers, userProfiles } from '@/tests/fixtures/data';

const mocks = vi.hoisted(() => ({
  authState: {
    user: null as any,
    role: null as any,
    userProfile: null as any,
    loading: false,
    logout: vi.fn(),
  },
  routerPush: vi.fn(),
  auth: { currentUser: null as any },
  signInWithPopup: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  updateProfile: vi.fn(),
  signInWithPhoneNumber: vi.fn(),
  recaptchaVerifier: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
}));

vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => mocks.authState,
}));

vi.mock('@/lib/firebase', () => ({
  auth: mocks.auth,
  db: { app: 'test-db' },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.routerPush }),
}));

vi.mock('firebase/auth', () => ({
  GoogleAuthProvider: vi.fn(function GoogleAuthProvider() {}),
  RecaptchaVerifier: vi.fn(function RecaptchaVerifier() {
    return { render: vi.fn(async () => 1) };
  }),
  signInWithPopup: mocks.signInWithPopup,
  signInWithEmailAndPassword: mocks.signInWithEmailAndPassword,
  createUserWithEmailAndPassword: mocks.createUserWithEmailAndPassword,
  updateProfile: mocks.updateProfile,
  signInWithPhoneNumber: mocks.signInWithPhoneNumber,
}));

vi.mock('firebase/firestore', () => ({
  doc: mocks.doc,
  getDoc: mocks.getDoc,
  setDoc: mocks.setDoc,
}));

describe('Login page workflows', () => {
  beforeEach(() => {
    mocks.authState.user = null;
    mocks.authState.role = null;
    mocks.authState.userProfile = null;
    mocks.authState.loading = false;
    mocks.auth.currentUser = { ...authUsers.approved };
    mocks.doc.mockImplementation((_db: unknown, collectionName: string, docId: string) => ({ collectionName, docId }));
    mocks.getDoc.mockResolvedValue({ exists: () => true, data: () => userProfiles.approved });
    mocks.setDoc.mockResolvedValue(undefined);
    mocks.updateProfile.mockResolvedValue(undefined);
    (window as any).grecaptcha = { reset: vi.fn() };
    (window as any).recaptchaVerifier = undefined;
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ ok: true }) })));
  });

  it('redirects pending users to the waiting room', async () => {
    mocks.authState.user = authUsers.pending;
    mocks.authState.role = 'pending';
    mocks.authState.userProfile = userProfiles.pending;

    render(<Login />);

    await waitFor(() => expect(mocks.routerPush).toHaveBeenCalledWith('/waiting-room'));
  });

  it('redirects approved and admin users to the dashboard', async () => {
    mocks.authState.user = authUsers.approved;
    mocks.authState.role = 'approved';
    mocks.authState.userProfile = userProfiles.approved;

    const { rerender } = render(<Login />);
    await waitFor(() => expect(mocks.routerPush).toHaveBeenCalledWith('/dashboard'));

    mocks.routerPush.mockClear();
    mocks.authState.user = authUsers.admin;
    mocks.authState.role = 'admin';
    mocks.authState.userProfile = userProfiles.admin;
    rerender(<Login />);

    await waitFor(() => expect(mocks.routerPush).toHaveBeenCalledWith('/dashboard'));
  });

  it('signs in with email and creates the secure session cookie', async () => {
    const browserUser = { ...authUsers.approved, getIdToken: vi.fn(async () => 'email-token') };
    mocks.signInWithEmailAndPassword.mockResolvedValue({ user: browserUser });
    const user = userEvent.setup();

    render(<Login />);
    await user.type(screen.getByPlaceholderText('your@email.com'), 'approved@example.com');
    await user.type(document.querySelector('input[type="password"]') as HTMLInputElement, 'secret123');
    await user.click(screen.getByRole('button', { name: /sign in with email/i }));

    await waitFor(() => expect(mocks.signInWithEmailAndPassword).toHaveBeenCalledWith(mocks.auth, 'approved@example.com', 'secret123'));
    expect(browserUser.getIdToken).toHaveBeenCalled();
    expect(fetch).toHaveBeenCalledWith('/api/session', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ idToken: 'email-token' }),
    }));
  });

  it('creates a new email account and pending Firestore profile', async () => {
    const browserUser = { ...authUsers.pending, uid: 'new-email-user', email: 'new@example.com', getIdToken: vi.fn(async () => 'signup-token') };
    mocks.createUserWithEmailAndPassword.mockResolvedValue({ user: browserUser });
    const user = userEvent.setup();

    render(<Login />);
    await user.click(screen.getByRole('button', { name: /sign up/i }));
    await user.type(screen.getByPlaceholderText(/john mark/i), 'New Member');
    await user.type(screen.getByPlaceholderText('your@email.com'), 'new@example.com');
    await user.type(document.querySelector('input[type="password"]') as HTMLInputElement, 'secret123');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => expect(mocks.createUserWithEmailAndPassword).toHaveBeenCalledWith(mocks.auth, 'new@example.com', 'secret123'));
    expect(mocks.updateProfile).toHaveBeenCalledWith(browserUser, { displayName: 'New Member' });
    expect(mocks.setDoc).toHaveBeenCalledWith({ collectionName: 'users', docId: 'new-email-user' }, expect.objectContaining({
      email: 'new@example.com',
      name: 'New Member',
      role: 'pending',
      createdAt: expect.any(String),
    }));
  });

  it('creates a first-time Google profile only when the user document is missing', async () => {
    const browserUser = { ...authUsers.pending, uid: 'google-user', email: 'google@example.com', displayName: 'Google Member', getIdToken: vi.fn(async () => 'google-token') };
    mocks.signInWithPopup.mockResolvedValue({ user: browserUser });
    mocks.getDoc.mockResolvedValueOnce({ exists: () => false });
    const user = userEvent.setup();

    render(<Login />);
    await user.click(screen.getByRole('button', { name: /continue with google/i }));

    await waitFor(() => expect(mocks.signInWithPopup).toHaveBeenCalled());
    expect(mocks.setDoc).toHaveBeenCalledWith({ collectionName: 'users', docId: 'google-user' }, expect.objectContaining({
      email: 'google@example.com',
      name: 'Google Member',
      role: 'pending',
    }));
  });

  it('surfaces friendly Firebase auth errors for email sign-in', async () => {
    mocks.signInWithEmailAndPassword.mockRejectedValue({ code: 'auth/invalid-credential' });
    const user = userEvent.setup();

    render(<Login />);
    await user.type(screen.getByPlaceholderText('your@email.com'), 'wrong@example.com');
    await user.type(document.querySelector('input[type="password"]') as HTMLInputElement, 'secret123');
    await user.click(screen.getByRole('button', { name: /sign in with email/i }));

    expect(await screen.findByText('Invalid email or password.')).toBeInTheDocument();
  });

  it('validates local phone number format before requesting OTP', async () => {
    const user = userEvent.setup();

    render(<Login />);
    await user.click(screen.getByRole('button', { name: /^phone$/i }));
    await user.type(screen.getByPlaceholderText(/98765/i), '123');
    await user.click(screen.getByRole('button', { name: /send otp/i }));

    expect(await screen.findByText('Invalid format. Expected 10 digits.')).toBeInTheDocument();
    expect(mocks.signInWithPhoneNumber).not.toHaveBeenCalled();
  });

  it('verifies phone OTP, prompts for a missing profile name, and saves the pending profile', async () => {
    const verifiedUser = { ...authUsers.pending, uid: 'phone-user', phoneNumber: '+919876543210', getIdToken: vi.fn(async () => 'phone-token') };
    mocks.auth.currentUser = verifiedUser;
    mocks.signInWithPhoneNumber.mockResolvedValue({ confirm: vi.fn(async () => ({ user: verifiedUser })) });
    mocks.getDoc.mockResolvedValueOnce({ exists: () => false });
    const user = userEvent.setup();

    render(<Login />);
    await user.click(screen.getByRole('button', { name: /^phone$/i }));
    await user.type(screen.getByPlaceholderText(/98765/i), '9876543210');
    await user.click(screen.getByRole('button', { name: /send otp/i }));

    await user.type(await screen.findByPlaceholderText('------'), '123456');
    await user.click(screen.getByRole('button', { name: /verify code/i }));

    await user.type(await screen.findByPlaceholderText(/john mark/i), 'Phone Member');
    await user.click(screen.getByRole('button', { name: /request access/i }));

    await waitFor(() => expect(mocks.setDoc).toHaveBeenCalledWith({ collectionName: 'users', docId: 'phone-user' }, expect.objectContaining({
      name: 'Phone Member',
      phone: '+919876543210',
      role: 'pending',
    })));
  });
});
