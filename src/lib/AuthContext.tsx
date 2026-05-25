import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: any | null;
  profile: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  simulateLogin: (username: string, email: string) => Promise<void>;
  isSimulated: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSimulated, setIsSimulated] = useState(false);

  // Check if simulated profile exists in localStorage on startup
  const checkSimulatedProfile = () => {
    const savedUser = localStorage.getItem('simulated_user');
    const savedProfile = localStorage.getItem('simulated_profile');
    if (savedUser && savedProfile) {
      setUser(JSON.parse(savedUser));
      setProfile(JSON.parse(savedProfile));
      setIsSimulated(true);
      setLoading(false);
      return true;
    }
    return false;
  };

  const fetchProfile = async (uid: string) => {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setProfile(docSnap.data() as UserProfile);
      } else {
        // Initialize profile if it doesn't exist
        const newProfile: UserProfile = {
          uid,
          username: auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || 'User',
          displayName: auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || 'User',
          email: auth.currentUser?.email || '',
          photoURL: auth.currentUser?.photoURL || `https://ui-avatars.com/api/?name=${auth.currentUser?.email?.split('@')[0] || 'User'}&background=059669&color=fff`,
          role: 'buyer',
          createdAt: new Date().toISOString(),
        };
        await setDoc(docRef, newProfile);
        setProfile(newProfile);
      }
    } catch (err) {
      console.warn("Could not fetch Firestore profile, keeping current/fallback profile settings:", err);
      // Create local fallback profile if Firestore check fails
      setProfile({
        uid,
        username: auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || 'User',
        displayName: auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || 'User',
        email: auth.currentUser?.email || '',
        photoURL: auth.currentUser?.photoURL || `https://ui-avatars.com/api/?name=${auth.currentUser?.email?.split('@')[0] || 'User'}&background=059669&color=fff`,
        role: 'buyer',
        createdAt: new Date().toISOString(),
      });
    }
  };

  useEffect(() => {
    const isSavedSimulated = checkSimulatedProfile();
    
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        // Clear simulated user when we have a real Firebase user
        localStorage.removeItem('simulated_user');
        localStorage.removeItem('simulated_profile');
        setIsSimulated(false);
        setUser(fbUser);
        await fetchProfile(fbUser.uid);
        setLoading(false);
      } else {
        // If no FB user, only clear state if there is no simulated user
        if (!localStorage.getItem('simulated_user')) {
          setUser(null);
          setProfile(null);
          setIsSimulated(false);
          setLoading(false);
        } else {
          checkSimulatedProfile();
        }
      }
    });

    return unsubscribe;
  }, []);

  const refreshProfile = async () => {
    if (isSimulated && user) {
      const savedProfile = localStorage.getItem('simulated_profile');
      if (savedProfile) {
        setProfile(JSON.parse(savedProfile));
      }
    } else if (user) {
      await fetchProfile(user.uid);
    }
  };

  const simulateLogin = async (username: string, email: string) => {
    const mockUid = 'simulated_' + Math.random().toString(36).substring(2, 9);
    const mockUser = {
      uid: mockUid,
      email: email || `${username.toLowerCase().replace(/\s+/g, '')}@groovestage.com`,
      displayName: username,
      photoURL: `https://ui-avatars.com/api/?name=${username}&background=059669&color=fff`
    };
    
    const mockProfile: UserProfile = {
      uid: mockUid,
      username: username,
      displayName: username,
      email: mockUser.email,
      photoURL: mockUser.photoURL,
      role: 'buyer',
      userRole: 'musician',
      createdAt: new Date().toISOString(),
      location: 'Jakarta, Indonesia',
      bio: 'Professional musician and sound engineer in Jakarta. Passionate about indie rock rhythm sections and vintage pedal combinations.',
      skills: ['Bass', 'Producer', 'Mixing'],
      lookingFor: ['Indie Rock Band', 'Collaboration']
    };

    localStorage.setItem('simulated_user', JSON.stringify(mockUser));
    localStorage.setItem('simulated_profile', JSON.stringify(mockProfile));
    
    setUser(mockUser);
    setProfile(mockProfile);
    setIsSimulated(true);
  };

  const handleLogout = async () => {
    localStorage.removeItem('simulated_user');
    localStorage.removeItem('simulated_profile');
    setIsSimulated(false);
    setUser(null);
    setProfile(null);
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile, simulateLogin, isSimulated, logout: handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
