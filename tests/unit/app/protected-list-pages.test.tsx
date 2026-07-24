import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import BloodRegistryPage from '@/app/blood-registry/page';
import ManageUsersPage from '@/app/manage-users/page';
import ActivityLogPage from '@/app/activity-log/page';
import WaitingRoom from '@/app/waiting-room/page';
import YouthPage from '@/app/youth/page';
import BachelorsPage from '@/app/bachelors/page';
import SundaySchoolPage from '@/app/sunday-school/page';
import { activityLogs, authUsers, families, userProfiles } from '@/tests/fixtures/data';
import { createFirestoreSnapshot } from '@/tests/utils/firestore';

const groupFamily = {
  id: 'family-groups',
  familyName: 'Group Family',
  status: 'Active',
  submittedBy: 'Group Member',
  members: [
    { name: 'Youth Member', callCountryCode: '+91', callPhone: '9000000001', whatsappCountryCode: '+91', whatsappPhone: '9000000001', tags: ['Youth Meeting'] },
    { name: 'Bachelor Member', callCountryCode: '+91', callPhone: '9000000002', whatsappCountryCode: '+91', whatsappPhone: '9000000002', tags: ['Bachelor Meeting'] },
    { name: 'Sunday Student', callCountryCode: '+91', callPhone: '9000000003', whatsappCountryCode: '+91', whatsappPhone: '9000000003', tags: ['Sunday School'] },
  ],
  isPendingCreation: false,
};

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
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  onSnapshot: vi.fn(),
  deleteUserAccount: vi.fn(),
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
  where: mocks.where,
  orderBy: mocks.orderBy,
  limit: mocks.limit,
  onSnapshot: mocks.onSnapshot,
}));

vi.mock('@/app/actions/dbActions', () => ({
  deleteUserAccount: mocks.deleteUserAccount,
}));

vi.mock('@/components/SubDirectory', () => ({
  default: ({ pageTitle, members }: { pageTitle: string; members: any[] }) => (
    <section data-testid="sub-directory">
      <h1>{pageTitle}</h1>
      {members.map((member) => <p key={member.name}>{member.name}</p>)}
    </section>
  ),
}));

describe('protected list pages', () => {
  beforeEach(() => {
    mocks.authState.user = authUsers.approved;
    mocks.authState.role = 'approved';
    mocks.authState.userProfile = userProfiles.approved;
    mocks.authState.loading = false;
    mocks.auth.currentUser = { getIdToken: vi.fn(async () => 'admin-token') };
    mocks.collection.mockImplementation((_db: unknown, collectionName: string) => ({ collectionName }));
    mocks.where.mockImplementation((field: string, operator: string, value: unknown) => ({ field, operator, value }));
    mocks.orderBy.mockImplementation((field: string, direction: string) => ({ field, direction }));
    mocks.limit.mockImplementation((count: number) => ({ count }));
    mocks.query.mockImplementation((base: any, ...clauses: any[]) => ({ ...base, clauses }));
    mocks.onSnapshot.mockImplementation((queryRef: any, next: (snapshot: unknown) => void) => {
      const dataByCollection: Record<string, any[]> = {
        members: [families.active, families.inactive, groupFamily],
        users: [
          { id: 'user-admin', ...userProfiles.admin },
          { id: 'user-approved', ...userProfiles.approved },
          { id: 'user-pending', ...userProfiles.pending },
        ],
        activity_logs: activityLogs,
      };
      next(createFirestoreSnapshot(dataByCollection[queryRef.collectionName] || []));
      return vi.fn();
    });
  });

  it('filters the blood registry to active willing donors and blood-group selections', async () => {
    const user = userEvent.setup();

    render(<BloodRegistryPage />);

    expect(await screen.findByText('John Doe')).toBeInTheDocument();
    expect(screen.queryByText('Jane Doe')).not.toBeInTheDocument();
    expect(screen.queryByText('Inactive Member')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'O+' }));
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /call john doe/i })).toHaveAttribute('href', 'tel:+919876543200');
    expect(screen.getByRole('link', { name: /whatsapp john doe/i })).toHaveAttribute('href', 'https://wa.me/919876543205');
  });

  it('lets admins revoke non-admin users but hides delete controls for admins', async () => {
    mocks.authState.user = authUsers.admin;
    mocks.authState.role = 'admin';
    mocks.authState.userProfile = userProfiles.admin;
    const user = userEvent.setup();

    render(<ManageUsersPage />);

    expect(await screen.findByText('Admin User')).toBeInTheDocument();
    const adminCard = screen.getByText('Admin User').closest('.bg-white') as HTMLElement;
    expect(within(adminCard).queryByRole('button')).not.toBeInTheDocument();

    const approvedCard = screen.getByText('Approved Member').closest('.bg-white') as HTMLElement;
    await user.click(within(approvedCard).getByRole('button'));

    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to revoke access for Approved Member?');
    expect(mocks.deleteUserAccount).toHaveBeenCalledWith('user-approved', 'admin-token');
  });

  it('shows the activity log to admins and redirects non-admin users', async () => {
    mocks.authState.user = authUsers.admin;
    mocks.authState.role = 'admin';
    mocks.authState.userProfile = userProfiles.admin;

    const { rerender } = render(<ActivityLogPage />);
    expect(await screen.findByText('Approved User Access')).toBeInTheDocument();
    expect(screen.getByText('Granted directory access to user user-pending')).toBeInTheDocument();

    mocks.authState.user = authUsers.approved;
    mocks.authState.role = 'approved';
    mocks.authState.userProfile = userProfiles.approved;
    rerender(<ActivityLogPage />);

    await waitFor(() => expect(mocks.routerPush).toHaveBeenCalledWith('/dashboard'));
  });

  it('keeps pending users in the waiting room and handles logout', async () => {
    mocks.authState.user = authUsers.pending;
    mocks.authState.role = 'pending';
    mocks.authState.userProfile = userProfiles.pending;
    const user = userEvent.setup();

    render(<WaitingRoom />);

    expect(screen.getByText('Pending Verification')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /submit family details/i })).toHaveAttribute('href', '/add-family');
    await user.click(screen.getByRole('button', { name: /sign out/i }));
    expect(mocks.authState.logout).toHaveBeenCalled();
  });

  it('redirects users who do not belong in the waiting room', async () => {
    mocks.authState.user = authUsers.admin;
    mocks.authState.role = 'admin';
    mocks.authState.userProfile = userProfiles.admin;

    render(<WaitingRoom />);

    await waitFor(() => expect(mocks.routerPush).toHaveBeenCalledWith('/dashboard'));
  });

  it('grants admins access to every private sub-directory', async () => {
    mocks.authState.user = authUsers.admin;
    mocks.authState.role = 'admin';
    mocks.authState.userProfile = userProfiles.admin;

    const { rerender } = render(<YouthPage />);
    expect(await screen.findByText('Youth Fellowship')).toBeInTheDocument();
    expect(screen.getByText('Youth Member')).toBeInTheDocument();

    rerender(<BachelorsPage />);
    expect(await screen.findByText('Bachelor Meeting Members')).toBeInTheDocument();
    expect(screen.getByText('Bachelor Member')).toBeInTheDocument();

    rerender(<SundaySchoolPage />);
    expect(await screen.findByText('Sunday School')).toBeInTheDocument();
    expect(screen.getByText('Sunday Student')).toBeInTheDocument();
  });

  it('denies private sub-directory access to unrelated approved users', async () => {
    render(<YouthPage />);

    expect(await screen.findByText('Access Denied')).toBeInTheDocument();
    expect(screen.getByText(/must be an admin or a member/i)).toBeInTheDocument();
  });
});
