import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface UserProfile {
  email: string;
  id: string;
}

interface AuthContextValue {
  isAuthenticated: boolean;
  status: AuthStatus;
  user: UserProfile | null;
  login: (email?: string) => void;
  logout: () => void;
}

const LOCAL_STORAGE_KEY = 'cvision_demo_user';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  useEffect(() => {
    const cachedUser = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (cachedUser) {
      try {
        const parsed = JSON.parse(cachedUser) as UserProfile;
        setUser(parsed);
        setStatus('authenticated');
        return;
      } catch (error) {
        console.warn('Impossible de parser le profil utilisateur local.', error);
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
    }
    setStatus('unauthenticated');
  }, []);

  const login = (email = 'demo.user@cvision.ai') => {
    const profile: UserProfile = { email, id: crypto.randomUUID() };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(profile));
    setUser(profile);
    setStatus('authenticated');
  };

  const logout = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setUser(null);
    setStatus('unauthenticated');
  };

  const value = useMemo(
    () => ({
      isAuthenticated: !!user,
      status,
      user,
      login,
      logout,
    }),
    [status, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé à l’intérieur de AuthProvider');
  }
  return context;
};
