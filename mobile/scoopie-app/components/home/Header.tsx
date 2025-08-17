import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

export default function Header() {
  const router = useRouter();
  const handleSearchPress = () => {
    router.push('/search');
  };
  const handleProfilePress = () => {
    router.push('/profile')
  }

  return (
    <LinearGradient
      colors={['#FFF7D2', 'rgba(86, 55, 158, 0.3)']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <View style={styles.topBar}>
        <Text style={styles.logo}>Logo</Text>
        <View style={styles.icons}>
          <TouchableOpacity onPress={handleSearchPress}>
            <Image
              source={require('../../assets/icons/searchIcon.png')}
              style={{ width: 40, height: 40 }}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleProfilePress}>
            <Image
              source={require('../../assets/icons/profileIcon.png')}
              style={{ width: 40, height: 40 }}
            />
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { paddingTop: 50, paddingBottom: 10, paddingHorizontal: 20 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logo: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  icons: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
});
