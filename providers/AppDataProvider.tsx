import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback, useMemo } from 'react';
import { Group, TodayPhoto, BlitzRound, BlitzPhoto, AppData, TextOverlay } from '@/types';
import { createInitialMockData } from '@/mocks/data';
import { getRandomPrompt } from '@/constants/blitz-prompts';

const STORAGE_KEY = 'tapin_app_data';
const MOCK_ACTIVE_USER_ID = 'u1';

const getTodayDateKey = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

const generateId = () => Math.random().toString(36).substring(2, 15);

const generateStableId = (groupId: string, tab: string, userId: string): string => {
  const timestamp = Date.now();
  return `${groupId}_${tab}_${userId}_${timestamp}`;
};

const mergePhotosById = <T extends { photoId: string }>(existing: T[], incoming: T[]): T[] => {
  if (incoming.length === 0 && existing.length > 0) {
    return existing;
  }
  const merged = new Map<string, T>();
  existing.forEach((photo) => merged.set(photo.photoId, photo));
  incoming.forEach((photo) => merged.set(photo.photoId, photo));
  return Array.from(merged.values());
};

const getTodayCycleStart = (): string => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now.toISOString();
};

const getTodayCycleEnd = (): string => {
  const now = new Date();
  now.setHours(23, 59, 59, 999);
  return now.toISOString();
};

