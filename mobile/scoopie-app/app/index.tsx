import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { ActivityIndicator, View, Text } from 'react-native';

export default function Index() {
  const router = useRouter();
  const { isAuthenticated, loading, checkAuthStatus } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (isAuthenticated) {
        console.log('User is authenticated, navigating to tabs');
        // User is logged in, go to tab1
        router.replace('/(tabs)/tab1');
      } else {
        console.log('User is not authenticated, navigating to auth');
        // User is not logged in, go to auth
        router.replace('/auth');
      }
    }
  }, [isAuthenticated, loading]);

  // Periodically check if token was removed by 401 interceptor
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) {
        checkAuthStatus();
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [loading, checkAuthStatus]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#9f5ef2" />
        <Text style={{ marginTop: 16, fontSize: 16, color: '#666', fontWeight: '500' }}>
          Loading...
        </Text>
      </View>
    );
  }

  return null;
}