import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ViewSongPage from '@/app/songbook/[id]/page';
import { authUsers, songs, userProfiles } from '@/tests/fixtures/data';
import { createDocSnapshot } from '@/tests/utils/firestore';

const mocks = vi.hoisted(() => ({
  authState: {
    user: null as any,
    role: null as any,
    userProfile: null as any,
    loading: false,
    logout: vi.fn(),
  },
  auth: { currentUser: { getIdToken: vi.fn(async () => 'admin-token') } as any },
  routerPush: vi.fn(),
  params: { id: 'song-malayalam' } as Record<string, string>,
  doc: vi.fn(),
  getDoc: vi.fn(),
  deleteSong: vi.fn(),
}));

vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => mocks.authState,
}));

vi.mock('@/lib/firebase', () => ({
  db: { app: 'test-db' },
  auth: mocks.auth,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.routerPush }),
  useParams: () => mocks.params,
}));

vi.mock('firebase/firestore', () => ({
  doc: mocks.doc,
  getDoc: mocks.getDoc,
}));

vi.mock('@/app/actions/dbActions', () => ({
  deleteSong: mocks.deleteSong,
}));

describe('song detail page workflows', () => {
  beforeEach(() => {
    mocks.authState.user = authUsers.approved;
    mocks.authState.role = 'approved';
    mocks.authState.userProfile = userProfiles.approved;
    mocks.authState.loading = false;
    mocks.params = { id: 'song-malayalam' };
    mocks.auth.currentUser = { getIdToken: vi.fn(async () => 'fresh-token') };
    mocks.doc.mockImplementation((_db: unknown, collectionName: string, docId: string) => ({ collectionName, docId }));
    mocks.getDoc.mockResolvedValue(createDocSnapshot(songs.malayalam));
  });

  it('loads a song and switches between lyrics, phonetics, meaning, story, and image tabs', async () => {
    const user = userEvent.setup();

    render(<ViewSongPage />);

    expect(await screen.findByText('Aaradhikkum')).toBeInTheDocument();
    expect(screen.getByText('Aaradhikkum parishudha naamam')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /eng phonetics/i }));
    expect(screen.getByText('Aaradhikkum parishudha naamam')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /meaning/i }));
    expect(screen.getByText('We worship the holy name.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /story/i }));
    expect(screen.getByText('A trusted assembly hymn.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /original photos/i }));
    expect(screen.getByRole('img', { name: /original sheet music 1/i })).toHaveAttribute('src', 'https://example.com/song.jpg');
  });

  it('lets admins delete songs after confirmation', async () => {
    mocks.authState.user = authUsers.admin;
    mocks.authState.role = 'admin';
    mocks.authState.userProfile = userProfiles.admin;
    const user = userEvent.setup();

    render(<ViewSongPage />);

    await screen.findByText('Aaradhikkum');
    await user.click(screen.getAllByRole('button')[1]);

    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to permanently delete this song?');
    expect(mocks.deleteSong).toHaveBeenCalledWith('song-malayalam', 'fresh-token');
    expect(mocks.routerPush).toHaveBeenCalledWith('/songbook');
  });

  it('alerts and returns to the songbook when a song is missing', async () => {
    mocks.getDoc.mockResolvedValueOnce(createDocSnapshot(null));

    render(<ViewSongPage />);

    await waitFor(() => expect(window.alert).toHaveBeenCalledWith('Song not found!'));
    expect(mocks.routerPush).toHaveBeenCalledWith('/songbook');
  });
});
