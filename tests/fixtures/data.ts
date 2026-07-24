import { vi } from 'vitest';

export const authUsers = {
  admin: {
    uid: 'user-admin',
    email: 'admin@example.com',
    displayName: 'Admin User',
    phoneNumber: '+919876543212',
    getIdToken: vi.fn(async () => 'admin-token'),
  },
  approved: {
    uid: 'user-approved',
    email: 'approved@example.com',
    displayName: 'Approved Member',
    phoneNumber: '+919876543211',
    getIdToken: vi.fn(async () => 'approved-token'),
  },
  pending: {
    uid: 'user-pending',
    email: 'pending@example.com',
    displayName: 'Pending User',
    phoneNumber: '+919876543210',
    getIdToken: vi.fn(async () => 'pending-token'),
  },
};

export const userProfiles = {
  admin: {
    uid: 'user-admin',
    email: 'admin@example.com',
    name: 'Admin User',
    phone: '+919876543212',
    role: 'admin',
    createdAt: '2026-01-01T10:00:00.000Z',
  },
  approved: {
    uid: 'user-approved',
    email: 'approved@example.com',
    name: 'Approved Member',
    phone: '+919876543211',
    role: 'approved',
    createdAt: '2026-01-10T10:00:00.000Z',
  },
  pending: {
    uid: 'user-pending',
    email: 'pending@example.com',
    name: 'Pending User',
    phone: '+919876543210',
    role: 'pending',
    createdAt: '2026-01-15T10:00:00.000Z',
  },
};

export const families = {
  active: {
    id: 'family-active',
    familyName: 'John Family',
    status: 'Active',
    primaryMobile: '9876543200',
    currentAddress: '123 Main Street',
    currentMapAddress: 'Indiranagar, Bengaluru',
    currentLat: 12.9716,
    currentLng: 77.5946,
    nativeAddress: '456 Native Street',
    nativeMapAddress: 'Kottayam, Kerala',
    homeAssembly: 'ICBA Bangalore',
    commendedAssembly: 'Parent Assembly',
    members: [
      {
        name: 'John Doe',
        mobile: '9876543200',
        relationship: 'Head',
        bloodGroup: 'O+',
        willingToDonate: true,
        tags: ['Brothers Meeting', 'Choir'],
      },
      {
        name: 'Jane Doe',
        mobile: '9876543201',
        relationship: 'Wife',
        bloodGroup: 'A+',
        willingToDonate: false,
        tags: ['Sisters Meeting'],
      },
    ],
    isPendingCreation: false,
    hasPendingEdit: false,
    draftData: null,
    lastEdited: '2026-01-12T10:00:00.000Z',
  },
  inactive: {
    id: 'family-inactive',
    familyName: 'Inactive Family',
    status: 'Inactive',
    primaryMobile: '9876543299',
    members: [{ name: 'Inactive Member', mobile: '9876543299', tags: [] }],
    isPendingCreation: false,
    hasPendingEdit: false,
    draftData: null,
    lastEdited: '2026-01-11T10:00:00.000Z',
  },
  pendingCreation: {
    id: 'family-pending-creation',
    familyName: 'Pending Family',
    status: 'Active',
    primaryMobile: '9876500000',
    members: [{ name: 'Pending Parent', mobile: '9876500000' }],
    isPendingCreation: true,
    hasPendingEdit: false,
    draftData: null,
    submittedBy: 'Pending User',
  },
  pendingEdit: {
    id: 'family-pending-edit',
    familyName: 'Edited Family',
    status: 'Active',
    primaryMobile: '9876511111',
    currentAddress: 'Old Address',
    members: [{ name: 'Edited Parent', mobile: '9876511111', tags: ['Choir'] }],
    isPendingCreation: false,
    hasPendingEdit: true,
    draftData: {
      familyName: 'Edited Family Updated',
      status: 'Inactive',
      currentAddress: 'New Address',
      members: [{ name: 'Edited Parent', mobile: '9876522222', tags: ['Choir', 'Youth Meeting'] }],
    },
    submittedBy: 'Approved Member',
  },
};

export const songs = {
  malayalam: {
    id: 'song-malayalam',
    songNumber: 1,
    title: 'Aaradhikkum',
    language: 'Malayalam',
    originalAuthor: 'Unknown',
    lyrics: 'Aaradhikkum parishudha naamam',
    transliterationEnglish: 'Aaradhikkum parishudha naamam',
    transliterationMalayalam: '',
    meaningEnglish: 'We worship the holy name.',
    meaningMalayalam: 'പരിശുദ്ധ നാമത്തെ ആരാധിക്കുന്നു.',
    story: 'A trusted assembly hymn.',
    imageUrls: ['https://example.com/song.jpg'],
    createdAt: '2026-01-10T10:00:00.000Z',
    updatedAt: '2026-01-10T10:00:00.000Z',
    authorName: 'Approved Member',
  },
  english: {
    id: 'song-english',
    songNumber: 2,
    title: 'Amazing Grace',
    language: 'English',
    originalAuthor: 'John Newton',
    lyrics: 'Amazing grace how sweet the sound',
    meaningMalayalam: 'കൃപയുടെ അർത്ഥം.',
    createdAt: '2026-01-11T10:00:00.000Z',
    updatedAt: '2026-01-11T10:00:00.000Z',
    authorName: 'Admin User',
  },
};

export const prayerPoints = [
  {
    id: 'prayer-1',
    title: 'Youth Retreat',
    subpoints: ['Travel safety', 'Clear teaching'],
    authorName: 'Admin User',
    createdAt: '2026-01-15T10:00:00.000Z',
    updatedAt: '2026-01-15T10:00:00.000Z',
  },
];

export const meetings = [
  {
    id: 'meeting-1',
    title: 'Sunday Worship',
    time: 'Sunday at 10:00 AM',
    type: 'In-Person',
    linkOrLocation: 'Main Assembly Hall',
    createdAt: '2026-01-10T10:00:00.000Z',
    updatedAt: '2026-01-10T10:00:00.000Z',
  },
  {
    id: 'meeting-2',
    title: 'Bible Study',
    time: 'Wednesday at 7:30 PM',
    type: 'Zoom',
    linkOrLocation: 'https://zoom.example.com/icba',
    createdAt: '2026-01-11T10:00:00.000Z',
    updatedAt: '2026-01-11T10:00:00.000Z',
  },
];

export const activityLogs = [
  {
    id: 'log-1',
    userName: 'Admin User',
    userEmail: 'admin@example.com',
    action: 'Approved User Access',
    details: 'Granted directory access to user user-pending',
    timestamp: '2026-01-16T10:00:00.000Z',
  },
];
