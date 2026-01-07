import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Calendar, ChevronRight } from 'lucide-react-native';
import { useAppData } from '@/providers/AppDataProvider';
import Colors from '@/constants/colors';

export default function RecapScreen() {
  const insets = useSafeAreaInsets();
  const { allDateKeys, getPhotosForDate, groups, todayDateKey } = useAppData();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const pastDateKeys = useMemo(() => {
    return allDateKeys.filter(key => key !== todayDateKey);
  }, [allDateKeys, todayDateKey]);

  const formatDateDisplay = (dateKey: string): string => {
    const [year, month, day] = dateKey.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const handleSelectDate = useCallback((dateKey: string) => {
    console.log('[Recap] Selected date:', dateKey);
    setSelectedDate(dateKey);
  }, []);

  const handleBack = useCallback(() => {
    setSelectedDate(null);
  }, []);

  const selectedPhotos = selectedDate ? getPhotosForDate(selectedDate) : [];

  const groupedPhotos = useMemo(() => {
    if (!selectedDate) return {};
    const photos = getPhotosForDate(selectedDate);
    const grouped: Record<string, typeof photos> = {};
    photos.forEach(photo => {
      if (!grouped[photo.groupId]) {
        grouped[photo.groupId] = [];
      }
      grouped[photo.groupId].push(photo);
    });
    return grouped;
  }, [selectedDate, getPhotosForDate]);

  const getGroupName = (groupId: string): string => {
    const group = groups.find(g => g.groupId === groupId);
    return group?.groupName ?? 'Unknown Group';
  };

  if (selectedDate) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <Text style={styles.title}>{formatDateDisplay(selectedDate)}</Text>

          {Object.entries(groupedPhotos).map(([groupId, photos]) => (
            <View key={groupId} style={styles.groupSection}>
              <Text style={styles.groupTitle}>{getGroupName(groupId)}</Text>
              <View style={styles.collageContainer}>
                {photos.map((photo, index) => (
                  <View 
                    key={photo.photoId} 
                    style={[
                      styles.collagePhoto,
                      { 
                        left: (index % 3) * 110,
                        top: Math.floor(index / 3) * 110,
                      }
                    ]}
                  >
                    <Image source={{ uri: photo.imageUri }} style={styles.collageImage} />
                    {photo.textOverlay && (
                      <View style={styles.overlayBadge}>
                        <Text style={styles.overlayBadgeText}>{photo.textOverlay.text}</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </View>
          ))}

          {selectedPhotos.length === 0 && (
            <Text style={styles.emptyText}>No photos for this date</Text>
          )}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Recap</Text>
          <Text style={styles.subtitle}>Browse your memories</Text>
        </View>

        {pastDateKeys.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Calendar size={48} color={Colors.dark.textSecondary} />
            <Text style={styles.emptyText}>No past photos yet</Text>
            <Text style={styles.emptySubtext}>Your memories will appear here</Text>
          </View>
        ) : (
          <View style={styles.dateList}>
            {pastDateKeys.map((dateKey) => {
              const photos = getPhotosForDate(dateKey);
              return (
                <TouchableOpacity
                  key={dateKey}
                  style={styles.dateItem}
                  onPress={() => handleSelectDate(dateKey)}
                  activeOpacity={0.7}
                >
                  <View style={styles.dateInfo}>
                    <Text style={styles.dateText}>{formatDateDisplay(dateKey)}</Text>
                    <Text style={styles.photoCount}>{photos.length} photos</Text>
                  </View>
                  <View style={styles.previewRow}>
                    {photos.slice(0, 3).map((photo, index) => (
                      <Image
                        key={photo.photoId}
                        source={{ uri: photo.imageUri }}
                        style={[
                          styles.previewImage,
                          { marginLeft: index > 0 ? -20 : 0, zIndex: 3 - index }
                        ]}
                      />
                    ))}
                  </View>
                  <ChevronRight size={20} color={Colors.dark.textSecondary} />
                </TouchableOpacity>
              );
            })}
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
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
  dateList: {
    gap: 12,
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  dateInfo: {
    flex: 1,
  },
  dateText: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  photoCount: {
    color: Colors.dark.textSecondary,
    fontSize: 14,
    marginTop: 2,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.dark.surface,
  },
  backButton: {
    marginBottom: 16,
  },
  backText: {
    color: Colors.dark.accent,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  groupSection: {
    marginBottom: 32,
  },
  groupTitle: {
    color: Colors.dark.text,
    fontSize: 20,
    fontWeight: '600' as const,
    marginBottom: 16,
  },
  collageContainer: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    minHeight: 300,
    position: 'relative',
    padding: 20,
  },
  collagePhoto: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
  },
  collageImage: {
    width: '100%',
    height: '100%',
  },
  overlayBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  overlayBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '500' as const,
  },
});
