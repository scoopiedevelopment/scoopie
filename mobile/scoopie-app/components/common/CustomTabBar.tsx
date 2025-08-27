import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';

const TAB_ICONS = [
  { name: 'home', lib: Ionicons },
  { name: 'message-circle', lib: Feather },
  { name: 'camera', lib: Feather, isCenter: true },
  { name: 'film', lib: Feather },
  { name: 'bell', lib: Feather },
];

const CustomTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  console.log('CustomTabBar rendered, routes:', state.routes.length);

  const handleCameraPress = async () => {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'We need camera permissions to take photos.');
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled && result.assets?.length > 0) {
        const imageUri = result.assets[0].uri;
        
        // Navigate to text post screen with the captured image
        router.push({
          pathname: '/textPostScreen',
          params: {
            capturedImageUri: encodeURIComponent(imageUri),
          },
        });
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 10 || 10 }]}>
      <View style={styles.tabBar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const Icon = TAB_ICONS[index].lib;
          const isCenter = TAB_ICONS[index].isCenter;

          const onPress = () => {
            console.log(`Tab pressed: ${route.name}, index: ${index}, isFocused: ${isFocused}`);
            
            // Handle camera tab specially
            if (isCenter) {
              handleCameraPress();
              return;
            }
            
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              console.log(`Navigating to: ${route.name}`);
              navigation.navigate(route.name);
            }
          };

          if (isCenter) {
            return (
              <View key={route.key} style={styles.centerButtonContainer}>
                <TouchableOpacity
                  onPress={onPress}
                  style={styles.centerButton}
                  activeOpacity={0.8}
                  hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                >
                  <View style={styles.centerCircle}>
                    <Feather name="camera" size={24} color="#fff" />
                  </View>
                </TouchableOpacity>
              </View>
            );
          }

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={styles.tabButton}
              activeOpacity={0.6}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon
                name={TAB_ICONS[index].name as any}
                size={24}
                color={isFocused ? '#9f5ef2' : '#666'}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const { width } = Dimensions.get('window');
const tabWidth = width / 5;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingTop: 20,
    justifyContent: 'space-around',
    alignItems: 'flex-end',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  centerButtonContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  centerButton: {
    position: 'absolute',
    top:-60,
    zIndex: 10,
    elevation: 10,
  },
  centerCircle: {
    width: 56,
    height: 56,
    backgroundColor: '#9f5ef2',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 3,
    borderColor: '#fff',
  },
});

export default CustomTabBar;