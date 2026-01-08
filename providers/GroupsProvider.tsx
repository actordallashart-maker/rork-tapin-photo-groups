import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import * as Linking from 'expo-linking';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  Timestamp,
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

    console.log('[Groups] Note: Cannot auto-load groups due to security rules.');
    console.log('[Groups] Security rules require knowing specific groupId to read.');
    console.log('[Groups] Groups will only load after joining via invite code.');
    setIsLoading(false);
    setError('Cannot list groups - join via invite code instead');
  }, [uid]);

  const createGroup = async (name: string, emoji?: string): Promise<{ success: boolean; groupId?: string; error?: string }> => {
    if (!uid) {
      return { success: false, error: 'Not logged in' };
    }

    try {
      console.log('[Groups] Creating group:', name);
      const groupRef = await addDoc(collection(db, 'groups'), {
        name,
        createdBy: uid,
        createdAt: Timestamp.now(),
      });

      const groupId = groupRef.id;
      console.log('[Groups] Group doc created:', groupId);

      await setDoc(doc(db, 'groups', groupId, 'members', uid), {
        role: 'admin',
        joinedAt: Timestamp.now(),
      });

      console.log('[Groups] Admin membership created');

      const groupDoc = await getDoc(doc(db, 'groups', groupId));
      if (groupDoc.exists()) {
        const groupData = groupDoc.data();
        const newGroup: GroupData = {
          groupId,
          name: groupData.name,
          emoji: groupData.emoji,
          createdBy: groupData.createdBy,
          members: [{
            uid,
            email: 'you',
            role: 'owner',
          }],
        };
        setGroups(prev => [...prev, newGroup]);
        setError(null);
      }

      return { success: true, groupId };
    } catch (err: any) {
      console.error('[Groups] Error creating group:', err);
      return { success: false, error: err.message || 'Failed to create group' };
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
        joinedAt: Timestamp.now(),
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

  const generateInviteLink = async (groupId: string): Promise<{ success: boolean; inviteLink?: string; code?: string; error?: string }> => {
    if (!uid) {
      return { success: false, error: 'Not logged in' };
    }

    try {
      const code = generateInviteCode();
      console.log('[Groups] Generating invite code:', code, 'for group:', groupId);

      await setDoc(doc(db, 'groups', groupId, 'inviteLinks', code), {
        groupId,
        createdBy: uid,
        createdAt: Timestamp.now(),
        active: true,
      });

      const inviteLink = Linking.createURL('join', { 
        queryParams: { groupId, code } 
      });

      console.log('[Groups] Invite link created:', inviteLink);
      return { success: true, inviteLink, code };
    } catch (err: any) {
      console.error('[Groups] Error generating invite:', err);
      return { success: false, error: err.message || 'Failed to generate invite' };
    }
  };

  const joinGroupByCode = async (groupId: string, code: string): Promise<{ success: boolean; groupId?: string; error?: string }> => {
    if (!uid) {
      return { success: false, error: 'Not logged in' };
    }

    try {
      console.log('[Groups] Joining group:', groupId, 'with code:', code);
      
      const inviteDoc = await getDoc(doc(db, 'groups', groupId, 'inviteLinks', code));
      
      if (!inviteDoc.exists()) {
        return { success: false, error: 'Invalid invite link' };
      }

      const inviteData = inviteDoc.data();
      if (!inviteData.active) {
        return { success: false, error: 'Invite link is no longer active' };
      }

      await setDoc(doc(db, 'groups', groupId, 'members', uid), {
        role: 'member',
        joinedAt: Timestamp.now(),
      }, { merge: true });

      console.log('[Groups] Successfully joined group:', groupId);
      
      const groupDoc = await getDoc(doc(db, 'groups', groupId));
      if (groupDoc.exists()) {
        const groupData = groupDoc.data();
        const newGroup: GroupData = {
          groupId,
          name: groupData.name,
          emoji: groupData.emoji,
          createdBy: groupData.createdBy,
          members: [{
            uid,
            email: 'you',
            role: 'member',
          }],
        };
        setGroups(prev => {
          const exists = prev.find(g => g.groupId === groupId);
          if (exists) return prev;
          return [...prev, newGroup];
        });
      }

      return { success: true, groupId };
    } catch (err: any) {
      console.error('[Groups] Error joining group:', err);
      return { success: false, error: err.message || 'Failed to join group' };
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
