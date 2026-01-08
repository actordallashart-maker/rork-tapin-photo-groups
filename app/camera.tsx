import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { X, RotateCcw, Type, Check, AlertCircle } from 'lucide-react-native';
import { useAppData } from '@/providers/AppDataProvider';
import { useAuth } from '@/providers/AuthProvider';
import { TextOverlay } from '@/types';
import Colors from '@/constants/colors';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, db } from '@/lib/firebase';
import { doc, setDoc, Timestamp } from 'firebase/firestore';

const TEXT_SIZES: ('S' | 'M' | 'L')[] = ['S', 'M', 'L'];
const TEXT_COLORS = ['#FFFFFF', '#000000', '#FF6B6B', '#4ECDC4', '#FFD93D', '#A78BFA'];

type PostState = 'idle' | 'posting' | 'success' | 'error';

export default function CameraScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { mode } = useLocalSearchParams<{ mode: 'today' | 'blitz' }>();
  const { 
    addTodayPhoto, 
    addBlitzPhoto, 
    activeGroupIdToday, 
    activeGroupIdBlitz,
    activeUserId,
    hasPostedToday,
    hasPostedBlitz,
    currentBlitzRound,
  } = useAppData();
  const { uid } = useAuth();
  const cameraRef = useRef<CameraView>(null);

  const [permission, requestPermission] = useCameraPermissions();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facing, setFacing] = useState<'front' | 'back'>('back');
  const [showTextEditor, setShowTextEditor] = useState(false);
  const [overlayText, setOverlayText] = useState('');
  const [textSize, setTextSize] = useState<'S' | 'M' | 'L'>('M');
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [postState, setPostState] = useState<PostState>('idle');
  const [postError, setPostError] = useState<string>('');

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current) return;
    
    console.log('[Camera] Taking photo...');
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 1.0,
      });
      
      if (photo?.uri) {
        console.log('[Camera] Photo captured:', photo.uri);
        setCapturedImage(photo.uri);
      }
    } catch (error) {
      console.error('[Camera] Error taking photo:', error);
    }
  }, []);

  const toggleFacing = useCallback(() => {
    setFacing((prev) => (prev === 'back' ? 'front' : 'back'));
  }, []);

  const handleRetake = useCallback(() => {
    console.log('[Camera] Retaking photo...');
    setCapturedImage(null);
    setShowTextEditor(false);
    setOverlayText('');
  }, []);

  const handlePost = useCallback(async () => {
    setPostState('posting');
    setPostError('');

    if (!capturedImage) {
      console.error('[Camera] Missing image URI');
      setPostState('error');
      setPostError('Missing image URI');
      return;
    }

    const activeGroupId = mode === 'blitz' ? activeGroupIdBlitz : activeGroupIdToday;
    if (!activeGroupId) {
      console.error('[Camera] Missing activeGroupId');
      setPostState('error');
      setPostError('Missing activeGroupId');
      return;
    }

    if (!uid) {
      console.error('[Camera] User not logged in');
      setPostState('error');
      setPostError('Log in to post');
      return;
    }

    if (!activeUserId) {
      console.error('[Camera] Missing activeUserId');
      setPostState('error');
      setPostError('Missing activeUserId');
      return;
    }

    const hasAlreadyPosted = mode === 'blitz' ? hasPostedBlitz : hasPostedToday;
    if (hasAlreadyPosted) {
      console.error('[Camera] User has already posted');
      setPostState('error');
      setPostError("You've already posted this round");
      return;
    }

    let textOverlay: TextOverlay | undefined;
    if (overlayText.trim()) {
      textOverlay = {
        text: overlayText.trim(),
        x: 20,
        y: 100,
        size: textSize,
        color: textColor,
      };
    }

    console.log('[Camera] Posting photo, mode:', mode, 'groupId:', activeGroupId);
    
    try {
      if (mode === 'blitz') {
        const roundId = currentBlitzRound?.roundId;
        if (!roundId) {
          setPostState('error');
          setPostError('No active Blitz round');
          return;
        }

        console.log('[Camera] Uploading to Firebase Storage...');
        const filename = `${uid}_${Date.now()}.jpg`;
        const storagePath = `groups/${activeGroupId}/blitz/${roundId}/${filename}`;
        const storageRef = ref(storage, storagePath);

        const response = await fetch(capturedImage);
        const blob = await response.blob();
        
        console.log('[Camera] Uploading blob to:', storagePath);
        await uploadBytes(storageRef, blob);
        
        console.log('[Camera] Upload complete, getting download URL...');
        const downloadURL = await getDownloadURL(storageRef);
        
        console.log('[Camera] Writing to Firestore posts collection...');
        const postId = `${uid}_${Date.now()}`;
        await setDoc(doc(db, 'groups', activeGroupId, 'posts', postId), {
          createdBy: uid,
          createdAt: Timestamp.now(),
          photoPath: storagePath,
          roundId: roundId,
        });

        console.log('[Camera] Blitz post created:', postId);
        addBlitzPhoto(downloadURL, textOverlay);
      } else {
        addTodayPhoto(capturedImage, textOverlay);
      }

      await new Promise(resolve => setTimeout(resolve, 300));
      
      console.log('[Camera] Post successful');
      setPostState('success');
      
      setTimeout(() => {
        router.back();
      }, 100);
    } catch (error: any) {
      console.error('[Camera] Post failed:', error);
      setPostState('error');
      setPostError(`Post failed: ${error.message || error}`);
    }
  }, [capturedImage, overlayText, textSize, textColor, mode, addTodayPhoto, addBlitzPhoto, activeGroupIdToday, activeGroupIdBlitz, activeUserId, hasPostedToday, hasPostedBlitz, router, uid, currentBlitzRound]);

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  const toggleTextSize = useCallback(() => {
    const currentIndex = TEXT_SIZES.indexOf(textSize);
    const nextIndex = (currentIndex + 1) % TEXT_SIZES.length;
    setTextSize(TEXT_SIZES[nextIndex]);
  }, [textSize]);

  if (!permission) {
    return null;
  }

  if (!permission.granted) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <View style={styles.permissionContainer}>
            <Text style={styles.permissionText}>Camera access required</Text>
            <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
              <Text style={styles.permissionButtonText}>Grant Permission</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        {capturedImage ? (
          <>
            <Image source={{ uri: capturedImage }} style={styles.previewImage} resizeMode="cover" />
            {overlayText.trim() && (
              <View style={styles.textOverlayPreview}>
                <Text
                  style={[
                    styles.overlayText,
                    {
                      fontSize: textSize === 'S' ? 14 : textSize === 'M' ? 20 : 28,
                      color: textColor,
                    },
                  ]}
                >
                  {overlayText}
                </Text>
              </View>
            )}
            
            <View style={[styles.debugLabel, { top: insets.top + 10 }]}>
              <Text style={styles.debugText}>PREVIEW FULLSCREEN OK</Text>
            </View>

            <View style={[styles.headerOverlay, { paddingTop: insets.top }]}>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <X size={28} color="white" />
              </TouchableOpacity>
              <Text style={styles.title}>
                {mode === 'blitz' ? 'Blitz Photo' : 'Today Photo'}
              </Text>
              <View style={{ width: 40 }} />
            </View>

            {showTextEditor ? (
              <View style={[styles.textEditorOverlay, { paddingBottom: insets.bottom }]}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Add text..."
                  placeholderTextColor={Colors.dark.textSecondary}
                  value={overlayText}
                  onChangeText={setOverlayText}
                  autoFocus
                  maxLength={50}
                />
                <View style={styles.textOptions}>
                  <TouchableOpacity style={styles.sizeButton} onPress={toggleTextSize}>
                    <Text style={styles.sizeButtonText}>{textSize}</Text>
                  </TouchableOpacity>
                  <View style={styles.colorOptions}>
                    {TEXT_COLORS.map((color) => (
                      <TouchableOpacity
                        key={color}
                        style={[
                          styles.colorOption,
                          { backgroundColor: color },
                          textColor === color && styles.colorOptionSelected,
                        ]}
                        onPress={() => setTextColor(color)}
                      />
                    ))}
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.doneButton}
                  onPress={() => setShowTextEditor(false)}
                >
                  <Check size={20} color="white" />
                  <Text style={styles.doneButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {(postState !== 'idle' || postError) && (
                  <View style={[styles.postBanner, { bottom: insets.bottom + 150 }]}>
                    <View style={styles.postBannerContent}>
                      {postState === 'posting' && (
                        <>
                          <ActivityIndicator size="small" color="#FFD93D" />
                          <Text style={styles.postBannerText}>Posting...</Text>
                        </>
                      )}
                      {postState === 'success' && (
                        <>
                          <Check size={16} color="#00FF00" />
                          <Text style={[styles.postBannerText, { color: '#00FF00' }]}>Success!</Text>
                        </>
                      )}
                      {postState === 'error' && (
                        <>
                          <AlertCircle size={16} color="#FF6B6B" />
                          <Text style={[styles.postBannerText, { color: '#FF6B6B' }]}>{postError}</Text>
                        </>
                      )}
                    </View>
                    <View style={styles.postBannerInfo}>
                      <Text style={styles.postBannerSmall}>Target: {mode === 'blitz' ? 'Blitz (Firebase)' : 'Today'}</Text>
                      <Text style={styles.postBannerSmall}>Group: {mode === 'blitz' ? activeGroupIdBlitz : activeGroupIdToday}</Text>
                      {mode === 'blitz' && (
                        <Text style={styles.postBannerSmall}>Round: {currentBlitzRound?.roundId?.slice(0, 8) || 'none'}</Text>
                      )}
                    </View>
                  </View>
                )}
                <View style={[styles.actionButtonsOverlay, { paddingBottom: insets.bottom }]}>
                  <TouchableOpacity 
                    style={styles.actionButton} 
                    onPress={handleRetake}
                    disabled={postState === 'posting'}
                  >
                    <RotateCcw size={24} color="white" />
                    <Text style={styles.actionButtonText}>Retake</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => setShowTextEditor(true)}
                    disabled={postState === 'posting'}
                  >
                    <Type size={24} color="white" />
                    <Text style={styles.actionButtonText}>Add Text</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[
                      styles.postButton, 
                      (postState === 'posting' || (mode === 'blitz' ? hasPostedBlitz : hasPostedToday)) && styles.postButtonDisabled
                    ]} 
                    onPress={handlePost}
                    disabled={postState === 'posting' || (mode === 'blitz' ? hasPostedBlitz : hasPostedToday)}
                  >
                    {postState === 'posting' ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text style={styles.postButtonText}>
                        {(mode === 'blitz' ? hasPostedBlitz : hasPostedToday) ? 'Posted this round' : 'Ready to post'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </>
        ) : (
          <>
            <CameraView
              ref={cameraRef}
              style={StyleSheet.absoluteFillObject}
              facing={facing}
            />
            
            <View style={[styles.debugLabel, { top: insets.top + 10 }]}>
              <Text style={styles.debugText}>CAMERA FULLSCREEN OK</Text>
            </View>

            <View style={[styles.headerOverlay, { paddingTop: insets.top }]}>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <X size={28} color="white" />
              </TouchableOpacity>
              <Text style={styles.title}>
                {mode === 'blitz' ? 'Blitz Photo' : 'Today Photo'}
              </Text>
              <View style={{ width: 40 }} />
            </View>

            <View style={[styles.cameraControls, { bottom: insets.bottom + 40 }]}>
              <TouchableOpacity style={styles.flipButton} onPress={toggleFacing}>
                <RotateCcw size={28} color="white" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.captureButton} onPress={handleCapture}>
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>
              <View style={{ width: 60 }} />
            </View>
          </>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  debugLabel: {
    position: 'absolute',
    left: 10,
    backgroundColor: 'rgba(0, 255, 0, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 1000,
  },
  debugText: {
    color: '#000000',
    fontSize: 10,
    fontWeight: '700' as const,
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
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
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 20,
  },
  permissionText: {
    color: Colors.dark.text,
    fontSize: 18,
    textAlign: 'center',
  },
  permissionButton: {
    backgroundColor: Colors.dark.accent,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  cancelButton: {
    paddingVertical: 12,
  },
  cancelButtonText: {
    color: Colors.dark.textSecondary,
    fontSize: 16,
  },
  cameraControls: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
  },
  flipButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 6,
    borderColor: Colors.dark.blitzYellow,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.dark.blitzYellow,
  },
  previewImage: {
    ...StyleSheet.absoluteFillObject,
  },
  textOverlayPreview: {
    position: 'absolute',
    left: 20,
    top: 100,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  overlayText: {
    fontWeight: '600' as const,
  },
  actionButtonsOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.dark.surface,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    color: Colors.dark.text,
    fontSize: 14,
    fontWeight: '500' as const,
  },
  postButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.dark.accent,
    paddingVertical: 14,
    borderRadius: 12,
  },
  postButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  postButtonDisabled: {
    opacity: 0.6,
  },
  postBanner: {
    position: 'absolute',
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: '#FFD93D',
  },
  postBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  postBannerText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  postBannerInfo: {
    gap: 2,
  },
  postBannerSmall: {
    color: '#888',
    fontSize: 11,
    fontFamily: 'monospace' as const,
  },
  textEditorOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    gap: 16,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  textInput: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: Colors.dark.text,
    fontSize: 16,
  },
  textOptions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  sizeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.dark.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizeButtonText: {
    color: Colors.dark.text,
    fontSize: 14,
    fontWeight: '700' as const,
  },
  colorOptions: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  colorOption: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: Colors.dark.text,
  },
  doneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.dark.accent,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  doneButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600' as const,
  },
});
