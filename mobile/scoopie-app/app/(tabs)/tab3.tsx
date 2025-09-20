import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import EnhancedCamera from "../enhancedCamera";

export default function CameraTab() {
  const [cameraOpen, setCameraOpen] = useState(false);
  const [selectedMode, setSelectedMode] = useState<'story' | 'post' | 'clip'>('post');

  const openCamera = (mode: 'story' | 'post' | 'clip') => {
    setSelectedMode(mode);
    setCameraOpen(true);
  };

  const handleClose = () => {
    setCameraOpen(false);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Create Content</Text>
          <Text style={styles.subtitle}>Choose what you want to create</Text>
          
          <View style={styles.optionsContainer}>
            <TouchableOpacity 
              style={styles.optionButton}
              onPress={() => openCamera('story')}
            >
              <View style={styles.optionIcon}>
                <Ionicons name="camera" size={32} color="#667eea" />
              </View>
              <Text style={styles.optionTitle}>Story</Text>
              <Text style={styles.optionDescription}>Share moments that disappear in 24 hours</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.optionButton}
              onPress={() => openCamera('post')}
            >
              <View style={styles.optionIcon}>
                <Ionicons name="images" size={32} color="#667eea" />
              </View>
              <Text style={styles.optionTitle}>Post</Text>
              <Text style={styles.optionDescription}>Share photos and videos with your followers</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.optionButton}
              onPress={() => openCamera('clip')}
            >
              <View style={styles.optionIcon}>
                <Ionicons name="videocam" size={32} color="#667eea" />
              </View>
              <Text style={styles.optionTitle}>Reel</Text>
              <Text style={styles.optionDescription}>Create short videos with music and effects</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Enhanced Camera Modal */}
      <Modal visible={cameraOpen} animationType="slide">
        <EnhancedCamera onClose={handleClose} mode={selectedMode} />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 40,
    textAlign: 'center',
  },
  optionsContainer: {
    width: '100%',
    maxWidth: 300,
  },
  optionButton: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  optionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});