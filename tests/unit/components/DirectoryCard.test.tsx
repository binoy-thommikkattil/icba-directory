import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DirectoryCard from '@/components/DirectoryCard';
import { authUsers, families, userProfiles } from '@/tests/fixtures/data';

const mocks = vi.hoisted(() => ({
  authState: {
    user: null as any,
    role: null as any,
    userProfile: null as any,
    loading: false,
    logout: vi.fn(),
  },
  logActivity: vi.fn(),
  getBase64ImageFromUrl: vi.fn(),
  savePdf: vi.fn(),
}));

vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => mocks.authState,
}));

vi.mock('@/lib/logger', () => ({
  logActivity: mocks.logActivity,
}));

vi.mock('@/lib/imageUtils', () => ({
  getBase64ImageFromUrl: mocks.getBase64ImageFromUrl,
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, onDragEnd: _onDragEnd, whileTap: _whileTap, drag: _drag, dragConstraints: _dragConstraints, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

vi.mock('jspdf', () => ({
  jsPDF: vi.fn(function JsPdfMock() {
    return {
      setFontSize: vi.fn(),
      setTextColor: vi.fn(),
      setFont: vi.fn(),
      text: vi.fn(),
      addImage: vi.fn(),
      addPage: vi.fn(),
      splitTextToSize: vi.fn((text: string) => [text]),
      output: vi.fn(() => new Blob(['pdf'], { type: 'application/pdf' })),
      save: mocks.savePdf,
    };
  }),
}));

describe('DirectoryCard', () => {
  beforeEach(() => {
    mocks.authState.user = authUsers.approved;
    mocks.authState.role = 'approved';
    mocks.authState.userProfile = userProfiles.approved;
    mocks.logActivity.mockResolvedValue(undefined);
    mocks.getBase64ImageFromUrl.mockResolvedValue({ dataUrl: 'data:image/jpeg;base64,test', width: 800, height: 600 });
  });

  it('renders family details and map links from combined address fields', () => {
    render(<DirectoryCard {...families.active} />);

    expect(screen.getByText('John Family')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /current address/i })).toHaveAttribute('href', 'https://maps.google.com/?q=12.9716,77.5946');
    expect(screen.getByText('ICBA Bangalore')).toBeInTheDocument();
  });

  it('shows edit links for editable records and pending badges for locked member edits', () => {
    const { rerender } = render(<DirectoryCard {...families.active} id="family-active" hasPendingEdit={false} />);
    expect(screen.getByRole('link', { name: /edit/i })).toHaveAttribute('href', '/edit-family/family-active');

    rerender(<DirectoryCard {...families.active} id="family-active" hasPendingEdit />);
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /edit/i })).not.toBeInTheDocument();

    mocks.authState.user = authUsers.admin;
    mocks.authState.role = 'admin';
    mocks.authState.userProfile = userProfiles.admin;
    rerender(<DirectoryCard {...families.active} id="family-active" hasPendingEdit />);
    expect(screen.getByRole('link', { name: /edit/i })).toHaveAttribute('href', '/edit-family/family-active');
  });

  it('exports a single-family PDF and logs the member activity', async () => {
    const user = userEvent.setup();
    render(<DirectoryCard {...families.active} photoUrl="https://storage.example.com/family.jpg" />);

    await user.click(screen.getAllByRole('button')[0]);

    await waitFor(() => expect(mocks.logActivity).toHaveBeenCalledWith(
      userProfiles.approved,
      'Exported/Shared Card',
      'Exported the directory card for the John Family.',
    ));
    expect(mocks.getBase64ImageFromUrl).toHaveBeenCalledWith('https://storage.example.com/family.jpg');
    expect(mocks.savePdf).toHaveBeenCalledWith('John Family_Family_Directory.pdf');
  });
});
