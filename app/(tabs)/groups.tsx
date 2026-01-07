import React, { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Users, Plus, X } from 'lucide-react-native';
import { useAppData } from '@/providers/AppDataProvider';
import Colors from '@/constants/colors';

const EMOJI_OPTIONS = ['👯', '👨‍👩‍👧‍👦', '💼', '🎉', '🏠', '🎮', '🏋️', '📚', '🎸', '✈️'];

export default function GroupsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { groups, addGroup } = useAppData();
  const [isCreating, setIsCreating] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState(EMOJI_OPTIONS[0]);

  const handleCreateGroup = useCallback(() => {
    if (!newGroupName.trim()) {
      if (Platform.OS === 'web') {
        alert('Please enter a group name');
      } else {
        Alert.alert('Error', 'Please enter a group name');
      }
      return;
    }
    console.log('[Groups] Creating group:', newGroupName, selectedEmoji);
    addGroup(newGroupName.trim(), selectedEmoji);
    setNewGroupName('');
    setSelectedEmoji(EMOJI_OPTIONS[0]);
    setIsCreating(false);
  }, [newGroupName, selectedEmoji, addGroup]);

  const handleCancel = useCallback(() => {
    setNewGroupName('');
    setSelectedEmoji(EMOJI_OPTIONS[0]);
    setIsCreating(false);
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Groups</Text>
          <Text style={styles.subtitle}>Manage your groups</Text>
        </View>

        {isCreating && (
          <View style={styles.createForm}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>New Group</Text>
              <TouchableOpacity onPress={handleCancel}>
                <X size={24} color={Colors.dark.textSecondary} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Group name"
              placeholderTextColor={Colors.dark.textSecondary}
              value={newGroupName}
              onChangeText={setNewGroupName}
              autoFocus
            />

            <Text style={styles.emojiLabel}>Choose an emoji</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.emojiRow}
            >
              {EMOJI_OPTIONS.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  style={[
                    styles.emojiOption,
                    selectedEmoji === emoji && styles.emojiOptionSelected,
                  ]}
                  onPress={() => setSelectedEmoji(emoji)}
                >
                  <Text style={styles.emoji}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity 
              style={styles.createButton}
              onPress={handleCreateGroup}
              activeOpacity={0.8}
            >
              <Text style={styles.createButtonText}>Create Group</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.groupList}>
          {groups.map((group) => (
            <TouchableOpacity 
              key={group.groupId} 
              style={styles.groupItem}
              onPress={() => router.push({ pathname: '/group-detail', params: { groupId: group.groupId } })}
              activeOpacity={0.7}
            >
              <View style={styles.groupIcon}>
                <Text style={styles.groupEmoji}>{group.emoji || '👥'}</Text>
              </View>
              <View style={styles.groupInfo}>
                <Text style={styles.groupName}>{group.groupName}</Text>
                <Text style={styles.memberCount}>
                  {group.members.length} member{group.members.length !== 1 ? 's' : ''}
                </Text>
              </View>
              <View style={styles.avatarStack}>
                {group.members.slice(0, 3).map((member, index) => (
                  <View
                    key={member.userId}
                    style={[
                      styles.memberAvatar,
                      { 
                        backgroundColor: ['#FF6B6B', '#4ECDC4', '#A78BFA'][index % 3],
                        marginLeft: index > 0 ? -10 : 0,
                        zIndex: 3 - index,
                      }
                    ]}
                  >
                    <Text style={styles.memberInitials}>{member.initials}</Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {!isCreating && (
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setIsCreating(true)}
            activeOpacity={0.8}
          >
            <Plus size={24} color="white" />
            <Text style={styles.addButtonText}>Create New Group</Text>
          </TouchableOpacity>
        )}

        {groups.length === 0 && !isCreating && (
          <View style={styles.emptyContainer}>
            <Users size={48} color={Colors.dark.textSecondary} />
            <Text style={styles.emptyText}>No groups yet</Text>
            <Text style={styles.emptySubtext}>Create a group to get started</Text>
          </View>
        )}
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
  createForm: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  formTitle: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '600' as const,
  },
  input: {
    backgroundColor: Colors.dark.surfaceLight,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: Colors.dark.text,
    fontSize: 16,
    marginBottom: 16,
  },
  emojiLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 14,
    marginBottom: 12,
  },
  emojiRow: {
    gap: 10,
    marginBottom: 20,
  },
  emojiOption: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.dark.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiOptionSelected: {
    borderWidth: 2,
    borderColor: Colors.dark.accent,
  },
  emoji: {
    fontSize: 24,
  },
  createButton: {
    backgroundColor: Colors.dark.accent,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  groupList: {
    gap: 12,
  },
  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  groupIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.dark.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupEmoji: {
    fontSize: 24,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  memberCount: {
    color: Colors.dark.textSecondary,
    fontSize: 14,
    marginTop: 2,
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.dark.surface,
  },
  memberInitials: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700' as const,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.dark.accent,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 24,
    gap: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '600' as const,
  },
  emptySubtext: {
    color: Colors.dark.textSecondary,
    fontSize: 14,
  },
});
