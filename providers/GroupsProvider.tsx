import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  getDoc,
  serverTimestamp,
  onSnapshot,
  addDoc,
  deleteDoc,
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
        const allGroupsSnap = await getDocs(collection(db, 'groups'));
        const myGroups: GroupData[] = [];

        for (const groupDoc of allGroupsSnap.docs) {
          const groupId = groupDoc.id;
          const groupData = groupDoc.data();

          const memberDoc = await getDoc(
            doc(db, 'groups', groupId, 'members', uid)
          );

          if (!memberDoc.exists()) continue;

          const membersSnap = await getDocs(
            collection(db, 'groups', groupId, 'members')
          );

          const members = await Promise.all(
            membersSnap.docs.map(async (memberDoc): Promise<GroupMemberData | null> => {
              const memberData = memberDoc.data();
              const memberUid = memberDoc.id;
              const userDoc = await getDoc(doc(db, 'users', memberUid));
              if (!userDoc.exists()) return null;

              const userData = userDoc.data();
              return {
                uid: memberUid,
                email: userData.email || memberUid,
                username: userData.displayName,
                role: memberData.role as 'owner' | 'member',
              } as GroupMemberData;
            })
          );

          myGroups.push({
            groupId,
            name: groupData.name,
            emoji: groupData.emoji,
            createdBy: groupData.createdBy,
            members: members.filter((m): m is GroupMemberData => m !== null),
          });
        }

        console.log('[Groups] Loaded groups:', myGroups.length);
        setGroups(myGroups);
        setIsLoading(false);
      } catch (err) {
        console.error('[Groups] Error loading groups:', err);
        setError('Failed to load groups');
        setIsLoading(false);
      }
    };

    loadGroups();

    const groupsRef = collection(db, 'groups');
    const unsubscribe = onSnapshot(groupsRef, () => {
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

      await setDoc(doc(db, 'groups', groupId, 'members', uid), {
        role: 'admin',
        joinedAt: serverTimestamp(),
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
      await setDoc(doc(db, 'groups', groupId, 'members', memberUid), {
        role: 'member',
        joinedAt: serverTimestamp(),
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
      const memberDocRef = doc(db, 'groups', groupId, 'members', memberUid);
      await deleteDoc(memberDocRef);

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

      await setDoc(doc(db, 'groups', groupId, 'invites', code), {
        createdBy: uid,
        createdAt: serverTimestamp(),
        status: 'pending',
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
      const groupsSnap = await getDocs(collection(db, 'groups'));
      let inviteDoc: any = null;
      let groupId: string | null = null;

      for (const gDoc of groupsSnap.docs) {
        const invDoc = await getDoc(doc(db, 'groups', gDoc.id, 'invites', code));
        if (invDoc.exists()) {
          inviteDoc = invDoc;
          groupId = gDoc.id;
          break;
        }
      }

      if (!inviteDoc || !groupId) {
        return { success: false, error: 'Invalid invite code' };
      }

      const inviteData = inviteDoc.data();
      if (inviteData.status !== 'approved') {
        return { success: false, error: 'Invite must be approved by admin first' };
      }

      await setDoc(doc(db, 'groups', groupId, 'members', uid), {
        role: 'member',
        joinedAt: serverTimestamp(),
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
