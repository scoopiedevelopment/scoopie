import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Dimensions,
  Image
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

const mockReelThumbnails = [
  'https://picsum.photos/200/300?random=1',
  'https://picsum.photos/200/300?random=2',
  'https://picsum.photos/200/300?random=3',
  'https://picsum.photos/200/300?random=4',
];

export default function HomeScreen() {
  const handleLogout = async () => {
    await AsyncStorage.removeItem('accessToken');
    // The AuthWrapper will automatically detect this and show auth screens
  };

  const openReelsScreen = () => {
    router.push('/reels');
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.appName}>Scoopie</Text>
        <TouchableOpacity style={styles.profileButton}>
          <View style={styles.profileIcon}>
            <Text style={styles.profileText}>👤</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeTitle}>Welcome Back! 👋</Text>
        <Text style={styles.welcomeSubtitle}>Discover amazing food content</Text>
      </View>

      {/* Reels Section */}
      <View style={styles.reelsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🎬 Trending Reels</Text>
          <TouchableOpacity onPress={openReelsScreen}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          style={styles.reelsPreview} 
          onPress={openReelsScreen}
          activeOpacity={0.8}
        >
          <View style={styles.reelsThumbnailContainer}>
            {mockReelThumbnails.map((thumbnail, index) => (
              <View key={index} style={[styles.thumbnailWrapper, { zIndex: 4 - index }]}>
                <Image 
                  source={{ uri: thumbnail }} 
                  style={[styles.reelThumbnail, { marginLeft: index * -15 }]} 
                />
              </View>
            ))}
          </View>
          
          <View style={styles.reelsInfo}>
            <Text style={styles.reelsTitle}>Latest Food Reels</Text>
            <Text style={styles.reelsDescription}>
              Watch trending cooking videos, recipes, and food reviews
            </Text>
            <View style={styles.reelsStats}>
              <Text style={styles.statText}>🔥 1.2K new today</Text>
            </View>
          </View>
          
          <View style={styles.playButtonLarge}>
            <Text style={styles.playIcon}>▶</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Other Sections */}
      <View style={styles.featuresSection}>
        <Text style={styles.sectionTitle}>✨ Features</Text>
        
        <View style={styles.featureGrid}>
          <TouchableOpacity style={styles.featureCard}>
            <Text style={styles.featureIcon}>🍳</Text>
            <Text style={styles.featureTitle}>Recipes</Text>
            <Text style={styles.featureDescription}>Discover new recipes</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.featureCard}>
            <Text style={styles.featureIcon}>⭐</Text>
            <Text style={styles.featureTitle}>Reviews</Text>
            <Text style={styles.featureDescription}>Restaurant reviews</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.featureCard}>
            <Text style={styles.featureIcon}>📍</Text>
            <Text style={styles.featureTitle}>Nearby</Text>
            <Text style={styles.featureDescription}>Find local spots</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.featureCard}>
            <Text style={styles.featureIcon}>👥</Text>
            <Text style={styles.featureTitle}>Community</Text>
            <Text style={styles.featureDescription}>Join food lovers</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Logout Button */}
      <View style={styles.bottomSection}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a73e8',
  },
  profileButton: {
    width: 40,
    height: 40,
  },
  profileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f3f4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileText: {
    fontSize: 18,
  },
  welcomeSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#202124',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#5f6368',
  },
  reelsSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#202124',
  },
  seeAllText: {
    fontSize: 14,
    color: '#1a73e8',
    fontWeight: '600',
  },
  reelsPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e8eaed',
  },
  reelsThumbnailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  thumbnailWrapper: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  reelThumbnail: {
    width: 40,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    borderWidth: 2,
    borderColor: '#fff',
  },
  reelsInfo: {
    flex: 1,
    marginRight: 12,
  },
  reelsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#202124',
    marginBottom: 4,
  },
  reelsDescription: {
    fontSize: 14,
    color: '#5f6368',
    lineHeight: 20,
    marginBottom: 8,
  },
  reelsStats: {
    flexDirection: 'row',
  },
  statText: {
    fontSize: 12,
    color: '#ea4335',
    fontWeight: '600',
  },
  playButtonLarge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1a73e8',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1a73e8',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  playIcon: {
    fontSize: 18,
    color: '#fff',
    marginLeft: 2,
  },
  featuresSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  featureCard: {
    width: (width - 52) / 2,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e8eaed',
  },
  featureIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#202124',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 12,
    color: '#5f6368',
  },
  bottomSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#fff',
    marginBottom: 20,
  },
  logoutButton: {
    backgroundColor: '#ea4335',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
