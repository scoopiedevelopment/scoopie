import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  email: string;
  username?: string;
  name?: string;
  profilePic?: string;
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string, userData?: User) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  checkAuthStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('accessToken');
      const storedUser = await AsyncStorage.getItem('userData');
      
      console.log('=== Auth Persistence Check ===');
      console.log('Stored token exists:', !!storedToken);
      console.log('Token length:', storedToken?.length || 0);
      console.log('Stored user exists:', !!storedUser);
      
      if (storedToken) {
        setToken(storedToken);
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            setUser(userData);
            console.log('✓ Successfully restored user:', userData.email || userData.username);
          } catch (parseError) {
            console.error('Error parsing stored user data:', parseError);
          }
        } else {
          console.log('⚠ No user data found, but token exists');
        }
      } else {
        console.log('✗ No stored token found - user needs to login');
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (newToken: string, userData?: User) => {
    try {
      console.log('Logging in with token and storing...');
      await AsyncStorage.setItem('accessToken', newToken);
      setToken(newToken);
      
      if (userData) {
        await AsyncStorage.setItem('userData', JSON.stringify(userData));
        setUser(userData);
        console.log('Stored user data:', userData.email);
      }
    } catch (error) {
      console.error('Error storing auth data:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log('Logging out and clearing storage...');
      await AsyncStorage.multiRemove(['accessToken', 'userData']);
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Error removing auth data:', error);
    }
  };

  const checkAuthStatus = async () => {
    const storedToken = await AsyncStorage.getItem('accessToken');
    if (!storedToken && token) {
      // Token was removed (probably by 401 interceptor), update context
      console.log('Token was removed externally, updating context...');
      setToken(null);
      setUser(null);
    }
  };

  const value: AuthContextType = {
    token,
    user,
    isAuthenticated: !!token,
    login,
    logout,
    loading,
    checkAuthStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};