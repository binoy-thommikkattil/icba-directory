import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ApprovalsPage from '@/app/approvals/page';
import { authUsers, families, userProfiles } from '@/tests/fixtures/data';
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
  where: vi.fn(),
  onSnapshot: vi.fn(),
  approveUserAccess: vi.fn(),
  rejectUserAccess: vi.fn(),
  approveFamilyCreation: vi.fn(),
  rejectFamilyCreation: vi.fn(),
  approveFamilyEdit: vi.fn(),
  rejectFamilyEdit: vi.fn(),
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
  onSnapshot: mocks.onSnapshot,
}));

vi.mock('@/app/actions/dbActions', () => ({
  approveUserAccess: mocks.approveUserAccess,
  rejectUserAccess: mocks.rejectUserAccess,
  approveFamilyCreation: mocks.approveFamilyCreation,
  rejectFamilyCreation: mocks.rejectFamilyCreation,
  approveFamilyEdit: mocks.approveFamilyEdit,
  rejectFamilyEdit: mocks.rejectFamilyEdit,
}));

describe('Approvals page workflows', () => {
  beforeEach(() => {
    mocks.authState.user = authUsers.admin;
    mocks.authState.role = 'admin';
    mocks.authState.userProfile = userProfiles.admin;
    mocks.authState.loading = false;
    mocks.auth.currentUser = { getIdToken: vi.fn(async () => 'admin-token') };
    mocks.collection.mockImplementation((_db: unknown, collectionName: string) => ({ collectionName }));
    mocks.where.mockImplementation((field: string, operator: string, value: unknown) => ({ field, operator, value }));
    mocks.query.mockImplementation((base: any, ...clauses: any[]) => ({ ...base, clauses }));
    mocks.onSnapshot.mockImplementation((queryRef: any, next: (snapshot: unknown) => void) => {
      if (queryRef.collectionName === 'users') {
        next(createFirestoreSnapshot([{ id: 'user-pending', ...userProfiles.pending }]));
      } else if (queryRef.collectionName === 'members' && queryRef.clauses?.some((clause: any) => clause.field === 'isPendingCreation')) {
        next(createFirestoreSnapshot([families.pendingCreation]));
      } else if (queryRef.collectionName === 'members' && queryRef.clauses?.some((clause: any) => clause.field === 'hasPendingEdit')) {
        next(createFirestoreSnapshot([families.pendingEdit]));
      }
      return vi.fn();
    });
  });

  it('redirects non-admin users away from the approval queue', async () => {
    mocks.authState.user = authUsers.approved;
    mocks.authState.role = 'approved';
    mocks.authState.userProfile = userProfiles.approved;

    render(<ApprovalsPage />);

    await waitFor(() => expect(mocks.routerPush).toHaveBeenCalledWith('/dashboard'));
  });

  it('loads all approval queues for admins', async () => {
    render(<ApprovalsPage />);

    expect(await screen.findByText('Pending User')).toBeInTheDocument();
    expect(screen.getByText('Pending Family')).toBeInTheDocument();
    expect(screen.getByText('Edited Family')).toBeInTheDocument();
    expect(screen.getByText('Account Access Requests')).toBeInTheDocument();
  });

  it('approves and rejects pending user access with a fresh token', async () => {
    const user = userEvent.setup();
    render(<ApprovalsPage />);

    const pendingCard = (await screen.findByText('Pending User')).closest('.bg-white') as HTMLElement;
    const [approveButton, rejectButton] = within(pendingCard).getAllByRole('button');

    await user.click(approveButton);
    expect(mocks.approveUserAccess).toHaveBeenCalledWith('user-pending', 'admin-token');

    await user.click(rejectButton);
    expect(window.confirm).toHaveBeenCalledWith('Deny access to this user?');
    expect(mocks.rejectUserAccess).toHaveBeenCalledWith('user-pending', 'Rejected access request for +919876543210', 'admin-token');
  });

  it('reviews and publishes a new family submission', async () => {
    const user = userEvent.setup();
    render(<ApprovalsPage />);

    await user.click((await screen.findAllByRole('button', { name: /review/i }))[0]);

    expect(screen.getByRole('heading', { name: 'Review New Family' })).toBeInTheDocument();
    expect(screen.getByText('Pending Parent')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /approve & publish/i }));

    expect(mocks.approveFamilyCreation).toHaveBeenCalledWith('family-pending-creation', 'admin-token');
  });

  it('reviews and rejects a pending edit with visible field diffs', async () => {
    const user = userEvent.setup();
    render(<ApprovalsPage />);

    await user.click((await screen.findAllByRole('button', { name: /review/i }))[1]);

    expect(screen.getByRole('heading', { name: 'Review Edit Request' })).toBeInTheDocument();
    expect(screen.getByText('Proposed Changes')).toBeInTheDocument();
    expect(screen.getByText('Primary Member (Family Name)')).toBeInTheDocument();
    expect(screen.getByText('Edited Family Updated')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /discard changes/i }));

    expect(window.confirm).toHaveBeenCalledWith('Discard these proposed changes?');
    expect(mocks.rejectFamilyEdit).toHaveBeenCalledWith('family-pending-edit', 'admin-token');
  });

  it('approves and merges a pending edit with the draft data payload', async () => {
    const user = userEvent.setup();
    render(<ApprovalsPage />);

    await user.click((await screen.findAllByRole('button', { name: /review/i }))[1]);
    await user.click(screen.getByRole('button', { name: /approve & merge/i }));

    expect(mocks.approveFamilyEdit).toHaveBeenCalledWith('family-pending-edit', families.pendingEdit.draftData, 'admin-token');
  });
});
