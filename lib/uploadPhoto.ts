import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';

export interface PhotoUploadParams {
  groupId: string;
  uid: string;
  mode: 'today' | 'blitz';
  cycleId?: string;
  roundId?: string;
}

export function buildPhotoStoragePath(params: PhotoUploadParams): string {
  const { groupId, uid, mode, cycleId, roundId } = params;
  const timestamp = Date.now();
  
  if (mode === 'today') {
    if (!cycleId) {
      throw new Error('cycleId is required for today mode');
    }
    return `groups/${groupId}/today/${cycleId}/${uid}/today_${timestamp}.jpg`;
  }
  
  if (mode === 'blitz') {
    if (!roundId) {
      throw new Error('roundId is required for blitz mode');
    }
    return `groups/${groupId}/blitz/${roundId}/${uid}/blitz_${timestamp}.jpg`;
  }
  
  throw new Error(`Invalid mode: ${mode}`);
}

export async function uploadPhotoToStorage(
  imageUri: string,
  storagePath: string
): Promise<string> {
  console.log('[uploadPhoto] Uploading to:', storagePath);
  
  const storageRef = ref(storage, storagePath);
  const response = await fetch(imageUri);
  const blob = await response.blob();
  
  await uploadBytes(storageRef, blob);
  
  const downloadURL = await getDownloadURL(storageRef);
  console.log('[uploadPhoto] Upload complete, URL:', downloadURL);
  
  return downloadURL;
}

export function getTodayCycleId(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
