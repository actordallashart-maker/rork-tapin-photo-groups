import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Plus, Trash2 } from 'lucide-react-native';
import { useAppData } from '@/providers/AppDataProvider';
import Colors from '@/constants/colors';

const AVATAR_COLORS = ['#FF6B6B', '#4ECDC4', '#A78BFA', '#F472B6', '#60A5FA', '#FCD34D'];

export default function GroupDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const { groups, addMemberToGroup, removeMemberFromGroup } = useAppData();

  const [isAddingMember, setIsAddingMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');

  const group = useMemo(() => {
    return groups.find((g) => g.groupId === groupId);
  }, [groups, groupId]);

  const handleAddMember = useCallback(() => {
    if (!newMemberName.trim() || !groupId) {
      if (Platform.OS === 'web') {
        alert('Please enter a member name');
      } else {
        Alert.alert('Error', 'Please enter a member name');
      }
      return;
    }

    const initials = newMemberName
      .trim()
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    console.log('[GroupDetail] Adding member:', newMemberName);
    addMemberToGroup(groupId, newMemberName.trim(), initials);
    setNewMemberName('');
    setIsAddingMember(false);
  }, [newMemberName, groupId, addMemberToGroup]);

  const handleRemoveMember = useCallback(
    (userId: string, memberName: string) => {
      if (!groupId) return;

      const confirmRemove = () => {
        console.log('[GroupDetail] Removing member:', userId);
        removeMemberFromGroup(groupId, userId);
      };

      if (Platform.OS === 'web') {
        if (window.confirm(`Remove ${memberName} from this group?`)) {
          confirmRemove();
        }
      } else {
        Alert.alert(
          'Remove Member',
          `Remove ${memberName} from this group?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Remove', style: 'destructive', onPress: confirmRemove },
          ]
        );
      }
    },
    [groupId, removeMemberFromGroup]
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
          <Text style={styles.title}>{group.groupName}</Text>
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
            <Text style={styles.groupName}>{group.groupName}</Text>
            <Text style={styles.memberCount}>
              {group.members.length} member{group.members.length !== 1 ? 's' : ''}
            </Text>
          </View>

          <Text style={styles.sectionTitle}>Members</Text>

          <View style={styles.membersList}>
            {group.members.map((member, index) => (
              <View key={member.userId} style={styles.memberItem}>
                <View
                  style={[
                    styles.memberAvatar,
                    { backgroundColor: AVATAR_COLORS[index % AVATAR_COLORS.length] },
                  ]}
                >
                  <Text style={styles.memberInitials}>{member.initials}</Text>
                </View>
                <Text style={styles.memberName}>{member.name}</Text>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveMember(member.userId, member.name)}
                >
                  <Trash2 size={18} color={Colors.dark.textSecondary} />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {isAddingMember ? (
            <View style={styles.addMemberForm}>
              <TextInput
                style={styles.input}
                placeholder="Member name"
                placeholderTextColor={Colors.dark.textSecondary}
                value={newMemberName}
                onChangeText={setNewMemberName}
                autoFocus
              />
              <View style={styles.formButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setIsAddingMember(false);
                    setNewMemberName('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.addButton} onPress={handleAddMember}>
                  <Text style={styles.addButtonText}>Add Member</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addMemberButton}
              onPress={() => setIsAddingMember(true)}
            >
              <Plus size={20} color={Colors.dark.accent} />
              <Text style={styles.addMemberButtonText}>Add Member</Text>
            </TouchableOpacity>
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
    flex: 1,
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: '500' as const,
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
});
