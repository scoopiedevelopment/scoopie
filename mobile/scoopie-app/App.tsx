import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthNavigator } from './screens/AuthScreens'; // <-- adjust path if needed
import HomeScreen from './screens/HomeScreen'; // <-- create a simple placeholder for now

// Keep splash screen visible while we load
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const prepare = async () => {
      try {
        // Check if user is already logged in
        const token = await AsyncStorage.getItem('accessToken');
        if (token) {
          setIsLoggedIn(true);
        }
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
        await SplashScreen.hideAsync(); // Hide splash when ready
      }
    };
    prepare();
  }, []);

  if (!appIsReady) {
    return <View />; // Keeps splash visible
  }

  return isLoggedIn ? (
    <HomeScreen />
  ) : (
    <AuthNavigator onAuthSuccess={() => setIsLoggedIn(true)} />
  );
}
