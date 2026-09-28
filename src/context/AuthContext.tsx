import React, { createContext, useContext, useState, type ReactNode } from 'react';
import { 
  getUserProfile, 
  saveUserProfile, 
  type UserProfileData 
} from '../services/localStorageService';

export interface UserProfile {
  id: string;
  email?: string;
  fullName: string;
  phone?: string;
  language: 'hi' | 'en';
  role: 'farmer' | 'officer';
  isDemo: boolean;
}

interface AuthContextType {
  user: UserProfile;
  loading: boolean;
  isDemoMode: boolean;
  continueAsDemo: (role?: 'farmer' | 'officer') => void;
  updateProfile: (profile: Partial<UserProfileData>) => void;
  switchRole: (role: 'farmer' | 'officer') => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [profileData, setProfileData] = useState<UserProfileData>(() => getUserProfile());

  const user: UserProfile = {
    id: profileData.id,
    email: profileData.role === 'officer' ? 'officer.jaipur@monsoon-x.gov.in' : 'farmer.sanganer@monsoon-x.gov.in',
    fullName: profileData.fullName,
    phone: profileData.phone,
    language: profileData.language,
    role: profileData.role,
    isDemo: true, // Always clean demo mode with local storage persistence
  };

  const updateProfile = (updates: Partial<UserProfileData>) => {
    const updated = saveUserProfile(updates);
    setProfileData(updated);
  };

  const continueAsDemo = (role: 'farmer' | 'officer' = 'farmer') => {
    const updated = saveUserProfile({
      role,
      fullName: role === 'officer' ? 'Dr. R. Sharma (कृषि अधिकारी)' : 'Kailash Choudhary (कैलाश चौधरी)',
    });
    setProfileData(updated);
  };

  const switchRole = (role: 'farmer' | 'officer') => {
    continueAsDemo(role);
  };

  const signOut = async () => {
    // Reset to default farmer profile
    const updated = saveUserProfile({
      role: 'farmer',
      fullName: 'Kailash Choudhary (कैलाश चौधरी)',
    });
    setProfileData(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading: false,
        isDemoMode: true,
        continueAsDemo,
        updateProfile,
        switchRole,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
