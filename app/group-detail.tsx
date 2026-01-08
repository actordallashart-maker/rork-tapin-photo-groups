import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Share,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Trash2, Share2 } from 'lucide-react-native';
import { useGroups } from '@/providers/GroupsProvider';
import { useAuth } from '@/providers/AuthProvider';
import Colors from '@/constants/colors';
import * as Clipboard from 'expo-clipboard';

const AVATAR_COLORS = ['#FF6B6B', '#4ECDC4', '#A78BFA', '#F472B6', '#60A5FA', '#FCD34D'];

export default function GroupDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const { getGroup, generateInviteLink, removeMemberFromGroup: removeFromGroup } = useGroups();
  const { uid } = useAuth();

  const [lastInviteLink, setLastInviteLink] = useState<string>('');
  const [inviteGeneratedAt, setInviteGeneratedAt] = useState<string>('');

  const group = useMemo(() => {
    return getGroup(groupId || '');
  }, [getGroup, groupId]);

  const handleGenerateInvite = useCallback(async () => {
    if (!groupId) return;

    const result = await generateInviteLink(groupId);
    if (result.success && result.inviteLink) {
      setLastInviteLink(result.inviteLink);
      setInviteGeneratedAt(new Date().toLocaleTimeString());

      if (Platform.OS === 'web') {
        await Clipboard.setStringAsync(result.inviteLink);
        alert('Invite link copied to clipboard!');
      } else {
        Alert.alert(
          'Invite Link Generated',
          result.inviteLink,
          [
            { 
              text: 'Copy', 
              onPress: async () => {
                await Clipboard.setStringAsync(result.inviteLink!);
              }
            },
            { 
              text: 'Share', 
              onPress: async () => {
                try {
                  await Share.share({ message: result.inviteLink! });
                } catch (err) {
                  console.error('Error sharing:', err);
                }
              }
            },
            { text: 'Close', style: 'cancel' },
          ]
        );
      }
    } else {
      if (Platform.OS === 'web') {
        alert(result.error || 'Failed to generate invite');
      } else {
        Alert.alert('Error', result.error || 'Failed to generate invite');
      }
    }
  }, [groupId, generateInviteLink]);

  const handleRemoveMember = useCallback(
    async (memberUid: string, memberEmail: string) => {
      if (!groupId) return;

      const confirmRemove = async () => {
        console.log('[GroupDetail] Removing member:', memberUid);
        const result = await removeFromGroup(groupId, memberUid);
        if (!result.success) {
          if (Platform.OS === 'web') {
            alert(result.error || 'Failed to remove member');
          } else {
            Alert.alert('Error', result.error || 'Failed to remove member');
          }
        }
      };

      if (Platform.OS === 'web') {
        if (window.confirm(`Remove ${memberEmail} from this group?`)) {
          await confirmRemove();
        }
      } else {
        Alert.alert(
          'Remove Member',
          `Remove ${memberEmail} from this group?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Remove', style: 'destructive', onPress: confirmRemove },
          ]
        );
      }
    },
    [groupId, removeFromGroup]
  );

  if (!group) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Group not found</Text>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Text style={styles.backButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <X size={28} color={Colors.dark.text} />
          </TouchableOpacity>
          <Text style={styles.title}>{group.name}</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.groupHeader}>
            <View style={styles.groupIcon}>
              <Text style={styles.groupEmoji}>{group.emoji || '👥'}</Text>
            </View>
            <Text style={styles.groupName}>{group.name}</Text>
            <Text style={styles.memberCount}>
              {group.members.length} member{group.members.length !== 1 ? 's' : ''}
            </Text>
            <Text style={styles.debugText}>
              Source: firestore | Members: {group.members.length}
            </Text>
          </View>

          <Text style={styles.sectionTitle}>Members</Text>

          <View style={styles.membersList}>
            {group.members.map((member, index) => (
              <View key={member.uid} style={styles.memberItem}>
                <View
                  style={[
                    styles.memberAvatar,
                    { backgroundColor: AVATAR_COLORS[index % AVATAR_COLORS.length] },
                  ]}
                >
                  <Text style={styles.memberInitials}>
                    {member.username?.[0]?.toUpperCase() || member.email[0]?.toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.memberName}>{member.username || member.email}</Text>
                  {member.role === 'owner' && (
                    <Text style={styles.memberRole}>Owner</Text>
                  )}
                </View>
                {member.uid !== uid && (
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemoveMember(member.uid, member.email)}
                  >
                    <Trash2 size={18} color={Colors.dark.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={styles.inviteButton}
            onPress={handleGenerateInvite}
            activeOpacity={0.8}
          >
            <Share2 size={20} color="white" />
            <Text style={styles.inviteButtonText}>Generate Invite Link</Text>
          </TouchableOpacity>

          {lastInviteLink && (
            <View style={styles.inviteLinkContainer}>
              <Text style={styles.inviteLinkLabel}>Last invite link:</Text>
              <Text style={styles.inviteLink} numberOfLines={1}>{lastInviteLink}</Text>
              <Text style={styles.inviteTime}>Generated at: {inviteGeneratedAt}</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.surface,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '600' as const,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  groupHeader: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  groupIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: Colors.dark.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  groupEmoji: {
    fontSize: 40,
  },
  groupName: {
    color: Colors.dark.text,
    fontSize: 24,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  memberCount: {
    color: Colors.dark.textSecondary,
    fontSize: 16,
  },
  sectionTitle: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '600' as const,
    marginBottom: 16,
  },
  membersList: {
    gap: 12,
    marginBottom: 24,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberInitials: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700' as const,
  },
  memberName: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: '500' as const,
  },
  memberRole: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  removeButton: {
    padding: 8,
  },
  addMemberForm: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  input: {
    backgroundColor: Colors.dark.surfaceLight,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Colors.dark.text,
    fontSize: 16,
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: Colors.dark.surfaceLight,
  },
  cancelButtonText: {
    color: Colors.dark.text,
    fontSize: 14,
    fontWeight: '500' as const,
  },
  addButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: Colors.dark.accent,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  addMemberButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.dark.surface,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    borderWidth: 2,
    borderColor: Colors.dark.accent,
    borderStyle: 'dashed',
  },
  addMemberButtonText: {
    color: Colors.dark.accent,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  errorText: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '600' as const,
  },
  backButton: {
    backgroundColor: Colors.dark.accent,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.dark.accent,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  inviteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  inviteLinkContainer: {
    backgroundColor: Colors.dark.surface,
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    gap: 6,
  },
  inviteLinkLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
  },
  inviteLink: {
    color: Colors.dark.text,
    fontSize: 14,
    fontFamily: 'monospace',
  },
  inviteTime: {
    color: Colors.dark.textSecondary,
    fontSize: 11,
  },
  debugText: {
    color: Colors.dark.textSecondary,
    fontSize: 11,
    marginTop: 4,
  },
});
