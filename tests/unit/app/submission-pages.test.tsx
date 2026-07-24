import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AddSongPage from '@/app/songbook/add/page';
import AddFamily from '@/app/add-family/page';
import { authUsers, userProfiles } from '@/tests/fixtures/data';

const mocks = vi.hoisted(() => ({
  authState: {
    user: null as any,
    role: null as any,
    userProfile: null as any,
    loading: false,
    logout: vi.fn(),
  },
  auth: { currentUser: { getIdToken: vi.fn(async () => 'fresh-token') } as any },
  routerPush: vi.fn(),
  createSong: vi.fn(),
  createFamilySubmission: vi.fn(),
  ref: vi.fn(),
  uploadBytes: vi.fn(),
  uploadString: vi.fn(),
  getDownloadURL: vi.fn(),
}));

vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => mocks.authState,
}));

vi.mock('@/lib/firebase', () => ({
  auth: mocks.auth,
  storage: { bucket: 'test-storage' },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.routerPush }),
}));

vi.mock('next/image', () => ({
  default: ({ unoptimized: _unoptimized, priority: _priority, ...props }: any) => <img {...props} />,
}));

vi.mock('firebase/storage', () => ({
  ref: mocks.ref,
  uploadBytes: mocks.uploadBytes,
  uploadString: mocks.uploadString,
  getDownloadURL: mocks.getDownloadURL,
}));

vi.mock('@/app/actions/dbActions', () => ({
  createSong: mocks.createSong,
  createFamilySubmission: mocks.createFamilySubmission,
}));

vi.mock('react-easy-crop', () => ({
  default: () => <div data-testid="cropper" />,
}));

vi.mock('@/components/LocationPicker', () => ({
  default: ({ label, onChange }: { label: string; onChange: (data: any) => void }) => (
    <label>
      {label}
      <input
        aria-label={label}
        placeholder={label}
        onChange={(event) => onChange({ address: event.currentTarget.value, mapAddress: '', lat: null, lng: null })}
      />
    </label>
  ),
}));

