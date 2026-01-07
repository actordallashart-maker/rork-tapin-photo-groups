import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  Database, 
  Trash2, 
  Clock, 
  ImagePlus, 
  Zap,
  RefreshCw,
} from 'lucide-react-native';
import { useAppData } from '@/providers/AppDataProvider';
import Colors from '@/constants/colors';

export default function AdminScreen() {
  const insets = useSafeAreaInsets();
  const {
    seedMockData,
    clearAllData,
    endBlitzRound,
    activeGroupIdToday,
    activeGroupIdBlitz,
    addTestTodayPhoto,
    addTestBlitzPhoto,
    currentBlitzRound,
    groups,
    todayPhotos,
    blitzPhotos,
    blitzRounds,
  } = useAppData();

  const showAlert = useCallback((title: string, message: string) => {
    if (Platform.OS === 'web') {
      alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  }, []);

  const handleSeedData = useCallback(async () => {
    console.log('[Admin] Seeding mock data...');
    await seedMockData();
    showAlert('Success', 'Mock data seeded successfully');
  }, [seedMockData, showAlert]);

  const handleClearData = useCallback(async () => {
    console.log('[Admin] Clearing all data...');
    await clearAllData();
    showAlert('Success', 'All data cleared');
  }, [clearAllData, showAlert]);

  const handleEndBlitzRound = useCallback(() => {
    if (!currentBlitzRound || currentBlitzRound.status !== 'live') {
      showAlert('Info', 'No active Blitz round to end');
      return;
    }
    console.log('[Admin] Forcing Blitz round end...');
    endBlitzRound(activeGroupIdBlitz);
    showAlert('Success', 'Blitz round ended, new round created');
  }, [currentBlitzRound, endBlitzRound, activeGroupIdBlitz, showAlert]);

  const handleAddTestTodayPhoto = useCallback(() => {
    console.log('[Admin] Adding test Today photo...');
    addTestTodayPhoto();
    showAlert('Success', 'Test photo added to Today');
  }, [addTestTodayPhoto, showAlert]);

  const handleAddTestBlitzPhoto = useCallback(() => {
    console.log('[Admin] Adding test Blitz photo...');
    addTestBlitzPhoto();
    showAlert('Success', 'Test photo added to Blitz');
  }, [addTestBlitzPhoto, showAlert]);

  const activeGroup = groups.find(g => g.groupId === activeGroupIdToday);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Admin</Text>
          <Text style={styles.subtitle}>Testing & Debug Tools</Text>
        </View>

        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Current Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{groups.length}</Text>
              <Text style={styles.statLabel}>Groups</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{todayPhotos.length}</Text>
              <Text style={styles.statLabel}>Today Photos</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{blitzPhotos.length}</Text>
              <Text style={styles.statLabel}>Blitz Photos</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{blitzRounds.filter(r => r.status === 'live').length}</Text>
              <Text style={styles.statLabel}>Live Rounds</Text>
            </View>
          </View>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.sectionTitle}>Active Context</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Today Group:</Text>
            <Text style={styles.infoValue}>{activeGroup?.groupName ?? 'None'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Blitz Status:</Text>
            <Text style={styles.infoValue}>{currentBlitzRound?.status ?? 'None'}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Actions</Text>

        <View style={styles.buttonList}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleSeedData}
            activeOpacity={0.7}
          >
            <Database size={20} color={Colors.dark.accent} />
            <View style={styles.buttonContent}>
              <Text style={styles.buttonTitle}>Seed Mock Data</Text>
              <Text style={styles.buttonSubtitle}>Reset to initial mock data</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleClearData}
            activeOpacity={0.7}
          >
            <Trash2 size={20} color="#FF6B6B" />
            <View style={styles.buttonContent}>
              <Text style={styles.buttonTitle}>Clear All Data</Text>
              <Text style={styles.buttonSubtitle}>Remove all stored data</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleEndBlitzRound}
            activeOpacity={0.7}
          >
            <Clock size={20} color={Colors.dark.blitzYellow} />
            <View style={styles.buttonContent}>
              <Text style={styles.buttonTitle}>Force End Blitz Round</Text>
              <Text style={styles.buttonSubtitle}>End current round, start new one</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleAddTestTodayPhoto}
            activeOpacity={0.7}
          >
            <ImagePlus size={20} color="#4ECDC4" />
            <View style={styles.buttonContent}>
              <Text style={styles.buttonTitle}>Add Test Today Photo</Text>
              <Text style={styles.buttonSubtitle}>Add random photo to active group</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleAddTestBlitzPhoto}
            activeOpacity={0.7}
          >
            <Zap size={20} color={Colors.dark.blitzYellow} />
            <View style={styles.buttonContent}>
              <Text style={styles.buttonTitle}>Add Test Blitz Photo</Text>
              <Text style={styles.buttonSubtitle}>Add random photo to current round</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.warningBox}>
          <RefreshCw size={16} color={Colors.dark.textSecondary} />
          <Text style={styles.warningText}>
            Pull to refresh or switch tabs to see updates
          </Text>
        </View>
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
    marginBottom: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: '700' as const,
    color: Colors.dark.text,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.dark.textSecondary,
    marginTop: 4,
  },
  sectionTitle: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '600' as const,
    marginBottom: 16,
  },
  statsContainer: {
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.dark.surface,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    color: Colors.dark.accent,
    fontSize: 28,
    fontWeight: '700' as const,
  },
  statLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  infoContainer: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  infoLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 14,
  },
  infoValue: {
    color: Colors.dark.text,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  buttonList: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    padding: 16,
    borderRadius: 16,
    gap: 16,
  },
  buttonContent: {
    flex: 1,
  },
  buttonTitle: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  buttonSubtitle: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
    padding: 12,
    backgroundColor: Colors.dark.surface,
    borderRadius: 12,
  },
  warningText: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    flex: 1,
  },
});
