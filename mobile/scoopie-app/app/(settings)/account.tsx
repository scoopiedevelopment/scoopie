import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter, useNavigation } from 'expo-router';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import { LinearGradient } from 'expo-linear-gradient';
import { getProfile } from '../../api/profileService';
import apiClient from '../../api/apiClient';

interface ProfileData {
  username: string;
  name: string;
  bio: string;
  website: string;
  type: 'Public' | 'Private' | 'Business';
  email: string;
}

export default function AccountScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    username: '',
    name: '',
    bio: '',
    website: '',
    type: 'Public',
    email: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await getProfile();
      const data = response.data;
      
      setProfileData({
        username: data.username || '',
        name: data.name || '',
        bio: data.bio || '',
        website: data.website || '',
        type: data.type || 'Public',
        email: data.user?.email || '',
      });
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      Alert.alert('Error', 'Failed to load profile data.');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async () => {
    if (!profileData.username.trim() || !profileData.name.trim()) {
      Alert.alert('Error', 'Username and name are required.');
      return;
    }

    if (profileData.username.length < 3 || profileData.username.length > 30) {
      Alert.alert('Error', 'Username must be between 3-30 characters.');
      return;
    }

    if (profileData.name.length > 20) {
      Alert.alert('Error', 'Name must be less than 20 characters.');
      return;
    }

    if (profileData.bio.length > 300) {
      Alert.alert('Error', 'Bio must be less than 300 characters.');
      return;
    }

    setUpdating(true);
    try {
      await apiClient.post('/profile/update', {
        username: profileData.username.trim(),
        name: profileData.name.trim(),
        bio: profileData.bio.trim(),
        website: profileData.website.trim() || null,
        type: profileData.type,
      });

      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      const message = error.response?.data?.message || 'Failed to update profile.';
      Alert.alert('Error', message);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteAccount = async () => {
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
              await apiClient.delete('/profile/delete');
              Alert.alert('Account Deleted', 'Your account has been permanently deleted.', [
                { text: 'OK', onPress: () => router.replace('/auth') }
              ]);
            } catch (error: any) {
              console.error('Failed to delete account:', error);
              Alert.alert('Error', 'Failed to delete account. Please try again.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <ScreenWrapper gradient>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color="#7B4DFF" />
          <Text style={{ marginTop: 10, color: '#666' }}>Loading account data...</Text>
        </View>
      </ScreenWrapper>
    );
  }

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
          <Text style={styles.headerTitle}>Account Management</Text>
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={updateProfile}
            disabled={updating}
          >
            {updating ? (
              <ActivityIndicator size="small" color="#7B4DFF" />
            ) : (
              <Text style={styles.saveText}>Save</Text>
            )}
          </TouchableOpacity>
        </LinearGradient>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Profile Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={[styles.input, styles.disabledInput]}
                value={profileData.email}
                editable={false}
                placeholder="Email address"
              />
              <Text style={styles.inputHint}>Email cannot be changed</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Username *</Text>
              <TextInput
                style={styles.input}
                value={profileData.username}
                onChangeText={(text) => setProfileData(prev => ({ ...prev, username: text }))}
                placeholder="Username (3-30 characters)"
                autoCapitalize="none"
                maxLength={30}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Name *</Text>
              <TextInput
                style={styles.input}
                value={profileData.name}
                onChangeText={(text) => setProfileData(prev => ({ ...prev, name: text }))}
                placeholder="Display name (max 20 characters)"
                maxLength={20}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Bio</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={profileData.bio}
                onChangeText={(text) => setProfileData(prev => ({ ...prev, bio: text }))}
                placeholder="Tell people about yourself (max 300 characters)"
                multiline
                maxLength={300}
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>{profileData.bio.length}/300</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Website</Text>
              <TextInput
                style={styles.input}
                value={profileData.website}
                onChangeText={(text) => setProfileData(prev => ({ ...prev, website: text }))}
                placeholder="https://yourwebsite.com"
                autoCapitalize="none"
                keyboardType="url"
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Privacy Settings</Text>
            
            <View style={styles.privacyOption}>
              <TouchableOpacity
                style={[styles.privacyButton, profileData.type === 'Public' && styles.activePrivacy]}
                onPress={() => setProfileData(prev => ({ ...prev, type: 'Public' }))}
              >
                <Feather name="globe" size={20} color={profileData.type === 'Public' ? '#7B4DFF' : '#666'} />
                <View style={styles.privacyText}>
                  <Text style={[styles.privacyTitle, profileData.type === 'Public' && styles.activeText]}>
                    Public
                  </Text>
                  <Text style={styles.privacyDescription}>
                    Anyone can see your profile and posts
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.privacyOption}>
              <TouchableOpacity
                style={[styles.privacyButton, profileData.type === 'Private' && styles.activePrivacy]}
                onPress={() => setProfileData(prev => ({ ...prev, type: 'Private' }))}
              >
                <Feather name="lock" size={20} color={profileData.type === 'Private' ? '#7B4DFF' : '#666'} />
                <View style={styles.privacyText}>
                  <Text style={[styles.privacyTitle, profileData.type === 'Private' && styles.activeText]}>
                    Private
                  </Text>
                  <Text style={styles.privacyDescription}>
                    Only approved followers can see your posts
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.privacyOption}>
              <TouchableOpacity
                style={[styles.privacyButton, profileData.type === 'Business' && styles.activePrivacy]}
                onPress={() => setProfileData(prev => ({ ...prev, type: 'Business' }))}
              >
                <Feather name="briefcase" size={20} color={profileData.type === 'Business' ? '#7B4DFF' : '#666'} />
                <View style={styles.privacyText}>
                  <Text style={[styles.privacyTitle, profileData.type === 'Business' && styles.activeText]}>
                    Business
                  </Text>
                  <Text style={styles.privacyDescription}>
                    Public with business features
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Danger Zone</Text>
            <TouchableOpacity style={styles.dangerButton} onPress={handleDeleteAccount}>
              <Feather name="trash-2" size={20} color="#ff4444" />
              <Text style={styles.dangerText}>Delete Account</Text>
            </TouchableOpacity>
          </View>
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
    flex: 1,
    textAlign: 'center',
    marginRight: 60,
  },
  saveBtn: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#7B4DFF',
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  saveText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  disabledInput: {
    backgroundColor: '#f0f0f0',
    color: '#666',
  },
  textArea: {
    height: 80,
    paddingTop: 12,
  },
  inputHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  charCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 5,
  },
  privacyOption: {
    marginBottom: 15,
  },
  privacyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    backgroundColor: '#f9f9f9',
  },
  activePrivacy: {
    borderColor: '#7B4DFF',
    backgroundColor: '#f0f0ff',
  },
  privacyText: {
    marginLeft: 15,
    flex: 1,
  },
  privacyTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  activeText: {
    color: '#7B4DFF',
  },
  privacyDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderWidth: 1,
    borderColor: '#ff4444',
    borderRadius: 12,
    backgroundColor: '#ffebee',
  },
  dangerText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ff4444',
    marginLeft: 10,
  },
});