import React, { useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TodayPhoto, BlitzPhoto } from '@/types';
import DraggablePhoto from './DraggablePhoto';
import Colors from '@/constants/colors';

interface PhotoContainerProps {
  photos: (TodayPhoto | BlitzPhoto)[];
  onPositionChange: (photoId: string, x: number, y: number, zIndex: number) => void;
  emptyText?: string;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

export default function PhotoContainer({
  photos,
  onPositionChange,
  emptyText = 'No photos yet',
  onDragStart,
  onDragEnd,
}: PhotoContainerProps) {
  const maxZIndex = Math.max(...photos.map((p) => p.zIndex), 0);

  const handleDragStart = useCallback(() => {
    console.log('[PhotoContainer] Drag started, disabling scroll');
    onDragStart?.();
  }, [onDragStart]);

  const handleDragEnd = useCallback(() => {
    console.log('[PhotoContainer] Drag ended, enabling scroll');
    onDragEnd?.();
  }, [onDragEnd]);

  const isEmpty = photos.length === 0;

  return (
    <View style={styles.container}>
      <View style={styles.photoArea}>
        {isEmpty ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{emptyText}</Text>
          </View>
        ) : (
          photos.map((photo) => (
            <DraggablePhoto
              key={photo.photoId}
              photo={photo}
              onPositionChange={onPositionChange}
              maxZIndex={maxZIndex}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            />
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.surface,
    borderRadius: 24,
    overflow: 'hidden',
    minHeight: 400,
  },
  photoArea: {
    flex: 1,
    position: 'relative',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: Colors.dark.textSecondary,
    fontSize: 18,
    fontWeight: '500' as const,
  },
});