export const [AppDataProvider, useAppData] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [activeGroupIdToday, setActiveGroupIdToday] = useState<string>('group-a');
  const [activeGroupIdBlitz, setActiveGroupIdBlitz] = useState<string>('group-a');

  const dataQuery = useQuery({
    queryKey: ['appData'],
    queryFn: async (): Promise<AppData> => {
      console.log('[AppData] Loading from AsyncStorage...');
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        console.log('[AppData] Found stored data');
        return JSON.parse(stored);
      }
      console.log('[AppData] No stored data, using initial mock');
      const initial = createInitialMockData();
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    },
  });

  const { mutate: saveMutate } = useMutation({
    mutationFn: async (data: AppData) => {
      console.log('[AppData] Saving to AsyncStorage...');
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['appData'], data);
    },
  });

  const data = dataQuery.data;

  const groups = useMemo(() => data?.groups ?? [], [data?.groups]);
  const todayPhotos = useMemo(() => data?.todayPhotos ?? [], [data?.todayPhotos]);
  const blitzRounds = useMemo(() => data?.blitzRounds ?? [], [data?.blitzRounds]);
  const blitzPhotos = useMemo(() => data?.blitzPhotos ?? [], [data?.blitzPhotos]);

  const todayDateKey = getTodayDateKey();

  const todayPhotosForGroup = useMemo(() => {
    const filtered = todayPhotos.filter(
      (p) => p.groupId === activeGroupIdToday && p.dateKey === todayDateKey
    );
    console.log('[AppData] Today photos filtered:', {
      activeGroupIdToday,
      todayDateKey,
      totalPhotos: todayPhotos.length,
      filteredPhotos: filtered.length,
    });
    return filtered;
  }, [todayPhotos, activeGroupIdToday, todayDateKey]);

  const currentBlitzRound = useMemo(() => {
    const round = blitzRounds.find((r) => r.groupId === activeGroupIdBlitz);
    console.log('[AppData] Current blitz round:', {
      activeGroupIdBlitz,
      roundId: round?.roundId,
      status: round?.status,
    });
    return round;
  }, [blitzRounds, activeGroupIdBlitz]);

  const blitzPhotosForRound = useMemo(() => {
    if (!currentBlitzRound) {
      console.log('[AppData] No current blitz round for:', activeGroupIdBlitz);
      return [];
    }
    const filtered = blitzPhotos.filter(
      (p) => p.groupId === activeGroupIdBlitz && p.roundId === currentBlitzRound.roundId
    );
    console.log('[AppData] Blitz photos filtered:', {
      activeGroupIdBlitz,
      roundId: currentBlitzRound.roundId,
      totalPhotos: blitzPhotos.length,
      filteredPhotos: filtered.length,
    });
    return filtered;
  }, [blitzPhotos, activeGroupIdBlitz, currentBlitzRound]);

  const addTodayPhoto = useCallback(
    (imageUri: string, textOverlay?: TextOverlay) => {
      if (!data) {
        console.error('[AppData] Cannot add photo: no data');
        return;
      }
      const now = new Date();
      const createdAt = now.toISOString();
      const photoId = generateStableId(activeGroupIdToday, 'today', MOCK_ACTIVE_USER_ID);
      
      const newPhoto: TodayPhoto = {
        photoId,
        groupId: activeGroupIdToday,
        userId: MOCK_ACTIVE_USER_ID,
        dateKey: todayDateKey,
        createdAt,
        imageUri,
        x: Math.random() * 100 + 20,
        y: Math.random() * 100 + 20,
        zIndex: todayPhotosForGroup.length + 1,
        textOverlay,
      };
      console.log('[AppData] Adding today photo:', newPhoto.photoId, { userId: MOCK_ACTIVE_USER_ID, groupId: activeGroupIdToday });
      
      const mergedPhotos = mergePhotosById(data.todayPhotos, [newPhoto]);
      const sortedPhotos = mergedPhotos.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      
      const updatedData = {
        ...data,
        todayPhotos: sortedPhotos,
      };
      saveMutate(updatedData);
    },
    [data, activeGroupIdToday, todayDateKey, todayPhotosForGroup.length, saveMutate]
  );

  const updateTodayPhotoPosition = useCallback(
    (photoId: string, x: number, y: number, zIndex: number) => {
      if (!data) return;
      console.log('[AppData] Updating today photo position:', photoId, { x, y, zIndex });
      const updatedPhotos = data.todayPhotos.map((p) =>
        p.photoId === photoId ? { ...p, x, y, zIndex } : p
      );
      saveMutate({ ...data, todayPhotos: updatedPhotos });
    },
    [data, saveMutate]
  );

  const addBlitzPhoto = useCallback(
    (imageUri: string, textOverlay?: TextOverlay) => {
      if (!data) {
        console.error('[AppData] Cannot add photo: no data');
        return;
      }
      let round = blitzRounds.find((r) => r.groupId === activeGroupIdBlitz);
      let updatedRounds = [...data.blitzRounds];

      if (round && round.status === 'waiting') {
        console.log('[AppData] Starting blitz round:', round.roundId);
        updatedRounds = updatedRounds.map((r) =>
          r.roundId === round!.roundId
            ? { ...r, status: 'live' as const, endsAt: Date.now() + 5 * 60 * 1000 }
            : r
        );
        round = updatedRounds.find((r) => r.roundId === round!.roundId);
      }

      if (!round) {
        console.error('[AppData] No round found for group:', activeGroupIdBlitz);
        return;
      }

      const now = new Date();
      const createdAt = now.toISOString();
      const photoId = generateStableId(activeGroupIdBlitz, 'blitz', MOCK_ACTIVE_USER_ID);

      const newPhoto: BlitzPhoto = {
        photoId,
        groupId: activeGroupIdBlitz,
        userId: MOCK_ACTIVE_USER_ID,
        roundId: round.roundId,
        createdAt,
        imageUri,
        x: Math.random() * 100 + 20,
        y: Math.random() * 100 + 20,
        zIndex: blitzPhotosForRound.length + 1,
        textOverlay,
      };
      console.log('[AppData] Adding blitz photo:', newPhoto.photoId, { userId: MOCK_ACTIVE_USER_ID, groupId: activeGroupIdBlitz, roundId: round.roundId });
      
      const mergedPhotos = mergePhotosById(data.blitzPhotos, [newPhoto]);
      const sortedPhotos = mergedPhotos.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      
      const updatedData = {
        ...data,
        blitzRounds: updatedRounds,
        blitzPhotos: sortedPhotos,
      };
      saveMutate(updatedData);
    },
    [data, activeGroupIdBlitz, blitzRounds, blitzPhotosForRound.length, saveMutate]
  );

  const updateBlitzPhotoPosition = useCallback(
    (photoId: string, x: number, y: number, zIndex: number) => {
      if (!data) return;
      console.log('[AppData] Updating blitz photo position:', photoId, { x, y, zIndex });
      const updatedPhotos = data.blitzPhotos.map((p) =>
        p.photoId === photoId ? { ...p, x, y, zIndex } : p
      );
      saveMutate({ ...data, blitzPhotos: updatedPhotos });
    },
    [data, saveMutate]
  );

  const endBlitzRound = useCallback(
    (groupId: string) => {
      if (!data) return;
      console.log('[AppData] Ending blitz round for group:', groupId);
      const newRoundId = generateId();
      
      const oldRound = data.blitzRounds.find((r) => r.groupId === groupId);
      const newPrompt = getRandomPrompt(oldRound?.prompt);
      
      const seenGroups = new Set<string>();
      const deduped = data.blitzRounds
        .map((r) => {
          if (r.groupId === groupId) {
            return { roundId: newRoundId, groupId, status: 'waiting' as const, prompt: newPrompt };
          }
          return r;
        })
        .filter((r) => {
          if (seenGroups.has(r.groupId)) return false;
          seenGroups.add(r.groupId);
          return true;
        });

      saveMutate({ ...data, blitzRounds: deduped });
    },
    [data, saveMutate]
  );

  const seedMockData = useCallback(async () => {
    console.log('[AppData] Seeding mock data...');
    const initial = createInitialMockData();
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    queryClient.invalidateQueries({ queryKey: ['appData'] });
  }, [queryClient]);

  const clearAllData = useCallback(async () => {
    console.log('[AppData] Clearing all data...');
    await AsyncStorage.removeItem(STORAGE_KEY);
    queryClient.invalidateQueries({ queryKey: ['appData'] });
  }, [queryClient]);

  const addGroup = useCallback(
    (groupName: string, emoji?: string) => {
      if (!data) return;
      const newGroup: Group = {
        groupId: generateId(),
        groupName,
        emoji,
        members: [],
      };
      console.log('[AppData] Adding group:', newGroup.groupId);
      const newRound: BlitzRound = {
        roundId: generateId(),
        groupId: newGroup.groupId,
        status: 'waiting',
        prompt: getRandomPrompt(),
      };
      saveMutate({
        ...data,
        groups: [...data.groups, newGroup],
        blitzRounds: [...data.blitzRounds, newRound],
      });
    },
    [data, saveMutate]
  );

  const addMemberToGroup = useCallback(
    (groupId: string, name: string, initials: string) => {
      if (!data) return;
      console.log('[AppData] Adding member to group:', groupId, name);
      const updatedGroups = data.groups.map((g) => {
        if (g.groupId === groupId) {
          return {
            ...g,
            members: [
              ...g.members,
              { userId: generateId(), name, initials },
            ],
          };
        }
        return g;
      });
      saveMutate({ ...data, groups: updatedGroups });
    },
    [data, saveMutate]
  );

  const removeMemberFromGroup = useCallback(
    (groupId: string, userId: string) => {
      if (!data) return;
      console.log('[AppData] Removing member from group:', groupId, userId);
      const updatedGroups = data.groups.map((g) => {
        if (g.groupId === groupId) {
          return {
            ...g,
            members: g.members.filter((m) => m.userId !== userId),
          };
        }
        return g;
      });
      saveMutate({ ...data, groups: updatedGroups });
    },
    [data, saveMutate]
  );

  const addTestTodayPhoto = useCallback(() => {
    const testImages = [
      'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=400&h=400&fit=crop',
    ];
    const randomImage = testImages[Math.floor(Math.random() * testImages.length)];
    addTodayPhoto(randomImage);
  }, [addTodayPhoto]);

  const addTestBlitzPhoto = useCallback(() => {
    const testImages = [
      'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1682695797221-8164ff1fafc9?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1682686581427-7c80ab60e3f3?w=400&h=400&fit=crop',
    ];
    const randomImage = testImages[Math.floor(Math.random() * testImages.length)];
    addBlitzPhoto(randomImage);
  }, [addBlitzPhoto]);

  const getBlitzRoundForGroup = useCallback(
    (groupId: string) => {
      return blitzRounds.find((r) => r.groupId === groupId);
    },
    [blitzRounds]
  );

  const allDateKeys = useMemo(() => {
    const keys = new Set(todayPhotos.map((p) => p.dateKey));
    return Array.from(keys).sort().reverse();
  }, [todayPhotos]);

  const getPhotosForDate = useCallback(
    (dateKey: string) => {
      return todayPhotos.filter((p) => p.dateKey === dateKey);
    },
    [todayPhotos]
  );

  const hasPostedToday = useMemo(() => {
    const cycleStart = getTodayCycleStart();
    const cycleEnd = getTodayCycleEnd();
    return todayPhotos.some(
      (p) =>
        p.userId === MOCK_ACTIVE_USER_ID &&
        p.groupId === activeGroupIdToday &&
        p.dateKey === todayDateKey &&
        p.createdAt >= cycleStart &&
        p.createdAt <= cycleEnd
    );
  }, [todayPhotos, activeGroupIdToday, todayDateKey]);

  const hasPostedBlitz = useMemo(() => {
    if (!currentBlitzRound) return false;
    return blitzPhotos.some(
      (p) =>
        p.userId === MOCK_ACTIVE_USER_ID &&
        p.groupId === activeGroupIdBlitz &&
        p.roundId === currentBlitzRound.roundId
    );
  }, [blitzPhotos, activeGroupIdBlitz, currentBlitzRound]);

  return {
    isLoading: dataQuery.isLoading,
    groups,
    todayPhotos,
    blitzRounds,
    blitzPhotos,
    activeGroupIdToday,
    setActiveGroupIdToday,
    activeGroupIdBlitz,
    setActiveGroupIdBlitz,
    todayPhotosForGroup,
    currentBlitzRound,
    blitzPhotosForRound,
    addTodayPhoto,
    updateTodayPhotoPosition,
    addBlitzPhoto,
    updateBlitzPhotoPosition,
    endBlitzRound,
    seedMockData,
    clearAllData,
    addGroup,
    addMemberToGroup,
    removeMemberFromGroup,
    addTestTodayPhoto,
    addTestBlitzPhoto,
    getBlitzRoundForGroup,
    allDateKeys,
    getPhotosForDate,
    todayDateKey,
    activeUserId: MOCK_ACTIVE_USER_ID,
    hasPostedToday,
    hasPostedBlitz,
    todayCycleStart: getTodayCycleStart(),
    todayCycleEnd: getTodayCycleEnd(),
  };
});
