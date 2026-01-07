import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  Animated,
  Image,
  Modal,
  Dimensions,
} from 'react-native';
import { TodayPhoto, BlitzPhoto } from '@/types';

interface DraggablePhotoProps {
  photo: TodayPhoto | BlitzPhoto;
  onPositionChange: (photoId: string, x: number, y: number, zIndex: number) => void;
  maxZIndex: number;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const TEXT_SIZES = {
  S: 14,
  M: 20,
  L: 28,
};

export default function DraggablePhoto({
  photo,
  onPositionChange,
  maxZIndex,
  onDragStart,
  onDragEnd,
}: DraggablePhotoProps) {
  const pan = useRef(new Animated.ValueXY({ x: photo.x, y: photo.y })).current;
  const currentZIndex = useRef(photo.zIndex);
  const currentPosition = useRef({ x: photo.x, y: photo.y });
  const [fullScreenVisible, setFullScreenVisible] = useState(false);
  const lastTap = useRef<number | null>(null);
  const modalPan = useRef(new Animated.ValueXY()).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 8 || Math.abs(gestureState.dy) > 8;
      },
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
      onPanResponderGrant: (_, gestureState) => {
        const now = Date.now();
        if (lastTap.current && now - lastTap.current < 300) {
          console.log('[DraggablePhoto] Double tap detected');
          setFullScreenVisible(true);
          lastTap.current = null;
          return;
        }
        lastTap.current = now;
        
        console.log('[DraggablePhoto] Drag started:', photo.photoId);
        onDragStart?.();
        currentZIndex.current = maxZIndex + 1;
        pan.setOffset({
          x: currentPosition.current.x,
          y: currentPosition.current.y,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, gestureState) => {
        if (Math.abs(gestureState.dx) < 8 && Math.abs(gestureState.dy) < 8) {
          pan.flattenOffset();
          Animated.spring(pan, {
            toValue: { x: currentPosition.current.x, y: currentPosition.current.y },
            useNativeDriver: false,
          }).start();
          onDragEnd?.();
          return;
        }
        console.log('[DraggablePhoto] Drag ended:', photo.photoId);
        pan.flattenOffset();
        const newX = (pan.x as any)._value;
        const newY = (pan.y as any)._value;
        currentPosition.current = { x: newX, y: newY };
        onPositionChange(photo.photoId, newX, newY, currentZIndex.current);
        onDragEnd?.();
      },
    })
  ).current;

  const modalPanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 10;
      },
      onPanResponderMove: Animated.event([null, { dy: modalPan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) {
          Animated.timing(modalPan, {
            toValue: { x: 0, y: SCREEN_HEIGHT },
            duration: 200,
            useNativeDriver: false,
          }).start(() => {
            setFullScreenVisible(false);
            modalPan.setValue({ x: 0, y: 0 });
          });
        } else {
          Animated.spring(modalPan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  return (
    <>
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.container,
          {
            transform: pan.getTranslateTransform(),
            zIndex: currentZIndex.current,
          },
        ]}
      >
        <Image source={{ uri: photo.imageUri }} style={styles.image} />
        {photo.textOverlay && (
          <View
            style={[
              styles.textOverlayContainer,
              {
                left: photo.textOverlay.x,
                top: photo.textOverlay.y,
              },
            ]}
          >
            <Text
              style={[
                styles.textOverlay,
                {
                  fontSize: TEXT_SIZES[photo.textOverlay.size],
                  color: photo.textOverlay.color,
                },
              ]}
            >
              {photo.textOverlay.text}
            </Text>
          </View>
        )}
      </Animated.View>

      <Modal
        visible={fullScreenVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFullScreenVisible(false)}
      >
        <Animated.View
          {...modalPanResponder.panHandlers}
          style={[
            styles.modalContainer,
            {
              transform: modalPan.getTranslateTransform(),
            },
          ]}
        >
          <View style={styles.modalHeader}>
            <View style={styles.swipeIndicator} />
          </View>
          <View style={styles.fullScreenImageContainer}>
            <Image source={{ uri: photo.imageUri }} style={styles.fullScreenImage} resizeMode="contain" />
            {photo.textOverlay && (
              <View style={styles.fullScreenTextOverlay}>
                <Text
                  style={[
                    styles.textOverlay,
                    {
                      fontSize: TEXT_SIZES[photo.textOverlay.size] * 2,
                      color: photo.textOverlay.color,
                    },
                  ]}
                >
                  {photo.textOverlay.text}
                </Text>
              </View>
            )}
          </View>
        </Animated.View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },
  textOverlayContainer: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  textOverlay: {
    fontWeight: '600' as const,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  modalHeader: {
    paddingTop: 20,
    paddingBottom: 10,
    alignItems: 'center',
  },
  swipeIndicator: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
  },
  fullScreenImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.8,
  },
  fullScreenTextOverlay: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
});
