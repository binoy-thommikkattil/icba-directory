import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MeetingsPage from '@/app/meetings/page';
import PrayerPage from '@/app/prayer/page';
import SongbookHub from '@/app/songbook/page';
import { authUsers, meetings, prayerPoints, songs, userProfiles } from '@/tests/fixtures/data';
import { createFirestoreSnapshot } from '@/tests/utils/firestore';

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
  collection: vi.fn(),
  query: vi.fn(),
  onSnapshot: vi.fn(),
  createMeeting: vi.fn(),
  updateMeeting: vi.fn(),
  deleteMeeting: vi.fn(),
  createPrayerPoint: vi.fn(),
  updatePrayerPoint: vi.fn(),
  deletePrayerPoint: vi.fn(),
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
}));

vi.mock('firebase/firestore', () => ({
  collection: mocks.collection,
  query: mocks.query,
  onSnapshot: mocks.onSnapshot,
}));

vi.mock('@/app/actions/dbActions', () => ({
  createMeeting: mocks.createMeeting,
  updateMeeting: mocks.updateMeeting,
  deleteMeeting: mocks.deleteMeeting,
  createPrayerPoint: mocks.createPrayerPoint,
  updatePrayerPoint: mocks.updatePrayerPoint,
  deletePrayerPoint: mocks.deletePrayerPoint,
}));

describe('content page workflows', () => {
  beforeEach(() => {
    mocks.authState.user = authUsers.approved;
    mocks.authState.role = 'approved';
    mocks.authState.userProfile = userProfiles.approved;
    mocks.authState.loading = false;
    mocks.auth.currentUser = { getIdToken: vi.fn(async () => 'fresh-token') };
    mocks.collection.mockImplementation((_db: unknown, collectionName: string) => ({ collectionName }));
    mocks.query.mockImplementation((base: any) => base);
    mocks.onSnapshot.mockImplementation((queryRef: any, next: (snapshot: unknown) => void) => {
      const dataByCollection: Record<string, any[]> = {
        meetings,
        prayer_points: prayerPoints,
        songs: [songs.malayalam, songs.english],
      };
      next(createFirestoreSnapshot(dataByCollection[queryRef.collectionName] || []));
      return vi.fn();
    });
  });

  it('renders meetings for approved users without admin controls', async () => {
    render(<MeetingsPage />);

    expect(await screen.findByText('Sunday Worship')).toBeInTheDocument();
    expect(screen.getByText('Main Assembly Hall')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /join zoom/i })).toHaveAttribute('href', 'https://zoom.example.com/icba');
    expect(screen.queryByRole('button', { name: /^add$/i })).not.toBeInTheDocument();
  });

  it('lets admins create, edit, and delete meetings', async () => {
    mocks.authState.user = authUsers.admin;
    mocks.authState.role = 'admin';
    mocks.authState.userProfile = userProfiles.admin;
    const user = userEvent.setup();

    render(<MeetingsPage />);
    await user.click(await screen.findByRole('button', { name: /^add$/i }));
    await user.type(screen.getByPlaceholderText(/sunday worship/i), 'Prayer Meeting');
    await user.type(screen.getByPlaceholderText(/sunday at 10:00 am/i), 'Friday at 7:00 PM');
    await user.type(screen.getByPlaceholderText(/zoom\.us/i), 'https://zoom.example.com/prayer');
    await user.click(screen.getByRole('button', { name: /save meeting/i }));

    await waitFor(() => expect(mocks.createMeeting).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Prayer Meeting',
      time: 'Friday at 7:00 PM',
      type: 'Zoom',
      linkOrLocation: 'https://zoom.example.com/prayer',
    }), 'fresh-token'));

    const sundayCard = screen.getByText('Sunday Worship').closest('.bg-white') as HTMLElement;
    const [editButton, deleteButton] = within(sundayCard).getAllByRole('button');
    await user.click(editButton);
    await user.clear(screen.getByPlaceholderText(/sunday worship/i));
    await user.type(screen.getByPlaceholderText(/sunday worship/i), 'Sunday Worship Updated');
    await user.click(screen.getByRole('button', { name: /update meeting/i }));

    expect(mocks.updateMeeting).toHaveBeenCalledWith('meeting-1', expect.objectContaining({ title: 'Sunday Worship Updated' }), 'fresh-token');

    await user.click(deleteButton);
    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this meeting?');
    expect(mocks.deleteMeeting).toHaveBeenCalledWith('meeting-1', 'fresh-token');
  });

  it('renders prayer points for members and lets admins create/edit/delete them', async () => {
    mocks.authState.user = authUsers.admin;
    mocks.authState.role = 'admin';
    mocks.authState.userProfile = userProfiles.admin;
    const user = userEvent.setup();

    render(<PrayerPage />);
    expect(await screen.findByText('Youth Retreat')).toBeInTheDocument();
    expect(screen.getByText('Travel safety')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^add$/i }));
    await user.type(screen.getByPlaceholderText(/upcoming youth retreat/i), 'Mission Support');
    await user.type(screen.getByPlaceholderText(/detail or specific need/i), 'Families serving away from home');
    await user.click(screen.getByRole('button', { name: /save prayer request/i }));

    expect(mocks.createPrayerPoint).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Mission Support',
      subpoints: ['Families serving away from home'],
      authorName: 'Admin User',
      authorUid: 'user-admin',
      authorEmail: 'admin@example.com',
    }), 'fresh-token');

    const prayerCard = screen.getByText('Youth Retreat').closest('.bg-white') as HTMLElement;
    const [editButton, deleteButton] = within(prayerCard).getAllByRole('button');
    await user.click(editButton);
    await user.clear(screen.getByPlaceholderText(/upcoming youth retreat/i));
    await user.type(screen.getByPlaceholderText(/upcoming youth retreat/i), 'Youth Retreat Updated');
    await user.click(screen.getByRole('button', { name: /update prayer request/i }));

    expect(mocks.updatePrayerPoint).toHaveBeenCalledWith('prayer-1', expect.objectContaining({ title: 'Youth Retreat Updated' }), 'fresh-token');

    await user.click(deleteButton);
    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this prayer point?');
    expect(mocks.deletePrayerPoint).toHaveBeenCalledWith('prayer-1', 'fresh-token');
  });

  it('browses the songbook by search, language, and author', async () => {
    const user = userEvent.setup();

    render(<SongbookHub />);
    expect(await screen.findByText('Aaradhikkum')).toBeInTheDocument();
    expect(screen.getByText('Amazing Grace')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Malayalam' }));
    expect(screen.getByText('Aaradhikkum')).toBeInTheDocument();
    expect(screen.queryByText('Amazing Grace')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /authors index/i }));
    expect(screen.getByRole('button', { name: /john newton/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /john newton/i }));

    expect(screen.getByText(/showing songs by/i)).toBeInTheDocument();
    expect(screen.getByText('Amazing Grace')).toBeInTheDocument();
  });

  it('redirects protected content pages when no user is signed in', async () => {
    mocks.authState.user = null;
    mocks.authState.role = null;
    mocks.authState.userProfile = null;

    render(<MeetingsPage />);

    await waitFor(() => expect(mocks.routerPush).toHaveBeenCalledWith('/login'));
  });
});
