import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Zap } from 'lucide-react-native';
import { useAppData } from '@/providers/AppDataProvider';
import { useGroups } from '@/providers/GroupsProvider';
import { useAuth } from '@/providers/AuthProvider';
import GroupSwitcher from '@/components/GroupSwitcher';
import PhotoContainer from '@/components/PhotoContainer';

import Colors from '@/constants/colors';

export default function BlitzScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { uid } = useAuth();
  const { groups, activeGroupId, switchGroup } = useGroups();
  const {
    blitzPhotosForRound,
    currentBlitzRound,
    updateBlitzPhotoPosition,
    endBlitzRound,
  } = useAppData();

  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const [isDraggingPhoto, setIsDraggingPhoto] = useState(false);

  const isLive = currentBlitzRound?.status === 'live' && currentBlitzRound?.endsAt;
  const isWaiting = currentBlitzRound?.status === 'waiting';

  useEffect(() => {
    if (!isLive || !currentBlitzRound?.endsAt) {
      setSecondsRemaining(null);
      return;
    }

    const updateTimer = () => {
      const remaining = Math.max(0, Math.floor((currentBlitzRound.endsAt! - Date.now()) / 1000));
      setSecondsRemaining(remaining);

      if (remaining <= 0) {
        console.log('[Blitz] Round ended, creating new round');
        endBlitzRound(activeGroupId);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [isLive, currentBlitzRound?.endsAt, activeGroupId, endBlitzRound]);

  const handleCameraPress = useCallback(() => {
    console.log('[Blitz] Opening camera');
    router.push('/camera?mode=blitz');
  }, [router]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!isDraggingPhoto}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Blitz</Text>
          {isLive && secondsRemaining !== null && (
            <View style={styles.timerContainer}>
              <Zap size={20} color={Colors.dark.blitzYellow} fill={Colors.dark.blitzYellow} />
              <Text style={styles.timerText}>{formatTime(secondsRemaining)}</Text>
            </View>
          )}
          {isWaiting && (
            <Text style={styles.waitingText}>Waiting for first photo...</Text>
          )}
        </View>

        <Text style={styles.debugText}>GroupsLoaded: {groups.length} | activeGroupId: {activeGroupId?.slice(0, 8) || 'none'} | uid: {uid?.slice(0, 6) || 'none'}</Text>

        <GroupSwitcher
          groups={groups}
          selectedGroupId={activeGroupId}
          onSelectGroup={(groupId) => {
            console.log('[Blitz] Group switched to:', groupId);
            switchGroup(groupId);
          }}
        />

        {currentBlitzRound?.prompt && (
          <View style={styles.promptContainer}>
            <Text style={styles.promptLabel}>Challenge:</Text>
            <Text style={styles.promptText}>{currentBlitzRound.prompt}</Text>
          </View>
        )}

        <View style={styles.statusContainer}>
          {isLive && (
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE ROUND</Text>
            </View>
          )}
          {isWaiting && (
            <Text style={styles.hintText}>Post a photo to start a 5-minute Blitz round!</Text>
          )}
        </View>

        <View style={styles.photoContainerWrapper}>
          <PhotoContainer
            photos={blitzPhotosForRound}
            onPositionChange={updateBlitzPhotoPosition}
            emptyText={isWaiting ? 'Start the Blitz!' : 'No photos yet'}
            onDragStart={() => setIsDraggingPhoto(true)}
            onDragEnd={() => setIsDraggingPhoto(false)}
          />
        </View>

        <TouchableOpacity 
          style={styles.tapInButton} 
          onPress={handleCameraPress}
          activeOpacity={0.8}
        >
          <View style={styles.tapInButtonInner}>
            <Text style={styles.tapInButtonText}>Tap In</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  header: {
    marginTop: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 36,
    fontWeight: '700' as const,
    color: Colors.dark.text,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    gap: 6,
  },
  timerText: {
    color: Colors.dark.blitzYellow,
    fontSize: 18,
    fontWeight: '700' as const,
  },
  waitingText: {
    color: Colors.dark.textSecondary,
    fontSize: 14,
  },
  statusContainer: {
    marginBottom: 16,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF4444',
  },
  liveText: {
    color: '#FF4444',
    fontSize: 12,
    fontWeight: '700' as const,
    letterSpacing: 1,
  },
  hintText: {
    color: Colors.dark.textSecondary,
    fontSize: 14,
  },
  promptContainer: {
    backgroundColor: Colors.dark.surface,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.dark.blitzYellow,
  },
  promptLabel: {
    color: Colors.dark.blitzYellow,
    fontSize: 12,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    marginBottom: 6,
  },
  promptText: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  photoContainerWrapper: {
    minHeight: 420,
    marginBottom: 20,
  },
  tapInButton: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: Colors.dark.background,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 8,
  },
  tapInButtonInner: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: Colors.dark.surface,
    borderWidth: 4,
    borderColor: Colors.dark.blitzYellow,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.dark.blitzYellow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  tapInButtonText: {
    color: Colors.dark.blitzYellow,
    fontSize: 24,
    fontWeight: '700' as const,
  },
  debugText: {
    fontSize: 10,
    color: Colors.dark.textSecondary,
    marginBottom: 8,
    fontFamily: 'monospace' as const,
  },
});