describe('submission workflows', () => {
  beforeEach(() => {
    mocks.authState.user = authUsers.approved;
    mocks.authState.role = 'approved';
    mocks.authState.userProfile = userProfiles.approved;
    mocks.authState.loading = false;
    mocks.auth.currentUser = { ...authUsers.approved, getIdToken: vi.fn(async () => 'fresh-token') };
    mocks.createSong.mockResolvedValue({ success: true, id: 'song-new' });
    mocks.createFamilySubmission.mockResolvedValue({ success: true, id: 'family-new' });
    mocks.ref.mockImplementation((_storage: unknown, path: string) => ({ path }));
    mocks.uploadBytes.mockImplementation(async (ref: unknown) => ({ ref }));
    mocks.uploadString.mockResolvedValue({ ref: { path: 'family_photos/test.jpg' } });
    mocks.getDownloadURL.mockResolvedValue('https://storage.example.com/uploaded.jpg');
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({
        title: 'Processed Hymn',
        language: 'Malayalam',
        originalAuthor: 'Unknown',
        lyrics: 'Processed lyrics',
        transliterationEnglish: 'Processed phonetics',
        transliterationMalayalam: '',
        meaningEnglish: 'Processed meaning',
        meaningMalayalam: 'Processed Malayalam meaning',
        story: '',
      }),
    })));
  });

  it('validates that text song submissions include lyrics', async () => {
    const user = userEvent.setup();

    render(<AddSongPage />);
    fireEvent.submit(document.querySelector('form') as HTMLFormElement);

    expect(window.alert).toHaveBeenCalledWith('Please enter the song lyrics.');
    expect(mocks.createSong).not.toHaveBeenCalled();
  });

  it('processes pasted lyrics through the API and saves the normalized song', async () => {
    const user = userEvent.setup();

    render(<AddSongPage />);
    await user.type(screen.getByPlaceholderText(/paste the raw song lyrics/i), 'Raw song lyrics');
    await user.click(screen.getByRole('button', { name: /process & save song/i }));

    await waitFor(() => expect(fetch).toHaveBeenCalledWith('/api/process-song', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({ Authorization: 'Bearer fresh-token' }),
    })));
    expect(mocks.createSong).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Processed Hymn',
      language: 'Malayalam',
      originalAuthor: 'Unknown',
      lyrics: 'Processed lyrics',
      authorName: 'Approved Member',
      authorUid: 'user-approved',
      authorEmail: 'approved@example.com',
    }), 'fresh-token');
    expect(mocks.routerPush).toHaveBeenCalledWith('/songbook');
  });

  it('uploads song images before OCR processing', async () => {
    const user = userEvent.setup();
    const file = new File(['image-bytes'], 'song.png', { type: 'image/png' });

    render(<AddSongPage />);
    await user.click(screen.getByRole('button', { name: /upload image/i }));
    await user.upload(document.querySelector('input[type="file"]') as HTMLInputElement, file);
    await screen.findByAltText('Preview 1');
    fireEvent.submit(document.querySelector('form') as HTMLFormElement);

    await waitFor(() => expect(mocks.uploadBytes).toHaveBeenCalled());
    expect(fetch).toHaveBeenCalledWith('/api/process-song', expect.objectContaining({
      body: expect.stringContaining('https://storage.example.com/uploaded.jpg'),
    }));
    expect(mocks.createSong).toHaveBeenCalledWith(expect.objectContaining({
      imageUrls: ['https://storage.example.com/uploaded.jpg'],
      imageUrl: 'https://storage.example.com/uploaded.jpg',
    }), 'fresh-token');
  });

  it('validates required family member and address fields before submission', async () => {
    const user = userEvent.setup();

    render(<AddFamily />);
    fireEvent.submit(document.querySelector('form') as HTMLFormElement);

    expect(window.alert).toHaveBeenCalledWith('The Primary Member must have a full name and mobile number.');
    expect(mocks.createFamilySubmission).not.toHaveBeenCalled();
  });

  it('submits non-admin family details as pending approval with a fresh token', async () => {
    const user = userEvent.setup();

    render(<AddFamily />);
    await user.type(screen.getByPlaceholderText(/john mark/i), 'John Member');
    await user.type(screen.getByPlaceholderText(/9876543210/i), '9876543210');
    await user.type(screen.getByPlaceholderText('Current Address & Location *'), '123 Main Street');
    await user.click(screen.getByRole('button', { name: /submit to admin/i }));

    await waitFor(() => expect(mocks.createFamilySubmission).toHaveBeenCalledWith(expect.objectContaining({
      familyName: 'John Member',
      primaryMobile: '9876543210',
      currentAddress: '123 Main Street',
      submittedBy: 'Approved Member',
      isPendingCreation: true,
      hasPendingEdit: false,
      draftData: null,
      members: [expect.objectContaining({ name: 'John Member', mobile: '9876543210', tags: [] })],
    }), 'fresh-token'));
    expect(window.alert).toHaveBeenCalledWith('Details submitted! An admin will review and approve your submission shortly.');
    expect(mocks.routerPush).toHaveBeenCalledWith('/dashboard');
  });

  it('lets admins submit active or inactive families directly and edit member tags', async () => {
    mocks.authState.user = authUsers.admin;
    mocks.authState.role = 'admin';
    mocks.authState.userProfile = userProfiles.admin;
    mocks.auth.currentUser = { ...authUsers.admin, getIdToken: vi.fn(async () => 'admin-token') };
    const user = userEvent.setup();

    render(<AddFamily />);
    await user.selectOptions(screen.getByDisplayValue('Active'), 'Inactive');
    await user.type(screen.getByPlaceholderText(/john mark/i), 'Admin Family');
    await user.type(screen.getByPlaceholderText(/9876543210/i), '9876500000');
    await user.selectOptions(screen.getByRole('listbox'), ['Choir', 'Sunday School']);
    await user.type(screen.getByPlaceholderText('Current Address & Location *'), 'Admin Address');
    await user.click(screen.getByRole('button', { name: /add family to directory/i }));

    expect(mocks.createFamilySubmission).toHaveBeenCalledWith(expect.objectContaining({
      familyName: 'Admin Family',
      status: 'Inactive',
      isPendingCreation: false,
      members: [expect.objectContaining({ tags: ['Sunday School', 'Choir'] })],
    }), 'admin-token');
    expect(window.alert).toHaveBeenCalledWith('Family added successfully to the directory!');
  });
});
