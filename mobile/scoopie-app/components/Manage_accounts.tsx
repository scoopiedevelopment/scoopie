import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { getProfile } from '../api/profileService';
import apiClient from '../api/apiClient';

interface ProfileData {
  username: string;
  name: string;
  email: string;
  dateofBirth?: string;
  type: 'Public' | 'Private' | 'Business';
  phone?: string;
}

export default function ManageAccount() {
  const [date, setDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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
        email: data.user?.email || '',
        dateofBirth: data.dateofBirth,
        type: data.type || 'Public',
        phone: data.phone || '',
      });

      if (data.dateofBirth) {
        setDate(new Date(data.dateofBirth));
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      Alert.alert('Error', 'Failed to load profile data.');
    } finally {
      setLoading(false);
    }
  };

  const updateDateOfBirth = async (selectedDate: Date) => {
    try {
      await apiClient.post('/profile/update', {
        dateofBirth: selectedDate.toISOString(),
      });
      
      setDate(selectedDate);
      Alert.alert('Success', 'Date of birth updated successfully!');
    } catch (error: any) {
      console.error('Failed to update date of birth:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to update date of birth.');
    }
  };

  const switchToBusinessAccount = async () => {
    try {
      await apiClient.post('/profile/update', {
        type: 'Business',
      });
      
      Alert.alert('Success', 'Account switched to Business successfully!');
      fetchProfile(); // Refresh data
    } catch (error: any) {
      console.error('Failed to switch account type:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to switch account type.');
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
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#7B4DFF" />
        <Text style={{ marginTop: 10, color: '#666' }}>Loading account data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Account</Text>
      </View>

      {/* Account Information */}
      <Text style={styles.sectionTitle}>Account Information</Text>

      {/* Phone Number */}
      <View style={styles.row}>
        <Ionicons name="call" size={24} color="#000" />
        <Text style={styles.label}>Phone Number</Text>
        <Text style={styles.value}>{profileData?.phone || 'Not set'}</Text>
        <MaterialIcons name="chevron-right" size={20} color="#000" />
      </View>

      {/* Email */}
      <View style={styles.row}>
        <Ionicons name="mail" size={24} color="#000" />
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{profileData?.email}</Text>
        <MaterialIcons name="chevron-right" size={20} color="#000" />
      </View>

      {/* Date of Birth */}
      <View style={styles.row}>
        <Ionicons name="calendar" size={24} color="#000" />
        <Text style={styles.label}>Date of Birth</Text>
        <Text style={styles.value}>
          {date ? date.toLocaleDateString('en-GB') : 'Select Date'}
        </Text>
        <TouchableOpacity onPress={() => setShowDatePicker(true)}>
          <Ionicons name="calendar-outline" size={20} color="#000" />
        </TouchableOpacity>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={date || new Date()} // default today but won't set until chosen
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (event.type === 'set' && selectedDate) {
              updateDateOfBirth(selectedDate);
            }
          }}
        />
      )}

      {/* Account Control */}
      <Text style={styles.sectionTitle}>Account Control</Text>

      {/* Switch Account */}
      {profileData?.type !== 'Business' && (
        <TouchableOpacity style={styles.row} onPress={switchToBusinessAccount}>
          <FontAwesome5 name="exchange-alt" size={24} color="#000" />
          <Text style={styles.label}>Switch to Business Account</Text>
          <MaterialIcons name="chevron-right" size={20} color="#000" />
        </TouchableOpacity>
      )}

      {/* Account Type Display */}
      <View style={styles.row}>
        <Ionicons 
          name={profileData?.type === 'Business' ? 'briefcase' : profileData?.type === 'Private' ? 'lock-closed' : 'globe'} 
          size={24} 
          color="#000" 
        />
        <Text style={styles.label}>Account Type</Text>
        <Text style={styles.value}>{profileData?.type}</Text>
      </View>

      {/* Delete Account */}
      <TouchableOpacity style={styles.row} onPress={handleDeleteAccount}>
        <MaterialIcons name="delete" size={24} color="#DA0000" />
        <Text style={[styles.label, { color: '#DA0000' }]}>
          Delete Account
        </Text>
        <MaterialIcons name="chevron-right" size={20} color="#DA0000" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF', padding: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 23,
    letterSpacing: -0.5,
    marginRight: 24,
  },
  sectionTitle: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 20,
    marginVertical: 10,
    marginLeft: 5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  label: {
    marginLeft: 10,
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 18,
    flex: 1,
  },
  value: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 18,
    marginRight: 10,
  },
});