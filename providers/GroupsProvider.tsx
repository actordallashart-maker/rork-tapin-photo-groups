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
  collectionGroup,
  query,
  getDocs,
  documentId,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getRandomPrompt } from '@/constants/blitz-prompts';

const STORAGE_KEY_ACTIVE_GROUP = 'tapin_active_group_id';

export interface GroupMemberData {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: 'admin' | 'member';
  joinedAt: string;
}

export interface GroupData {
  groupId: string;
  name: string;
  emoji?: string;
  createdBy: string;
  members: GroupMemberData[];
}

export const [GroupsProvider, useGroups] = createContextHook(() => {
  const { uid } = useAuth();
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastCreateGroupError, setLastCreateGroupError] = useState<string | null>(null);
  const [createGroupStep, setCreateGroupStep] = useState<string>('');
  const [inviteLinkGenerated, setInviteLinkGenerated] = useState<string>('');
  const [inviteDocPath, setInviteDocPath] = useState<string>('');

  useEffect(() => {
    if (!uid) {
      setGroups([]);
      setActiveGroupId('');
      return;
    }

    const loadGroups = async () => {
      setIsLoading(true);
      setError(null);
      try {
        console.log('[Groups] Loading groups for uid:', uid.slice(0, 8));
        
        const membersQuery = query(
          collectionGroup(db, 'members'),
          where(documentId(), '==', uid)
        );
        
        const membersSnapshot = await getDocs(membersQuery);
        console.log('[Groups] Found memberships:', membersSnapshot.size);
        
        const groupIds = new Set<string>();
        const groupDataList: GroupData[] = [];
        
        for (const memberDoc of membersSnapshot.docs) {
          const groupId = memberDoc.ref.parent.parent?.id;
          if (!groupId || groupIds.has(groupId)) continue;
          groupIds.add(groupId);
          
          console.log('[Groups] Loading group:', groupId.slice(0, 8));
          const groupDocRef = doc(db, 'groups', groupId);
          const groupSnap = await getDoc(groupDocRef);
          
          if (groupSnap.exists()) {
            const groupData = groupSnap.data();
            
            const membersSnapshot = await getDocs(collection(db, 'groups', groupId, 'members'));
            const members: GroupMemberData[] = [];
            
            for (const memberDoc of membersSnapshot.docs) {
              const memberData = memberDoc.data();
              const userDoc = await getDoc(doc(db, 'users', memberDoc.id));
              const userData = userDoc.exists() ? userDoc.data() : {};
              
              members.push({
                uid: memberDoc.id,
                email: userData.email || memberDoc.id,
                displayName: userData.displayName || '',
                photoURL: userData.photoURL || '',
                role: memberData.role || 'member',
                joinedAt: memberData.joinedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
              });
            }
            
            groupDataList.push({
              groupId,
              name: groupData.name,
              emoji: groupData.emoji,
              createdBy: groupData.createdBy,
              members,
            });
          }
        }
        
        console.log('[Groups] Loaded groups:', groupDataList.length);
        setGroups(groupDataList);
        setError(null);
        
        const stored = await AsyncStorage.getItem(STORAGE_KEY_ACTIVE_GROUP);
        if (stored && groupDataList.some(g => g.groupId === stored)) {
          setActiveGroupId(stored);
        } else if (groupDataList.length > 0) {
          setActiveGroupId(groupDataList[0].groupId);
          await AsyncStorage.setItem(STORAGE_KEY_ACTIVE_GROUP, groupDataList[0].groupId);
        }
      } catch (err: any) {
        console.error('[Groups] Error loading groups:', err);
        setError(err.message || 'Failed to load groups');
      } finally {
        setIsLoading(false);
      }
    };

    loadGroups();
  }, [uid]);

  const createGroup = async (name: string, emoji?: string): Promise<{ success: boolean; groupId?: string; error?: string }> => {
    if (!uid) {
      setLastCreateGroupError('Not logged in');
      setCreateGroupStep('error: not logged in');
      return { success: false, error: 'Not logged in' };
    }

    try {
      setCreateGroupStep('creating group doc...');
      console.log('[Groups] Step 1: Creating group doc:', name);
      
      const groupRef = await addDoc(collection(db, 'groups'), {
        name,
        createdBy: uid,
        createdAt: Timestamp.now(),
      });

      const groupId = groupRef.id;
      setCreateGroupStep(`groupWritten (${groupId.slice(0, 8)})`);
      console.log('[Groups] Step 2: Group doc created:', groupId);

      setCreateGroupStep('creating membership...');
      console.log('[Groups] Step 3: Creating admin membership for uid:', uid);
      
      await setDoc(doc(db, 'groups', groupId, 'members', uid), {
        role: 'admin',
        joinedAt: Timestamp.now(),
      });

      setCreateGroupStep('memberWritten');
      console.log('[Groups] Step 4: Admin membership created');

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
            displayName: '',
            photoURL: '',
            role: 'admin',
            joinedAt: new Date().toISOString(),
          }],
        };
        setGroups(prev => [...prev, newGroup]);
        setError(null);
        setLastCreateGroupError(null);
      }

      setCreateGroupStep('OK');
      
      const newRoundRef = await addDoc(collection(db, 'groups', groupId, 'blitzRounds'), {
        prompt: getRandomPrompt(),
        status: 'waiting',
        createdAt: Timestamp.now(),
      });
      console.log('[Groups] Created initial blitz round:', newRoundRef.id);
      
      if (!activeGroupId || activeGroupId === '' || groups.length === 0) {
        setActiveGroupId(groupId);
        await AsyncStorage.setItem(STORAGE_KEY_ACTIVE_GROUP, groupId);
      }
      
      return { success: true, groupId };
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to create group';
      console.error('[Groups] Error creating group:', err);
      setLastCreateGroupError(errorMsg);
      setCreateGroupStep(`error: ${errorMsg}`);
      return { success: false, error: errorMsg };
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
      console.log('[Groups] Generating invite link for group:', groupId.slice(0, 8));

      const inviteLink = Linking.createURL('join', { 
        queryParams: { groupId } 
      });

      console.log('[Groups] Invite link created:', inviteLink);
      setInviteLinkGenerated(inviteLink);
      setInviteDocPath(`(no doc - just groupId in URL)`);
      return { success: true, inviteLink };
    } catch (err: any) {
      console.error('[Groups] Error generating invite:', err);
      return { success: false, error: err.message || 'Failed to generate invite' };
    }
  };

  const joinGroupByCode = async (groupId: string): Promise<{ success: boolean; groupId?: string; status?: string; error?: string }> => {
    if (!uid) {
      return { success: false, error: 'Not logged in' };
    }

    try {
      console.log('[Groups] Creating invite request for group:', groupId.slice(0, 8));
      
      await setDoc(doc(db, 'groups', groupId, 'invites', uid), {
        createdBy: uid,
        createdAt: Timestamp.now(),
        status: 'pending',
      });

      console.log('[Groups] Invite request created, status: pending');
      return { success: true, groupId, status: 'pending' };
    } catch (err: any) {
      console.error('[Groups] Error creating invite request:', err);
      return { success: false, error: err.message || 'Failed to create invite request' };
    }
  };

  const checkInviteStatus = async (groupId: string): Promise<{ status: string; error?: string }> => {
    if (!uid) {
      return { status: 'error', error: 'Not logged in' };
    }

    try {
      const inviteDoc = await getDoc(doc(db, 'groups', groupId, 'invites', uid));
      
      if (!inviteDoc.exists()) {
        return { status: 'missing' };
      }

      const inviteData = inviteDoc.data();
      return { status: inviteData.status };
    } catch (err: any) {
      console.error('[Groups] Error checking invite status:', err);
      return { status: 'error', error: err.message };
    }
  };

  const completeJoin = async (groupId: string): Promise<{ success: boolean; error?: string }> => {
    if (!uid) {
      return { success: false, error: 'Not logged in' };
    }

    try {
      console.log('[Groups] Completing join for approved invite:', groupId.slice(0, 8));
      
      await setDoc(doc(db, 'groups', groupId, 'members', uid), {
        role: 'member',
        joinedAt: Timestamp.now(),
      });

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
            displayName: '',
            photoURL: '',
            role: 'member',
            joinedAt: new Date().toISOString(),
          }],
        };
        setGroups(prev => {
          const exists = prev.find(g => g.groupId === groupId);
          if (exists) return prev;
          return [...prev, newGroup];
        });
        
        setActiveGroupId(groupId);
        await AsyncStorage.setItem(STORAGE_KEY_ACTIVE_GROUP, groupId);
      }

      return { success: true };
    } catch (err: any) {
      console.error('[Groups] Error completing join:', err);
      return { success: false, error: err.message || 'Failed to join group' };
    }
  };

  const getGroup = (groupId: string): GroupData | undefined => {
    return groups.find((g) => g.groupId === groupId);
  };

  const getPendingInvites = async (groupId: string): Promise<{ inviteId: string; createdBy: string; createdAt: string; note?: string }[]> => {
    if (!uid) return [];
    
    try {
      const invitesSnapshot = await getDocs(collection(db, 'groups', groupId, 'invites'));
      const invites = [];
      
      for (const inviteDoc of invitesSnapshot.docs) {
        const inviteData = inviteDoc.data();
        if (inviteData.status === 'pending') {
          invites.push({
            inviteId: inviteDoc.id,
            createdBy: inviteData.createdBy,
            createdAt: inviteData.createdAt?.toDate?.()?.toISOString() || '',
            note: inviteData.note || '',
          });
        }
      }
      
      return invites;
    } catch (err: any) {
      console.error('[Groups] Error loading invites:', err);
      return [];
    }
  };

  const approveInvite = async (groupId: string, inviteeUid: string): Promise<{ success: boolean; error?: string }> => {
    if (!uid) {
      return { success: false, error: 'Not logged in' };
    }

    try {
      console.log('[Groups] Approving invite:', groupId, inviteeUid);
      await setDoc(doc(db, 'groups', groupId, 'invites', inviteeUid), {
        status: 'approved',
      }, { merge: true });
      
      return { success: true };
    } catch (err: any) {
      console.error('[Groups] Error approving invite:', err);
      return { success: false, error: err.message || 'Failed to approve invite' };
    }
  };

  const declineInvite = async (groupId: string, inviteeUid: string): Promise<{ success: boolean; error?: string }> => {
    if (!uid) {
      return { success: false, error: 'Not logged in' };
    }

    try {
      console.log('[Groups] Declining invite:', groupId, inviteeUid);
      await deleteDoc(doc(db, 'groups', groupId, 'invites', inviteeUid));
      
      return { success: true };
    } catch (err: any) {
      console.error('[Groups] Error declining invite:', err);
      return { success: false, error: err.message || 'Failed to decline invite' };
    }
  };

  const switchGroup = async (groupId: string) => {
    setActiveGroupId(groupId);
    await AsyncStorage.setItem(STORAGE_KEY_ACTIVE_GROUP, groupId);
  };

  return {
    groups,
    activeGroupId,
    switchGroup,
    isLoading,
    error,
    lastCreateGroupError,
    createGroupStep,
    createGroup,
    addMemberToGroup,
    removeMemberFromGroup,
    generateInviteLink,
    joinGroupByCode,
    checkInviteStatus,
    completeJoin,
    getGroup,
    groupCount: groups.length,
    inviteLinkGenerated,
    inviteDocPath,
    getPendingInvites,
    approveInvite,
    declineInvite,
  };
});
