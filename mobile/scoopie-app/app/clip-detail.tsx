import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  StatusBar,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Video, ResizeMode } from 'expo-av';

const { width, height } = Dimensions.get('window');
const iconSize = 30;
const iconColor = 'white';

interface User {
  id: string;
  username: string;
  profilePic?: string;
}

interface Clip {
  id: string;
  userId: string;
  video: string;
  text?: string;
  visibility: 'Public' | 'Private' | 'Archive';
  views: number;
  shares: number;
  createdAt: string;
  updatedAt: string;
  user: User;
}

export default function ClipDetailScreen() {
  const router = useRouter();
  const { clipId, clipData } = useLocalSearchParams();
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const videoRef = useRef<Video>(null);

  const clip: Clip = clipData ? JSON.parse(clipData as string) : null;

  if (!clip) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Clip not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleLike = useCallback(() => {
    setIsLiked(!isLiked);
  }, [isLiked]);

  const handleSave = useCallback(() => {
    setIsSaved(!isSaved);
  }, [isSaved]);

  const handleShare = useCallback(() => {
    Alert.alert('Share', 'Share functionality would be implemented here');
  }, []);

  const handleComment = useCallback(() => {
    Alert.alert('Comment', 'Comment functionality would be implemented here');
  }, []);

  const togglePlayPause = useCallback(async () => {
    if (videoRef.current) {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  const onPlaybackStatusUpdate = useCallback((status: any) => {
    if (status.isLoaded) {
      setIsPlaying(status.isPlaying);
    }
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="black" />
      
      {/* Back Button */}
      <TouchableOpacity 
        onPress={() => router.back()} 
        style={styles.backButton}
      >
        <Ionicons name="chevron-back" size={28} color="white" />
      </TouchableOpacity>

      {/* Video Container */}
      <View style={styles.videoContainer}>
        <Video
          ref={videoRef}
          style={styles.video}
          source={{ uri: clip.video }}
          resizeMode={ResizeMode.COVER}
          shouldPlay={isPlaying}
          isLooping={true}
          onPlaybackStatusUpdate={onPlaybackStatusUpdate}
        />
        
        {/* Play/Pause Overlay */}
        <TouchableOpacity 
          style={styles.playPauseOverlay}
          onPress={togglePlayPause}
          activeOpacity={0.8}
        >
          <View style={styles.playPauseButton}>
            <Ionicons 
              name={isPlaying ? "pause" : "play"} 
              size={40} 
              color="white" 
            />
          </View>
        </TouchableOpacity>

        {/* Video Info Overlay */}
        <View style={styles.videoInfoOverlay}>
          <View style={styles.userInfo}>
            <Text style={styles.username}>@{clip.user.username}</Text>
            <Text style={styles.videoText}>{clip.text || 'No caption'}</Text>
          </View>
          
          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
              <Ionicons 
                name={isLiked ? "heart" : "heart-outline"} 
                size={iconSize} 
                color={isLiked ? "#ff4444" : iconColor} 
              />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={handleComment}>
              <Ionicons name="chatbubble-outline" size={iconSize} color={iconColor} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={handleSave}>
              <Ionicons 
                name={isSaved ? "bookmark" : "bookmark-outline"} 
                size={iconSize} 
                color={isSaved ? "#7B4DFF" : iconColor} 
              />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
              <Ionicons name="share-outline" size={iconSize} color={iconColor} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  errorText: {
    color: 'white',
    fontSize: 18,
    marginBottom: 20,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  videoContainer: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: width,
    height: height,
  },
  playPauseOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playPauseButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoInfoOverlay: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  userInfo: {
    flex: 1,
    marginRight: 16,
  },
  username: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  videoText: {
    color: 'white',
    fontSize: 14,
    lineHeight: 20,
  },
  actionButtons: {
    alignItems: 'center',
  },
  actionButton: {
    marginBottom: 20,
    padding: 8,
  },
});
