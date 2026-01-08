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
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface Friend {
  uid: string;
  email: string;
  username?: string;
}

export const [SocialProvider, useSocial] = createContextHook(() => {
  const { uid } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) {
      setFriends([]);
      return;
    }

    console.log('[Social] Setting up friends listener for:', uid);
    setIsLoading(true);

    const friendshipsRef = collection(db, 'friendships');
    const q1 = query(friendshipsRef, where('uidA', '==', uid));
    const q2 = query(friendshipsRef, where('uidB', '==', uid));

    const unsubscribers: (() => void)[] = [];

    const loadFriends = async () => {
      try {
        const [snap1, snap2] = await Promise.all([
          getDocs(q1),
          getDocs(q2),
        ]);

        const friendUids = new Set<string>();
        snap1.forEach((doc) => {
          const data = doc.data();
          friendUids.add(data.uidB);
        });
        snap2.forEach((doc) => {
          const data = doc.data();
          friendUids.add(data.uidA);
        });

        console.log('[Social] Found friend UIDs:', Array.from(friendUids));

        const friendsData = await Promise.all(
          Array.from(friendUids).map(async (friendUid): Promise<Friend | null> => {
            const userDoc = await getDoc(doc(db, 'users', friendUid));
            if (userDoc.exists()) {
              const data = userDoc.data();
              return {
                uid: friendUid,
                email: data.email || '',
                username: data.username,
              } as Friend;
            }
            return null;
          })
        );

        const validFriends = friendsData.filter((f): f is Friend => f !== null);
        console.log('[Social] Loaded friends:', validFriends.length);
        setFriends(validFriends);
        setIsLoading(false);
      } catch (err) {
        console.error('[Social] Error loading friends:', err);
        setError('Failed to load friends');
        setIsLoading(false);
      }
    };

    loadFriends();

    const unsub1 = onSnapshot(q1, () => loadFriends());
    const unsub2 = onSnapshot(q2, () => loadFriends());
    unsubscribers.push(unsub1, unsub2);

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [uid]);

  const addFriendByEmail = async (email: string): Promise<{ success: boolean; error?: string }> => {
    if (!uid) {
      return { success: false, error: 'Not logged in' };
    }

    try {
      console.log('[Social] Looking up user by email:', email);
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email));
      const snap = await getDocs(q);

      if (snap.empty) {
        return { success: false, error: 'User not found' };
      }

      const friendDoc = snap.docs[0];
      const friendUid = friendDoc.id;

      if (friendUid === uid) {
        return { success: false, error: 'Cannot add yourself as a friend' };
      }

      const [uidA, uidB] = [uid, friendUid].sort();
      const friendshipId = `${uidA}_${uidB}`;

      console.log('[Social] Creating friendship:', friendshipId);
      await setDoc(doc(db, 'friendships', friendshipId), {
        uidA,
        uidB,
        createdAt: serverTimestamp(),
      }, { merge: true });

      return { success: true };
    } catch (err) {
      console.error('[Social] Error adding friend:', err);
      return { success: false, error: 'Failed to add friend' };
    }
  };

  const addFriendByUsername = async (username: string): Promise<{ success: boolean; error?: string }> => {
    if (!uid) {
      return { success: false, error: 'Not logged in' };
    }

    try {
      console.log('[Social] Looking up user by username:', username);
      const usernameDoc = await getDoc(doc(db, 'usernames', username.toLowerCase()));

      if (!usernameDoc.exists()) {
        return { success: false, error: 'User not found' };
      }

      const friendUid = usernameDoc.data().uid;

      if (friendUid === uid) {
        return { success: false, error: 'Cannot add yourself as a friend' };
      }

      const [uidA, uidB] = [uid, friendUid].sort();
      const friendshipId = `${uidA}_${uidB}`;

      console.log('[Social] Creating friendship:', friendshipId);
      await setDoc(doc(db, 'friendships', friendshipId), {
        uidA,
        uidB,
        createdAt: serverTimestamp(),
      }, { merge: true });

      return { success: true };
    } catch (err) {
      console.error('[Social] Error adding friend:', err);
      return { success: false, error: 'Failed to add friend' };
    }
  };

  return {
    friends,
    isLoading,
    error,
    addFriendByEmail,
    addFriendByUsername,
    friendCount: friends.length,
  };
});
