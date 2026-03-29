import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { PrivacySettings, DEFAULT_PRIVACY_SETTINGS } from '@/types/privacy';

interface User {
  id: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
  privacy_settings: PrivacySettings;
}

interface SimpleAuthContextType {
  user: User | null;
  isLoading: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => void;
  updatePrivacySettings: (settings: Partial<PrivacySettings>) => Promise<{ error: Error | null }>;
}

const SimpleAuthContext = createContext<SimpleAuthContextType | undefined>(undefined);

const PRIVACY_STORAGE_KEY = 'animelist_privacy';

function mapFirebaseUser(fbUser: FirebaseUser): User {
  // Load privacy settings from localStorage
  let privacySettings = DEFAULT_PRIVACY_SETTINGS;
  try {
    const stored = localStorage.getItem(`${PRIVACY_STORAGE_KEY}_${fbUser.uid}`);
    if (stored) privacySettings = { ...DEFAULT_PRIVACY_SETTINGS, ...JSON.parse(stored) };
  } catch { /* use defaults */ }

  return {
    id: fbUser.uid,
    email: fbUser.email || '',
    display_name: fbUser.displayName || undefined,
    avatar_url: fbUser.photoURL || undefined,
    privacy_settings: privacySettings,
  };
}

export function SimpleAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        setUser(mapFirebaseUser(fbUser));
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });
    return unsubscribe;
  }, []);

  const signUp = async (email: string, password: string, displayName?: string) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName && cred.user) {
        await updateProfile(cred.user, { displayName });
      }
      setUser(mapFirebaseUser(cred.user));
      return { error: null };
    } catch (err: any) {
      const msg =
        err.code === 'auth/email-already-in-use' ? 'Email already registered. Please sign in.' :
        err.code === 'auth/weak-password' ? 'Password must be at least 6 characters.' :
        err.code === 'auth/invalid-email' ? 'Invalid email address.' :
        err.message || 'Sign up failed';
      return { error: new Error(msg) };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      setUser(mapFirebaseUser(cred.user));
      return { error: null };
    } catch (err: any) {
      const msg =
        err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential'
          ? 'Invalid email or password'
          : err.message || 'Sign in failed';
      return { error: new Error(msg) };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      setUser(mapFirebaseUser(cred.user));
      return { error: null };
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        return { error: new Error('Sign in cancelled') };
      }
      return { error: new Error(err.message || 'Google sign in failed') };
    }
  };

  const handleSignOut = () => {
    firebaseSignOut(auth);
    setUser(null);
  };

  const updatePrivacySettings = async (settings: Partial<PrivacySettings>) => {
    if (!user) return { error: new Error('Not authenticated') };

    const updated = { ...user.privacy_settings, ...settings };
    const updatedUser = { ...user, privacy_settings: updated };
    setUser(updatedUser);

    // Persist to localStorage (per user)
    localStorage.setItem(`${PRIVACY_STORAGE_KEY}_${user.id}`, JSON.stringify(updated));

    return { error: null };
  };

  return (
    <SimpleAuthContext.Provider value={{
      user, isLoading, signUp, signIn, signInWithGoogle, signOut: handleSignOut, updatePrivacySettings
    }}>
      {children}
    </SimpleAuthContext.Provider>
  );
}

export function useSimpleAuth() {
  const context = useContext(SimpleAuthContext);
  if (context === undefined) {
    throw new Error('useSimpleAuth must be used within a SimpleAuthProvider');
  }
  return context;
}
