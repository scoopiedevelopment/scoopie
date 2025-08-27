import { Tabs } from 'expo-router';
import CustomTabBar from '../../components/common/CustomTabBar';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen name="tab1" options={{ title: 'Home' }} />
      <Tabs.Screen name="tab2" options={{ title: 'Messages' }} />
      <Tabs.Screen name="tab3" options={{ title: 'Camera' }} />
      <Tabs.Screen name="tab4" options={{ title: 'Reels' }} />
      <Tabs.Screen name="tab5" options={{ title: 'Notifications' }} />
    </Tabs>
  );
}
