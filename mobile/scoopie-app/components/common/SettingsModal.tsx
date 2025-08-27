import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

const { width } = Dimensions.get('window');

export default function SettingsModal({ visible, onClose }: SettingsModalProps) {
  const router = useRouter();
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
              onClose();
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

  const handleEditProfile = () => {
    onClose();
    // Navigate to edit profile screen when implemented
    Alert.alert('Coming Soon', 'Edit profile feature will be available soon!');
  };

  const handleSettings = () => {
    onClose();
    router.push('/(settings)/settings');
  };

  const handleBlockedUsers = () => {
    onClose();
    // Navigate to blocked users screen when implemented
    Alert.alert('Coming Soon', 'Blocked users feature will be available soon!');
  };

  const handlePrivacy = () => {
    onClose();
    // Navigate to privacy settings when implemented
    Alert.alert('Coming Soon', 'Privacy settings will be available soon!');
  };

  const menuItems = [
    {
      icon: 'edit-3',
      title: 'Edit Profile',
      onPress: handleEditProfile,
    },
    {
      icon: 'settings',
      title: 'Settings',
      onPress: handleSettings,
    },
    {
      icon: 'shield',
      title: 'Privacy',
      onPress: handlePrivacy,
    },
    {
      icon: 'user-x',
      title: 'Blocked Users',
      onPress: handleBlockedUsers,
    },
    {
      icon: 'log-out',
      title: 'Logout',
      onPress: handleLogout,
      isDestructive: true,
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {}} // Prevent modal from closing when tapping inside
          >
            <View style={styles.modal}>
              <View style={styles.header}>
                <Text style={styles.title}>Menu</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Feather name="x" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              {menuItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.menuItem}
                  onPress={item.onPress}
                >
                  <Feather
                    name={item.icon as any}
                    size={20}
                    color={item.isDestructive ? '#ff4444' : '#333'}
                  />
                  <Text
                    style={[
                      styles.menuText,
                      item.isDestructive && styles.destructiveText,
                    ]}
                  >
                    {item.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.8,
    maxWidth: 320,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  menuText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 16,
    fontWeight: '500',
  },
  destructiveText: {
    color: '#ff4444',
  },
});