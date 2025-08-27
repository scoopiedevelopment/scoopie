import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter, useNavigation } from 'expo-router';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';

interface SettingItem {
  icon: string;
  title: string;
  subtitle?: string;
  route?: string;
  action?: () => void;
  destructive?: boolean;
}

export default function SettingsScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              router.replace('/auth');
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: () => {
            // Navigate to delete account confirmation screen
            router.push('/(settings)/delete-account');
          },
        },
      ]
    );
  };

  const accountSettings: SettingItem[] = [
    {
      icon: 'user',
      title: 'Account Management',
      subtitle: 'Edit profile, privacy, password',
      route: '/(settings)/manage-account',
    },
    {
      icon: 'bookmark',
      title: 'Saved',
      subtitle: 'Your saved posts and clips',
      route: '/(settings)/saved',
    },
    {
      icon: 'shield',
      title: 'Privacy & Security',
      subtitle: 'Blocking, data usage',
      route: '/(settings)/privacy',
    },
    {
      icon: 'lock',
      title: 'Security',
      subtitle: 'Password, two-factor authentication',
      route: '/(settings)/security',
    },
  ];

  const appSettings: SettingItem[] = [
    {
      icon: 'globe',
      title: 'Language',
      subtitle: 'App language and region',
      route: '/(settings)/language',
    },
    {
      icon: 'help-circle',
      title: 'Help & Support',
      subtitle: 'Contact us, report issues',
      route: '/(settings)/help',
    },
  ];

  const legalSettings: SettingItem[] = [
    {
      icon: 'file-text',
      title: 'Terms of Service',
      subtitle: 'User agreement and policies',
      route: '/(settings)/terms',
    },
    {
      icon: 'lock',
      title: 'Privacy Policy',
      subtitle: 'How we handle your data',
      route: '/(settings)/privacy-policy',
    },
  ];

  const dangerSettings: SettingItem[] = [
    {
      icon: 'log-out',
      title: 'Logout',
      action: handleLogout,
    },
    {
      icon: 'trash-2',
      title: 'Delete Account',
      subtitle: 'Permanently delete your account',
      action: handleDeleteAccount,
      destructive: true,
    },
  ];

  const renderSection = (title: string, items: SettingItem[]) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={styles.settingItem}
          onPress={() => {
            if (item.action) {
              item.action();
            } else if (item.route) {
              router.push(item.route as any);
            }
          }}
        >
          <View style={styles.settingLeft}>
            <View style={[styles.iconContainer, item.destructive && styles.destructiveIcon]}>
              <Feather
                name={item.icon as any}
                size={20}
                color={item.destructive ? '#ff4444' : '#666'}
              />
            </View>
            <View style={styles.textContainer}>
              <Text style={[styles.settingTitle, item.destructive && styles.destructiveText]}>
                {item.title}
              </Text>
              {item.subtitle && (
                <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
              )}
            </View>
          </View>
          <Feather name="chevron-right" size={20} color="#ccc" />
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <ScreenWrapper gradient>
      <View style={styles.container}>
        <LinearGradient
          colors={['#FFF7D2', 'rgba(86, 55, 158, 0.4)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={styles.placeholder} />
        </LinearGradient>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {renderSection('Account', accountSettings)}
          {renderSection('App Settings', appSettings)}
          {renderSection('Legal', legalSettings)}
          {renderSection('Account Actions', dangerSettings)}
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  placeholder: {
    width: 30,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    marginTop: 10,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    marginBottom: 10,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  destructiveIcon: {
    backgroundColor: '#ffebee',
  },
  textContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  destructiveText: {
    color: '#ff4444',
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
});