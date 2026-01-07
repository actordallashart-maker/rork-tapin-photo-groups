import React, { useCallback, useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppData } from '@/providers/AppDataProvider';
import GroupSwitcher from '@/components/GroupSwitcher';
import PhotoContainer from '@/components/PhotoContainer';
import BlitzLivePill from '@/components/BlitzLivePill';

import Colors from '@/constants/colors';

export default function TodayScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    groups,
    activeGroupIdToday,
    setActiveGroupIdToday,
    todayPhotosForGroup,
    updateTodayPhotoPosition,
    getBlitzRoundForGroup,
    setActiveGroupIdBlitz,
    hasPostedToday,
  } = useAppData();

  const [blitzSecondsRemaining, setBlitzSecondsRemaining] = useState<number | null>(null);
  const [isDraggingPhoto, setIsDraggingPhoto] = useState(false);

  const blitzRound = getBlitzRoundForGroup(activeGroupIdToday);
  const isBlitzLive = blitzRound?.status === 'live' && blitzRound?.endsAt;

  useEffect(() => {
    if (!isBlitzLive || !blitzRound?.endsAt) {
      setBlitzSecondsRemaining(null);
      return;
    }

    const updateTimer = () => {
      const remaining = Math.max(0, Math.floor((blitzRound.endsAt! - Date.now()) / 1000));
      setBlitzSecondsRemaining(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [isBlitzLive, blitzRound?.endsAt]);

  const handleBlitzPress = useCallback(() => {
    console.log('[Today] Navigating to Blitz tab');
    setActiveGroupIdBlitz(activeGroupIdToday);
    router.push('/(tabs)/blitz');
  }, [router, activeGroupIdToday, setActiveGroupIdBlitz]);

  const formatDate = () => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'short', day: 'numeric' };
    return now.toLocaleDateString('en-US', options);
  };

  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTapIn = useCallback(() => {
    console.log('[Today] Tap In pressed');
    router.push('/camera?mode=today');
  }, [router]);

  const handleLongPressStart = useCallback(() => {
    longPressTimer.current = setTimeout(async () => {
      console.log('[Today] Admin unlock triggered');
      await AsyncStorage.setItem('tapin_admin_unlocked_v1', 'true');
      if (Platform.OS === 'web') {
        alert('Admin unlocked! Navigate to Admin tab.');
      } else {
        Alert.alert('Admin Unlocked', 'Admin tab is now visible in the tab bar.');
      }
    }, 2000);
  }, []);

  const handleLongPressEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!isDraggingPhoto}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Today</Text>
          <Text style={styles.date}>{formatDate()}</Text>
        </View>

        <GroupSwitcher
          groups={groups}
          selectedGroupId={activeGroupIdToday}
          onSelectGroup={(groupId) => {
            console.log('[Today] Group switched to:', groupId);
            setActiveGroupIdToday(groupId);
          }}
        />

        {isBlitzLive && blitzSecondsRemaining !== null && (
          <View style={styles.blitzPillContainer}>
            <BlitzLivePill
              secondsRemaining={blitzSecondsRemaining}
              onPress={handleBlitzPress}
            />
          </View>
        )}

        <View style={styles.photoContainerWrapper}>
          <PhotoContainer
            photos={todayPhotosForGroup}
            onPositionChange={updateTodayPhotoPosition}
            emptyText="No photos yet today"
            onDragStart={() => setIsDraggingPhoto(true)}
            onDragEnd={() => setIsDraggingPhoto(false)}
          />
        </View>

        <TouchableOpacity 
          style={[
            styles.tapInButton,
            hasPostedToday && styles.tapInButtonDisabled
          ]} 
          onPress={handleTapIn}
          onLongPress={handleLongPressStart}
          onPressOut={handleLongPressEnd}
          activeOpacity={0.8}
          disabled={hasPostedToday}
          delayLongPress={2000}
        >
          <View style={styles.tapInButtonInner}>
            <Text style={styles.tapInButtonText}>
              {hasPostedToday ? "You've posted today" : 'Tap In'}
            </Text>
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
  },
  title: {
    fontSize: 36,
    fontWeight: '700' as const,
    color: Colors.dark.text,
  },
  date: {
    fontSize: 16,
    color: Colors.dark.textSecondary,
    marginTop: 4,
  },
  blitzPillContainer: {
    marginBottom: 16,
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
    textAlign: 'center' as const,
  },
  tapInButtonDisabled: {
    opacity: 0.5,
  },
});
