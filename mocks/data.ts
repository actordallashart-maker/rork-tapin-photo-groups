import { Group, TodayPhoto, BlitzRound, BlitzPhoto, AppData } from '@/types';
import { getRandomPrompt } from '@/constants/blitz-prompts';

const getTodayDateKey = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

export const mockGroups: Group[] = [
  {
    groupId: 'group-a',
    groupName: 'Friends',
    emoji: '👯',
    members: [
      { userId: 'u1', name: 'Alex Kim', initials: 'AK' },
      { userId: 'u2', name: 'Jordan Lee', initials: 'JL' },
      { userId: 'u3', name: 'Sam Chen', initials: 'SC' },
      { userId: 'u4', name: 'Morgan Evans', initials: 'ME' },
    ],
  },
  {
    groupId: 'group-b',
    groupName: 'Family',
    emoji: '👨‍👩‍👧‍👦',
    members: [
      { userId: 'u5', name: 'Mom', initials: 'MO' },
      { userId: 'u6', name: 'Dad', initials: 'DA' },
      { userId: 'u7', name: 'Sibling', initials: 'SB' },
    ],
  },
  {
    groupId: 'group-c',
    groupName: 'Work Crew',
    emoji: '💼',
    members: [
      { userId: 'u8', name: 'Taylor Swift', initials: 'TS' },
      { userId: 'u9', name: 'Chris Park', initials: 'CP' },
      { userId: 'u10', name: 'Riley Johnson', initials: 'RJ' },
      { userId: 'u11', name: 'Casey Brown', initials: 'CB' },
      { userId: 'u12', name: 'Drew Wilson', initials: 'DW' },
    ],
  },
];

export const createMockTodayPhotos = (): TodayPhoto[] => {
  const dateKey = getTodayDateKey();
  const now = new Date().toISOString();
  return [
    {
      photoId: 'today-1',
      groupId: 'group-a',
      userId: 'u1',
      dateKey,
      createdAt: now,
      imageUri: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop',
      x: 20,
      y: 30,
      zIndex: 1,
    },
    {
      photoId: 'today-2',
      groupId: 'group-a',
      userId: 'u2',
      dateKey,
      createdAt: now,
      imageUri: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=400&fit=crop',
      x: 140,
      y: 120,
      zIndex: 2,
      textOverlay: {
        text: 'Good vibes',
        x: 20,
        y: 100,
        size: 'M',
        color: '#FFFFFF',
      },
    },
    {
      photoId: 'today-3',
      groupId: 'group-c',
      userId: 'u8',
      dateKey,
      createdAt: now,
      imageUri: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=400&h=400&fit=crop',
      x: 60,
      y: 60,
      zIndex: 1,
    },
  ];
};

export const createMockBlitzRounds = (): BlitzRound[] => {
  return [
    {
      roundId: 'blitz-round-a-1',
      groupId: 'group-a',
      status: 'waiting',
      prompt: getRandomPrompt(),
    },
    {
      roundId: 'blitz-round-b-1',
      groupId: 'group-b',
      status: 'waiting',
      prompt: getRandomPrompt(),
    },
    {
      roundId: 'blitz-round-c-1',
      groupId: 'group-c',
      status: 'waiting',
      prompt: getRandomPrompt(),
    },
  ];
};

export const createMockBlitzPhotos = (): BlitzPhoto[] => {
  return [];
};

export const createInitialMockData = (): AppData => ({
  groups: mockGroups,
  todayPhotos: createMockTodayPhotos(),
  blitzRounds: createMockBlitzRounds(),
  blitzPhotos: createMockBlitzPhotos(),
});
