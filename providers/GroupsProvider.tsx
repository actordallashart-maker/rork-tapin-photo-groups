import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  setDoc, 
  getDoc,
  serverTimestamp,
  onSnapshot,
  addDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface GroupMemberData {
  uid: string;
  email: string;
  username?: string;
  role: 'owner' | 'member';
}

export interface GroupData {
  groupId: string;
  name: string;
  emoji?: string;
  createdBy: string;
  members: GroupMemberData[];
}

const generateInviteCode = (): string => {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
};

export const [GroupsProvider, useGroups] = createContextHook(() => {
  const { uid } = useAuth();
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) {
      setGroups([]);
      return;
    }

    console.log('[Groups] Setting up groups listener for:', uid);
    setIsLoading(true);

    const loadGroups = async () => {
      try {
        const membershipsRef = collection(db, 'groupMembers');
        const q = query(membershipsRef, where('uid', '==', uid));
        const snap = await getDocs(q);

        const groupIds = snap.docs.map((doc) => doc.data().groupId);
        console.log('[Groups] Found group memberships:', groupIds);

        if (groupIds.length === 0) {
          setGroups([]);
          setIsLoading(false);
          return;
        }

        const groupsData = await Promise.all(
          groupIds.map(async (groupId): Promise<GroupData | null> => {
            const groupDoc = await getDoc(doc(db, 'groups', groupId));
            if (!groupDoc.exists()) return null;

            const groupData = groupDoc.data();

            const membersSnap = await getDocs(
              query(collection(db, 'groupMembers'), where('groupId', '==', groupId))
            );

            const members = await Promise.all(
              membersSnap.docs.map(async (memberDoc): Promise<GroupMemberData | null> => {
                const memberData = memberDoc.data();
                const userDoc = await getDoc(doc(db, 'users', memberData.uid));
                if (!userDoc.exists()) return null;

                const userData = userDoc.data();
                return {
                  uid: memberData.uid,
                  email: userData.email || '',
                  username: userData.username,
                  role: memberData.role as 'owner' | 'member',
                } as GroupMemberData;
              })
            );

            return {
              groupId,
              name: groupData.name,
              emoji: groupData.emoji,
              createdBy: groupData.createdBy,
              members: members.filter((m): m is GroupMemberData => m !== null),
            } as GroupData;
          })
        );

        const validGroups = groupsData.filter((g): g is GroupData => g !== null);
        console.log('[Groups] Loaded groups:', validGroups.length);
        setGroups(validGroups);
        setIsLoading(false);
      } catch (err) {
        console.error('[Groups] Error loading groups:', err);
        setError('Failed to load groups');
        setIsLoading(false);
      }
    };

    loadGroups();

    const membershipsRef = collection(db, 'groupMembers');
    const q = query(membershipsRef, where('uid', '==', uid));
    const unsubscribe = onSnapshot(q, () => {
      loadGroups();
    });

    return unsubscribe;
  }, [uid]);

  const createGroup = async (name: string, emoji?: string): Promise<{ success: boolean; groupId?: string; error?: string }> => {
    if (!uid) {
      return { success: false, error: 'Not logged in' };
    }

    try {
      console.log('[Groups] Creating group:', name);
      const groupRef = await addDoc(collection(db, 'groups'), {
        name,
        emoji,
        createdBy: uid,
        createdAt: serverTimestamp(),
      });

      const groupId = groupRef.id;

      await setDoc(doc(db, 'groupMembers', `${groupId}_${uid}`), {
        groupId,
        uid,
        role: 'owner',
        createdAt: serverTimestamp(),
      });

      console.log('[Groups] Group created:', groupId);
      return { success: true, groupId };
    } catch (err) {
      console.error('[Groups] Error creating group:', err);
      return { success: false, error: 'Failed to create group' };
    }
  };

  const addMemberToGroup = async (groupId: string, memberUid: string): Promise<{ success: boolean; error?: string }> => {
    if (!uid) {
      return { success: false, error: 'Not logged in' };
    }

    try {
      console.log('[Groups] Adding member to group:', groupId, memberUid);
      await setDoc(doc(db, 'groupMembers', `${groupId}_${memberUid}`), {
        groupId,
        uid: memberUid,
        role: 'member',
        createdAt: serverTimestamp(),
      }, { merge: true });

      return { success: true };
    } catch (err) {
      console.error('[Groups] Error adding member:', err);
      return { success: false, error: 'Failed to add member' };
    }
  };

  const removeMemberFromGroup = async (groupId: string, memberUid: string): Promise<{ success: boolean; error?: string }> => {
    if (!uid) {
      return { success: false, error: 'Not logged in' };
    }

    try {
      console.log('[Groups] Removing member from group:', groupId, memberUid);
      const memberDocRef = doc(db, 'groupMembers', `${groupId}_${memberUid}`);
      await setDoc(memberDocRef, { active: false }, { merge: true });

      return { success: true };
    } catch (err) {
      console.error('[Groups] Error removing member:', err);
      return { success: false, error: 'Failed to remove member' };
    }
  };

  const generateInviteLink = async (groupId: string): Promise<{ success: boolean; inviteLink?: string; error?: string }> => {
    if (!uid) {
      return { success: false, error: 'Not logged in' };
    }

    try {
      const code = generateInviteCode();
      console.log('[Groups] Generating invite code:', code);

      await setDoc(doc(db, 'groupInvites', code), {
        code,
        groupId,
        createdBy: uid,
        createdAt: serverTimestamp(),
        active: true,
      });

      const appUrl = process.env.EXPO_PUBLIC_APP_URL || 'https://tapin.app';
      const inviteLink = `${appUrl}/join?code=${code}`;

      return { success: true, inviteLink };
    } catch (err) {
      console.error('[Groups] Error generating invite:', err);
      return { success: false, error: 'Failed to generate invite' };
    }
  };

  const joinGroupByCode = async (code: string): Promise<{ success: boolean; groupId?: string; error?: string }> => {
    if (!uid) {
      return { success: false, error: 'Not logged in' };
    }

    try {
      console.log('[Groups] Joining group with code:', code);
      const inviteDoc = await getDoc(doc(db, 'groupInvites', code));

      if (!inviteDoc.exists()) {
        return { success: false, error: 'Invalid invite code' };
      }

      const inviteData = inviteDoc.data();
      if (!inviteData.active) {
        return { success: false, error: 'Invite code expired' };
      }

      const groupId = inviteData.groupId;

      await setDoc(doc(db, 'groupMembers', `${groupId}_${uid}`), {
        groupId,
        uid,
        role: 'member',
        createdAt: serverTimestamp(),
      }, { merge: true });

      return { success: true, groupId };
    } catch (err) {
      console.error('[Groups] Error joining group:', err);
      return { success: false, error: 'Failed to join group' };
    }
  };

  const getGroup = (groupId: string): GroupData | undefined => {
    return groups.find((g) => g.groupId === groupId);
  };

  return {
    groups,
    isLoading,
    error,
    createGroup,
    addMemberToGroup,
    removeMemberFromGroup,
    generateInviteLink,
    joinGroupByCode,
    getGroup,
    groupCount: groups.length,
  };
});
