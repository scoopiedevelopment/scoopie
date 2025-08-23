import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthNavigator } from './auth';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
    
    // Check auth status periodically to handle logout from other screens
    const interval = setInterval(checkAuthStatus, 1000);
    return () => clearInterval(interval);
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const newAuthState = !!token;
      if (newAuthState !== isAuthenticated) {
        setIsAuthenticated(newAuthState);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
    } finally {
      if (isLoading) {
        setIsLoading(false);
      }
    }
  };

  const handleAuthSuccess = async () => {
    setIsAuthenticated(true);
  };

  // Splash Screen
  if (isLoading) {
    return (
      <View style={styles.splashContainer}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  // Auth Flow
  if (!isAuthenticated) {
    return <AuthNavigator onAuthSuccess={handleAuthSuccess} />;
  }

  // Main App
  return <>{children}</>;
};

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});