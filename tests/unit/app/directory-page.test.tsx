import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DirectoryPage from '@/app/directory/page';
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
  routerPush: vi.fn(),
  searchParams: new URLSearchParams(),
  onSnapshot: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  savePdf: vi.fn(),
  addPage: vi.fn(),
  text: vi.fn(),
}));

vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => mocks.authState,
}));

vi.mock('@/lib/firebase', () => ({ db: { app: 'test-db' } }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.routerPush }),
  useSearchParams: () => mocks.searchParams,
}));

vi.mock('firebase/firestore', () => ({
  collection: mocks.collection,
  query: mocks.query,
  where: mocks.where,
  onSnapshot: mocks.onSnapshot,
}));

vi.mock('@/components/DirectoryCard', () => ({
  default: (props: any) => (
    <section data-testid="directory-card">
      <h2>{props.familyName}</h2>
      <button type="button" onClick={props.onSwipeRight}>Previous Family</button>
      <button type="button" onClick={props.onSwipeLeft}>Next Family</button>
    </section>
  ),
}));

vi.mock('@/lib/imageUtils', () => ({
  getBase64ImageFromUrl: vi.fn(async () => ({ dataUrl: 'data:image/jpeg;base64,test', width: 800, height: 600 })),
}));

vi.mock('jspdf', () => ({
  jsPDF: vi.fn(function JsPdfMock() {
    return {
      setFontSize: vi.fn(),
      setTextColor: vi.fn(),
      setFont: vi.fn(),
      text: mocks.text,
      addImage: vi.fn(),
      addPage: mocks.addPage,
      splitTextToSize: vi.fn((text: string) => [text]),
      save: mocks.savePdf,
    };
  }),
}));

describe('Directory page workflows', () => {
  beforeEach(() => {
    mocks.authState.user = authUsers.approved;
    mocks.authState.role = 'approved';
    mocks.authState.userProfile = userProfiles.approved;
    mocks.authState.loading = false;
    mocks.searchParams = new URLSearchParams();
    mocks.collection.mockImplementation((_db: unknown, collectionName: string) => ({ collectionName }));
    mocks.where.mockImplementation((field: string, operator: string, value: unknown) => ({ field, operator, value }));
    mocks.query.mockImplementation((base: any, ...clauses: any[]) => ({ ...base, clauses }));
    mocks.onSnapshot.mockImplementation((_queryRef: unknown, next: (snapshot: unknown) => void) => {
      next(createFirestoreSnapshot([families.active, families.inactive]));
      return vi.fn();
    });
  });

  it('redirects unauthenticated users back to login', async () => {
    mocks.authState.user = null;
    mocks.authState.role = null;
    mocks.authState.userProfile = null;

    render(<DirectoryPage />);

    await waitFor(() => expect(mocks.routerPush).toHaveBeenCalledWith('/login'));
  });

  it('shows active families to approved users and hides inactive families', async () => {
    render(<DirectoryPage />);

    expect(await screen.findByText('John Family')).toBeInTheDocument();
    expect(screen.queryByText('Inactive Family')).not.toBeInTheDocument();
  });

  it('shows inactive records to admins with an inactive badge', async () => {
    mocks.authState.user = authUsers.admin;
    mocks.authState.role = 'admin';
    mocks.authState.userProfile = userProfiles.admin;

    render(<DirectoryPage />);

    expect(await screen.findByText('Inactive Family')).toBeInTheDocument();
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('filters families by search text', async () => {
    const user = userEvent.setup();

    render(<DirectoryPage />);
    await screen.findByText('John Family');
    await user.type(screen.getByPlaceholderText('Search families...'), 'missing');

    expect(screen.getByText('No families found.')).toBeInTheDocument();
  });

  it('switches to member search and opens the selected family card', async () => {
    const user = userEvent.setup();

    render(<DirectoryPage />);
    await user.click(await screen.findByRole('button', { name: 'Members' }));
    expect(screen.getByPlaceholderText('Search members...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /john doe/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /jane doe/i }));

    const card = await screen.findByTestId('directory-card');
    expect(within(card).getByText('John Family')).toBeInTheDocument();
  });

  it('exports a PDF directory book from visible family data', async () => {
    const user = userEvent.setup();

    render(<DirectoryPage />);
    await user.click(await screen.findByRole('button', { name: /download pdf book/i }));

    await waitFor(() => expect(mocks.savePdf).toHaveBeenCalledWith(expect.stringMatching(/^ICBA_Directory_\d{4}-\d{2}-\d{2}\.pdf$/)));
    expect(mocks.text).toHaveBeenCalledWith('ICBA Directory', expect.any(Number), expect.any(Number), expect.any(Object));
  });
});
