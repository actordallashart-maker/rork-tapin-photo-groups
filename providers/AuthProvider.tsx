import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  User 
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    console.log('[Auth] Setting up auth state listener');
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('[Auth] Auth state changed:', firebaseUser?.uid || 'null');
      setUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          await setDoc(
            doc(db, 'users', firebaseUser.uid), 
            {
              displayName: firebaseUser.displayName || '',
              photoURL: firebaseUser.photoURL || '',
              createdAt: serverTimestamp(),
            },
            { merge: true }
          );
          console.log('[Auth] User doc synced:', firebaseUser.uid);
        } catch (error) {
          console.error('[Auth] Error syncing user doc:', error);
        }
      }
      
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    try {
      setAuthError(null);
      console.log('[Auth] Creating account for:', email);
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      await setDoc(doc(db, 'users', result.user.uid), {
        displayName: result.user.displayName || '',
        photoURL: result.user.photoURL || '',
        createdAt: serverTimestamp(),
      });
      
      console.log('[Auth] Account created:', result.user.uid);
      return { success: true };
    } catch (error: any) {
      console.error('[Auth] Sign up error:', error);
      const message = error.code === 'auth/email-already-in-use' 
        ? 'Email already in use' 
        : error.code === 'auth/weak-password'
        ? 'Password should be at least 6 characters'
        : error.code === 'auth/invalid-email'
        ? 'Invalid email address'
        : 'Failed to create account';
      setAuthError(message);
      return { success: false, error: message };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setAuthError(null);
      console.log('[Auth] Signing in:', email);
      await signInWithEmailAndPassword(auth, email, password);
      console.log('[Auth] Signed in successfully');
      return { success: true };
    } catch (error: any) {
      console.error('[Auth] Sign in error:', error);
      const message = error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password'
        ? 'Invalid email or password'
        : error.code === 'auth/invalid-email'
        ? 'Invalid email address'
        : 'Failed to sign in';
      setAuthError(message);
      return { success: false, error: message };
    }
  };

  const signOut = async () => {
    try {
      console.log('[Auth] Signing out');
      await firebaseSignOut(auth);
      setAuthError(null);
      return { success: true };
    } catch (error) {
      console.error('[Auth] Sign out error:', error);
      return { success: false };
    }
  };

  return {
    user,
    uid: user?.uid || null,
    email: user?.email || null,
    isLoading,
    authError,
    signUp,
    signIn,
    signOut,
  };
});
