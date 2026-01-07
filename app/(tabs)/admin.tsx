import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  Trash2, 
  Clock, 
  ImagePlus, 
  Zap,
  RefreshCw,
} from 'lucide-react-native';
import { useAppData } from '@/providers/AppDataProvider';
import Colors from '@/constants/colors';
import { useRouter } from 'expo-router';

export default function AdminScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    clearAllData,
    resetToFirstLaunch,
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



  const handleClearData = useCallback(async () => {
    console.log('[Admin] Clearing all data...');
    await clearAllData();
    showAlert('Success', 'All data cleared');
  }, [clearAllData, showAlert]);

  const [resetConfirmInput, setResetConfirmInput] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleResetData = useCallback(() => {
    if (Platform.OS === 'web') {
      const confirmed = confirm('This will clear ALL local data and require re-authentication. Type OK to confirm:');
      if (confirmed) {
        setShowResetConfirm(true);
      }
    } else {
      Alert.alert(
        'Reset to First Launch',
        'This will clear ALL local data (photos, groups, user ID). You will need to re-authenticate.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue', onPress: () => setShowResetConfirm(true) }
        ]
      );
    }
  }, []);

  const handleConfirmReset = useCallback(async () => {
    if (resetConfirmInput.toUpperCase() !== 'RESET') {
      showAlert('Error', 'Please type RESET to confirm');
      return;
    }
    console.log('[Admin] Resetting to first launch...');
    await resetToFirstLaunch();
    setShowResetConfirm(false);
    setResetConfirmInput('');
    if (Platform.OS === 'web') {
      alert('Reset complete. All local data cleared. Backend authentication required.');
    } else {
      Alert.alert('Reset Complete', 'All local data cleared. Backend authentication required for new session.');
    }
    router.replace('/(tabs)');
  }, [resetToFirstLaunch, router, resetConfirmInput, showAlert]);

  const handleLockAdmin = useCallback(async () => {
    console.log('[Admin] Locking admin tab...');
    await AsyncStorage.removeItem('tapin_admin_unlocked_v1');
    showAlert('Locked', 'Admin tab will be hidden after navigation.');
    router.replace('/(tabs)');
  }, [router, showAlert]);

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
          <Text style={styles.title}>ADMIN (Hidden)</Text>
          <Text style={styles.subtitle}>Testing & Debug Tools</Text>
        </View>

        <TouchableOpacity 
          style={[styles.actionButton, styles.lockButton]}
          onPress={handleLockAdmin}
          activeOpacity={0.7}
        >
          <RefreshCw size={20} color="#FFA500" />
          <View style={styles.buttonContent}>
            <Text style={styles.buttonTitle}>Lock Admin</Text>
            <Text style={styles.buttonSubtitle}>Hide admin tab from tab bar</Text>
          </View>
        </TouchableOpacity>

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
            onPress={handleClearData}
            activeOpacity={0.7}
          >
            <Trash2 size={20} color="#FF6B6B" />
            <View style={styles.buttonContent}>
              <Text style={styles.buttonTitle}>Clear All Data</Text>
              <Text style={styles.buttonSubtitle}>Remove all stored data</Text>
            </View>
          </TouchableOpacity>

          {showResetConfirm ? (
            <View style={[styles.actionButton, styles.resetButton]}>
              <View style={styles.confirmContainer}>
                <Text style={styles.confirmTitle}>Type RESET to confirm:</Text>
                <TextInput
                  style={styles.confirmInput}
                  value={resetConfirmInput}
                  onChangeText={setResetConfirmInput}
                  placeholder="Type RESET"
                  placeholderTextColor={Colors.dark.textSecondary}
                  autoCapitalize="characters"
                />
                <View style={styles.confirmButtons}>
                  <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={handleConfirmReset}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.confirmButtonText}>Confirm</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.confirmButton, styles.cancelButton]}
                    onPress={() => {
                      setShowResetConfirm(false);
                      setResetConfirmInput('');
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.confirmButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : (
            <TouchableOpacity 
              style={[styles.actionButton, styles.resetButton]}
              onPress={handleResetData}
              activeOpacity={0.7}
            >
              <RefreshCw size={20} color="#FF4444" />
              <View style={styles.buttonContent}>
                <Text style={styles.buttonTitle}>Reset Data (Clear Local Cache)</Text>
                <Text style={styles.buttonSubtitle}>Clear ALL local data - auth required after reset</Text>
              </View>
            </TouchableOpacity>
          )}

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
            Admin tools for testing. Backend integration required for production.
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
  resetButton: {
    borderWidth: 2,
    borderColor: '#FF4444',
    flexDirection: 'column',
  },
  lockButton: {
    borderWidth: 2,
    borderColor: '#FFA500',
    marginBottom: 16,
  },
  confirmContainer: {
    flex: 1,
    width: '100%',
  },
  confirmTitle: {
    color: Colors.dark.text,
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 8,
  },
  confirmInput: {
    backgroundColor: Colors.dark.background,
    color: Colors.dark.text,
    fontSize: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginBottom: 12,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#FF4444',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.dark.border,
  },
  confirmButtonText: {
    color: Colors.dark.text,
    fontSize: 14,
    fontWeight: '600' as const,
  },
});
