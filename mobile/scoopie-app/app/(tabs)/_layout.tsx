import { Tabs } from 'expo-router';
import CustomTabBar from '../../components/common/CustomTabBar';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="message" options={{ title: 'Message' }} />
      <Tabs.Screen name="camera" options={{ title: 'Camera' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      <Tabs.Screen name="notifications" options={{ title: 'Notifications' }} />
    </Tabs>
  );
}
