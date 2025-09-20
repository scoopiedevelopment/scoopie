import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter, useNavigation } from 'expo-router';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import ErrorBoundary from '../../components/common/ErrorBoundary';
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
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Hide the default header
  React.useEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

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
              setIsLoading(true);
              setError(null);
              await logout();
              router.replace('/auth');
            } catch (error: any) {
              const errorMessage = error?.message || 'Failed to logout. Please try again.';
              setError(errorMessage);
              Alert.alert('Error', errorMessage);
            } finally {
              setIsLoading(false);
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
          onPress: async () => {
            try {
              setIsLoading(true);
              setError(null);
              // TODO: Implement actual delete account API call
              // await deleteAccount();
              Alert.alert('Account Deleted', 'Your account has been deleted successfully.');
            } catch (error: any) {
              const errorMessage = error?.message || 'Failed to delete account. Please try again.';
              setError(errorMessage);
              Alert.alert('Error', errorMessage);
            } finally {
              setIsLoading(false);
            }
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

  const handleNavigation = (route: string) => {
    try {
      // Check if route exists before navigating
      if (route) {
        router.push(route as any);
      } else {
        Alert.alert('Error', 'This feature is not available yet.');
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Navigation failed. Please try again.';
      setError(errorMessage);
      Alert.alert('Navigation Error', errorMessage);
    }
  };

  const renderSection = (title: string, items: SettingItem[]) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={[styles.settingItem, isLoading && styles.disabledItem]}
          onPress={() => {
            if (isLoading) return; // Prevent actions while loading
            
            try {
              if (item.action) {
                item.action();
              } else if (item.route) {
                handleNavigation(item.route);
              }
            } catch (error: any) {
              const errorMessage = error?.message || 'An unexpected error occurred.';
              setError(errorMessage);
              Alert.alert('Error', errorMessage);
            }
          }}
          disabled={isLoading}
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
          {isLoading ? (
            <ActivityIndicator size="small" color="#666" />
          ) : (
            <Feather name="chevron-right" size={20} color="#ccc" />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <ErrorBoundary>
      <ScreenWrapper gradient>
        {/* Custom Header */}
        {/* <View style={styles.header}> */}
          {/* <TouchableOpacity onPress={() => router.back()} style={styles.backButton}> */}
            {/* <Ionicons name="chevron-back" size={28} color="#1a1a1a" /> */}
          {/* </TouchableOpacity> */}
          {/* <Text style={styles.headerTitle}>Settings</Text> */}
          {/* <TouchableOpacity style={styles.menuButton}> */}
            {/* <Ionicons name="ellipsis-horizontal" size={24} color="#1a1a1a" /> */}
          {/* </TouchableOpacity> */}
        {/* </View> */}

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

        {/* Error Display */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity 
              style={styles.dismissButton}
              onPress={() => setError(null)}
            >
              <Text style={styles.dismissText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Loading Overlay */}
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#7B4DFF" />
            <Text style={styles.loadingText}>Processing...</Text>
          </View>
        )}

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {renderSection('Account', accountSettings)}
          {renderSection('App Settings', appSettings)}
          {renderSection('Legal', legalSettings)}
          {renderSection('Account Actions', dangerSettings)}
        </ScrollView>
      </View>
    </ScreenWrapper>
    </ErrorBoundary>
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  menuButton: {
    padding: 8,
    marginRight: -8,
  },
  // Error handling styles
  errorContainer: {
    backgroundColor: '#ffebee',
    borderColor: '#ffcdd2',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 20,
    marginVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
    flex: 1,
    marginRight: 10,
  },
  dismissButton: {
    backgroundColor: '#ffcdd2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  dismissText: {
    color: '#c62828',
    fontSize: 12,
    fontWeight: '600',
  },
  // Loading styles
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  // Disabled state
  disabledItem: {
    opacity: 0.6,
  },
});