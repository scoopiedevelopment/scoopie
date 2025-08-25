import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TAB_ICONS = [
  { name: 'home', lib: Ionicons },
  { name: 'message-circle', lib: Feather },
  { name: 'camera', lib: Feather, isCenter: true },
  { name: 'film', lib: Feather },
  { name: 'bell', lib: Feather },
];

const CustomTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  const insets = useSafeAreaInsets();
  const currentRoute = state.routes[state.index].name;
  if (currentRoute === "tab3") {
    return null;
  }

  return (
    <View style={[styles.tabBar, { paddingBottom: insets.bottom + 10 || 10 }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const Icon = TAB_ICONS[index].lib;
        const isCenter = TAB_ICONS[index].isCenter;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        if (isCenter) {
          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={styles.centerButton}
            >
              <View style={styles.centerCircle}>
                <Feather name="camera" size={24} color="#fff" />
              </View>
            </TouchableOpacity>
          );
        }

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            style={styles.tabButton}
          >
            <Icon
              name={TAB_ICONS[index].name as any}
              size={24}
              color={isFocused ? '#9f5ef2' : '#000'}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const { width } = Dimensions.get('window');
const tabWidth = width / 5;

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 10,
    justifyContent: 'space-around',
  },
  tabButton: {
    width: tabWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerButton: {
    position: 'absolute',
    alignSelf: 'center',
    top: -30,
    zIndex: 10,
  },
  centerCircle: {
    width: 60,
    height: 60,
    backgroundColor: '#9f5ef2',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
});

export default CustomTabBar;