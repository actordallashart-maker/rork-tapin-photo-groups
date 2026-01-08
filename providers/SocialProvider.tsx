import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';

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

    console.log('[Social] CRITICAL: Firebase rules do not define friendships collection.');
    console.log('[Social] All friendship operations will fail until rules are updated.');
    setIsLoading(false);
    setError('Friendships not supported - Firebase rules missing');
  }, [uid]);

  const addFriendByEmail = async (email: string): Promise<{ success: boolean; error?: string }> => {
    return { 
      success: false, 
      error: 'Friendships disabled - Firebase security rules do not define friendships collection. Contact admin to update rules.' 
    };
  };

  const addFriendByUsername = async (username: string): Promise<{ success: boolean; error?: string }> => {
    return { 
      success: false, 
      error: 'Friendships disabled - Firebase security rules do not define friendships collection. Contact admin to update rules.' 
    };
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
