import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle, XCircle, LogIn } from 'lucide-react-native';
import { useAuth } from '@/providers/AuthProvider';
import { useGroups } from '@/providers/GroupsProvider';
import AuthModal from '@/components/AuthModal';
import Colors from '@/constants/colors';

type JoinState = 'loading' | 'success' | 'error' | 'auth_required';

export default function JoinScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { groupId, code } = useLocalSearchParams<{ groupId: string; code: string }>();
  const { uid } = useAuth();
  const { joinGroupByCode } = useGroups();
  
  const [state, setState] = useState<JoinState>('loading');
  const [error, setError] = useState<string>('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [joinedGroupId, setJoinedGroupId] = useState<string>('');

  useEffect(() => {
    if (!groupId || !code) {
      setState('error');
      setError('Invalid invite link - missing groupId or code');
      return;
    }

    if (!uid) {
      console.log('[Join] User not logged in, showing auth prompt');
      setState('auth_required');
      return;
    }

    handleJoin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, groupId, code]);

  const handleJoin = async () => {
    if (!uid || !groupId || !code) return;

    setState('loading');
    setError('');

    console.log('[Join] Attempting to join group:', groupId, 'with code:', code);
    const result = await joinGroupByCode(groupId, code);

    if (result.success) {
      console.log('[Join] Successfully joined group');
      setState('success');
      setJoinedGroupId(result.groupId || groupId);
      
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 1500);
    } else {
      console.error('[Join] Failed to join group:', result.error);
      setState('error');
      setError(result.error || 'Failed to join group');
    }
  };

  const handleAuthComplete = () => {
    setShowAuthModal(false);
    if (uid) {
      handleJoin();
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
        <View style={styles.content}>
          {state === 'loading' && (
            <>
              <ActivityIndicator size="large" color={Colors.dark.accent} />
              <Text style={styles.title}>Joining group...</Text>
              <View style={styles.debugInfo}>
                <Text style={styles.debugText}>GroupId: {groupId?.slice(0, 8)}...</Text>
                <Text style={styles.debugText}>Code: {code}</Text>
                <Text style={styles.debugText}>UserId: {uid?.slice(0, 8)}...</Text>
              </View>
            </>
          )}

          {state === 'auth_required' && (
            <>
              <LogIn size={64} color={Colors.dark.accent} />
              <Text style={styles.title}>Login Required</Text>
              <Text style={styles.message}>You need to log in to join this group</Text>
              <TouchableOpacity 
                style={styles.button}
                onPress={() => setShowAuthModal(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.buttonText}>Log In</Text>
              </TouchableOpacity>
              <View style={styles.debugInfo}>
                <Text style={styles.debugText}>InviteLink source: firestore</Text>
                <Text style={styles.debugText}>GroupId: {groupId?.slice(0, 8)}...</Text>
                <Text style={styles.debugText}>Code: {code}</Text>
              </View>
            </>
          )}

          {state === 'success' && (
            <>
              <CheckCircle size={64} color="#00FF00" />
              <Text style={styles.title}>Welcome!</Text>
              <Text style={styles.message}>You&apos;ve successfully joined the group</Text>
              <Text style={styles.subMessage}>Redirecting to app...</Text>
              <View style={styles.debugInfo}>
                <Text style={styles.debugText}>Joined GroupId: {joinedGroupId.slice(0, 8)}...</Text>
              </View>
            </>
          )}

          {state === 'error' && (
            <>
              <XCircle size={64} color="#FF6B6B" />
              <Text style={styles.title}>Oops!</Text>
              <Text style={styles.errorMessage}>{error}</Text>
              <TouchableOpacity 
                style={styles.button}
                onPress={() => router.replace('/(tabs)')}
                activeOpacity={0.8}
              >
                <Text style={styles.buttonText}>Go to App</Text>
              </TouchableOpacity>
              <View style={styles.debugInfo}>
                <Text style={styles.debugText}>GroupId: {groupId?.slice(0, 8) || 'missing'}</Text>
                <Text style={styles.debugText}>Code: {code || 'missing'}</Text>
                <Text style={styles.debugText}>Error: {error}</Text>
              </View>
            </>
          )}
        </View>
      </View>
      <AuthModal visible={showAuthModal} onClose={handleAuthComplete} />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.dark.text,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  subMessage: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#FF6B6B',
    textAlign: 'center',
    lineHeight: 24,
  },
  button: {
    backgroundColor: Colors.dark.accent,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 12,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  debugInfo: {
    marginTop: 20,
    padding: 12,
    backgroundColor: Colors.dark.surface,
    borderRadius: 8,
    alignSelf: 'stretch',
  },
  debugText: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
    fontFamily: 'monospace' as const,
    marginBottom: 4,
  },
});
