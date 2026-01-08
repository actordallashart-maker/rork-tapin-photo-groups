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
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const { uid } = useAuth();
  const { joinGroupByCode, checkInviteStatus, completeJoin } = useGroups();
  
  const [state, setState] = useState<JoinState>('loading');
  const [error, setError] = useState<string>('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [joinedGroupId, setJoinedGroupId] = useState<string>('');
  const [inviteStatus, setInviteStatus] = useState<string>('checking');

  useEffect(() => {
    if (!groupId) {
      setState('error');
      setError('Invalid invite link - missing groupId');
      return;
    }

    if (!uid) {
      console.log('[Join] User not logged in, showing auth prompt');
      setState('auth_required');
      return;
    }

    handleJoin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, groupId]);

  const handleJoin = async () => {
    if (!uid || !groupId) return;

    setState('loading');
    setError('');
    setInviteStatus('checking');

    console.log('[Join] Checking invite status for group:', groupId.slice(0, 8));
    const statusResult = await checkInviteStatus(groupId);

    if (statusResult.status === 'approved') {
      console.log('[Join] Invite approved, completing join');
      setInviteStatus('approved');
      const completeResult = await completeJoin(groupId);
      
      if (completeResult.success) {
        setState('success');
        setJoinedGroupId(groupId);
        setTimeout(() => {
          router.replace('/(tabs)');
        }, 1500);
      } else {
        setState('error');
        setError(completeResult.error || 'Failed to join group');
      }
    } else if (statusResult.status === 'pending') {
      console.log('[Join] Invite pending approval');
      setInviteStatus('pending');
      setState('error');
      setError('Invite request is pending admin approval. Check back later!');
    } else if (statusResult.status === 'missing') {
      console.log('[Join] No invite found, creating request');
      setInviteStatus('creating');
      const result = await joinGroupByCode(groupId);

      if (result.success && result.status === 'pending') {
        setInviteStatus('pending');
        setState('error');
        setError('Invite request sent! Waiting for admin approval.');
      } else {
        setState('error');
        setError(result.error || 'Failed to create invite request');
      }
    } else {
      setState('error');
      setError(statusResult.error || 'Failed to check invite status');
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
                <Text style={styles.debugText}>Join: groupId={groupId?.slice(0, 8)}... status={inviteStatus}</Text>
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
                <Text style={styles.debugText}>Join: groupId={groupId?.slice(0, 8)}... status=auth_required</Text>
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
                <Text style={styles.debugText}>Join: groupId={groupId?.slice(0, 8) || 'missing'} status={inviteStatus}</Text>
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
