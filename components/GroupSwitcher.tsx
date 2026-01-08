import React, { useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { GroupData } from '@/providers/GroupsProvider';
import Colors from '@/constants/colors';

interface GroupSwitcherProps {
  groups: GroupData[];
  selectedGroupId: string;
  onSelectGroup: (groupId: string) => void;
}

const AVATAR_COLORS = ['#FF6B6B', '#4ECDC4', '#A78BFA', '#F472B6', '#60A5FA'];
const SCREEN_WIDTH = Dimensions.get('window').width;
const ITEM_WIDTH = SCREEN_WIDTH * 0.75;
const SPACING = (SCREEN_WIDTH - ITEM_WIDTH) / 2;

export default function GroupSwitcher({ groups, selectedGroupId, onSelectGroup }: GroupSwitcherProps) {
  const flatListRef = useRef<FlatList>(null);
  const scrollingRef = useRef(false);
  
  const currentIndex = useMemo(() => {
    const idx = groups.findIndex((g) => g.groupId === selectedGroupId);
    return idx >= 0 ? idx : 0;
  }, [groups, selectedGroupId]);

  useEffect(() => {
    console.log('[GroupSwitcher] Current state:', {
      selectedGroupId,
      currentIndex,
      totalGroups: groups.length,
    });
  }, [selectedGroupId, currentIndex, groups]);

  useEffect(() => {
    if (flatListRef.current && !scrollingRef.current) {
      flatListRef.current.scrollToOffset({
        offset: currentIndex * ITEM_WIDTH,
        animated: true,
      });
    }
  }, [currentIndex]);

  const onScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const contentOffsetX = event.nativeEvent.contentOffset.x;
      const index = Math.round(contentOffsetX / ITEM_WIDTH);
      const clampedIndex = Math.max(0, Math.min(index, groups.length - 1));
      
      console.log('[GroupSwitcher] Scroll ended:', {
        contentOffsetX,
        calculatedIndex: index,
        clampedIndex,
        currentIndex,
      });

      if (clampedIndex !== currentIndex && groups[clampedIndex]) {
        console.log('[GroupSwitcher] Calling onSelectGroup:', groups[clampedIndex].groupId);
        onSelectGroup(groups[clampedIndex].groupId);
      }
      
      scrollingRef.current = false;
    },
    [groups, currentIndex, onSelectGroup]
  );

  const onScrollBegin = useCallback(() => {
    scrollingRef.current = true;
  }, []);

  const handleGroupTap = useCallback(
    (groupId: string, index: number) => {
      console.log('[GroupSwitcher] Group tapped:', groupId, index);
      onSelectGroup(groupId);
      flatListRef.current?.scrollToOffset({
        offset: index * ITEM_WIDTH,
        animated: true,
      });
    },
    [onSelectGroup]
  );

  const renderAvatars = useCallback((members: GroupData['members']) => {
    const displayMembers = members.slice(0, 3);
    const extraCount = members.length - 3;

    return (
      <View style={styles.avatarsContainer}>
        {displayMembers.map((member, index) => (
          <View
            key={member.uid}
            style={[
              styles.avatar,
              { 
                backgroundColor: AVATAR_COLORS[index % AVATAR_COLORS.length],
                marginLeft: index > 0 ? -6 : 0,
                zIndex: displayMembers.length - index,
              },
            ]}
          >
            <Text style={styles.avatarText}>{member.email?.slice(0, 1).toUpperCase() || '?'}</Text>
          </View>
        ))}
        {extraCount > 0 && (
          <View style={[styles.avatar, styles.extraAvatar, { marginLeft: -6 }]}>
            <Text style={styles.extraAvatarText}>+{extraCount}</Text>
          </View>
        )}
      </View>
    );
  }, []);

  const renderItem = useCallback(
    ({ item, index }: { item: GroupData; index: number }) => {
      const isSelected = item.groupId === selectedGroupId;
      
      return (
        <TouchableOpacity
          style={[styles.itemContainer, { width: ITEM_WIDTH }]}
          onPress={() => handleGroupTap(item.groupId, index)}
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.groupCard,
              isSelected && styles.groupCardSelected,
            ]}
          >
            {item.emoji && <Text style={styles.emoji}>{item.emoji}</Text>}
            <Text style={styles.groupName}>{item.name}</Text>
            {renderAvatars(item.members)}
          </View>
        </TouchableOpacity>
      );
    },
    [selectedGroupId, handleGroupTap, renderAvatars]
  );

  if (groups.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.debugText}>selected={selectedGroupId.slice(0, 8)}</Text>
      <FlatList
        ref={flatListRef}
        data={groups}
        renderItem={renderItem}
        keyExtractor={(item) => item.groupId}
        horizontal
        pagingEnabled={false}
        showsHorizontalScrollIndicator={false}
        snapToInterval={ITEM_WIDTH}
        snapToAlignment="start"
        decelerationRate="fast"
        contentContainerStyle={{
          paddingHorizontal: SPACING,
        }}
        onMomentumScrollEnd={onScrollEnd}
        onScrollBeginDrag={onScrollBegin}
        getItemLayout={(_, index) => ({
          length: ITEM_WIDTH,
          offset: ITEM_WIDTH * index,
          index,
        })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 60,
    marginVertical: 8,
  },
  itemContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    gap: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    opacity: 0.6,
    overflow: 'hidden',
  },
  groupCardSelected: {
    borderColor: Colors.dark.accent,
    backgroundColor: Colors.dark.surfaceLight,
    opacity: 1,
  },
  emoji: {
    fontSize: 16,
  },
  groupName: {
    color: Colors.dark.text,
    fontSize: 15,
    fontWeight: '700' as const,
    flex: 1,
  },
  avatarsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.dark.surface,
  },
  avatarText: {
    color: 'white',
    fontSize: 8,
    fontWeight: '700' as const,
  },
  extraAvatar: {
    backgroundColor: Colors.dark.surfaceLight,
  },
  extraAvatarText: {
    color: Colors.dark.textSecondary,
    fontSize: 8,
    fontWeight: '600' as const,
  },
  debugText: {
    fontSize: 9,
    color: Colors.dark.textSecondary,
    textAlign: 'center' as const,
    marginBottom: 4,
    fontFamily: 'monospace' as const,
  },
});
