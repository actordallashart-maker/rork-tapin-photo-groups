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
import { Users, Plus, X, LogIn, LogOut } from 'lucide-react-native';
import { useAppData } from '@/providers/AppDataProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useGroups } from '@/providers/GroupsProvider';
import { useSocial } from '@/providers/SocialProvider';
import AuthModal from '@/components/AuthModal';
import Colors from '@/constants/colors';

const EMOJI_OPTIONS = ['👯', '👨‍👩‍👧‍👦', '💼', '🎉', '🏠', '🎮', '🏋️', '📚', '🎸', '✈️'];

export default function GroupsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { activeUserId } = useAppData();
  const { uid, email, signOut } = useAuth();
  const { groups, createGroup } = useGroups();
  const { friendCount } = useSocial();
  const [isCreating, setIsCreating] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState(EMOJI_OPTIONS[0]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);

  const handleCreateGroup = useCallback(async () => {
    if (!uid) {
      setShowAuthModal(true);
      return;
    }
    if (!newGroupName.trim()) {
      if (Platform.OS === 'web') {
        alert('Please enter a group name');
      } else {
        Alert.alert('Error', 'Please enter a group name');
      }
      return;
    }
    console.log('[Groups] Creating group:', newGroupName, selectedEmoji);
    const result = await createGroup(newGroupName.trim(), selectedEmoji);
    if (result.success) {
      setNewGroupName('');
      setSelectedEmoji(EMOJI_OPTIONS[0]);
      setIsCreating(false);
    } else {
      if (Platform.OS === 'web') {
        alert(result.error || 'Failed to create group');
      } else {
        Alert.alert('Error', result.error || 'Failed to create group');
      }
    }
  }, [newGroupName, selectedEmoji, createGroup, uid]);

  const handleSignOut = useCallback(async () => {
    const confirmSignOut = () => {
      signOut();
      setShowAccountMenu(false);
    };
    
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to log out?')) {
        confirmSignOut();
      }
    } else {
      Alert.alert('Log out', 'Are you sure you want to log out?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log out', style: 'destructive', onPress: confirmSignOut },
      ]);
    }
  }, [signOut]);

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
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.title}>Groups</Text>
              <Text style={styles.subtitle}>Manage your groups</Text>
              {uid && (
                <Text style={styles.debugText}>
                  Source: firestore | Groups: {groups.length} | Friends: {friendCount}
                </Text>
              )}
            </View>
            {uid ? (
              <TouchableOpacity 
                style={styles.authButton}
                onPress={() => setShowAccountMenu(!showAccountMenu)}
                activeOpacity={0.7}
              >
                <View style={styles.userAvatar}>
                  <Text style={styles.userAvatarText}>{email?.[0]?.toUpperCase() || 'U'}</Text>
                </View>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={styles.loginButton}
                onPress={() => setShowAuthModal(true)}
                activeOpacity={0.8}
              >
                <LogIn size={20} color="white" />
                <Text style={styles.loginButtonText}>Log in</Text>
              </TouchableOpacity>
            )}
          </View>
          {showAccountMenu && uid && (
            <View style={styles.accountMenu}>
              <Text style={styles.accountEmail}>{email}</Text>
              <Text style={styles.accountUserId}>User ID: {activeUserId.slice(0, 8)}...</Text>
              <TouchableOpacity 
                style={styles.logoutButton}
                onPress={handleSignOut}
                activeOpacity={0.7}
              >
                <LogOut size={18} color="#FF6B6B" />
                <Text style={styles.logoutButtonText}>Log out</Text>
              </TouchableOpacity>
            </View>
          )}
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
                <Text style={styles.groupName}>{group.name}</Text>
                <Text style={styles.memberCount}>
                  {group.members.length} member{group.members.length !== 1 ? 's' : ''}
                </Text>
              </View>
              <View style={styles.avatarStack}>
                {group.members.slice(0, 3).map((member, index) => (
                  <View
                    key={member.uid}
                    style={[
                      styles.memberAvatar,
                      { 
                        backgroundColor: ['#FF6B6B', '#4ECDC4', '#A78BFA'][index % 3],
                        marginLeft: index > 0 ? -10 : 0,
                        zIndex: 3 - index,
                      }
                    ]}
                  >
                    <Text style={styles.memberInitials}>
                      {member.username?.[0]?.toUpperCase() || member.email[0]?.toUpperCase()}
                    </Text>
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
      <AuthModal visible={showAuthModal} onClose={() => setShowAuthModal(false)} />
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  authButton: {
    padding: 4,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.dark.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700' as const,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.accent,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  accountMenu: {
    backgroundColor: Colors.dark.surfaceLight,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  accountEmail: {
    color: Colors.dark.text,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  accountUserId: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  logoutButtonText: {
    color: '#FF6B6B',
    fontSize: 14,
    fontWeight: '600' as const,
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
  debugText: {
    color: Colors.dark.textSecondary,
    fontSize: 11,
    marginTop: 4,
  },
});
