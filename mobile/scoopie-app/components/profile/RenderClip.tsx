import React, { useEffect, useState, useRef } from 'react';
import { View, TouchableOpacity, Image, StyleSheet, Dimensions, Text } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import * as VideoThumbnails from 'expo-video-thumbnails';

const { width } = Dimensions.get('window');

export default function RenderClip({ item }: { item: any}) {
  const videoUri = item.video; 
  const videoRef = useRef<Video>(null);

  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [showVideo, setShowVideo] = useState(false);
  const [thumbnailError, setThumbnailError] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Check if video URL is valid
  if (!videoUri || videoUri.trim() === '' || videoUri === 'null' || !videoUri.startsWith('http')) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Invalid Video</Text>
        </View>
      </View>
    );
  }

  useEffect(() => {
    if (thumbnailError) return; // Don't retry if already failed
    
    const generateThumbnail = async () => {
      try {
        const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, {
          time: 1000,
          quality: 0.7, // Lower quality for faster generation
        });
        setThumbnail(uri);
      } catch (e) {
        console.warn('Thumbnail error:', e);
        setThumbnailError(true);
      }
    };
    
    // Add a small delay to prevent too many simultaneous thumbnail generations
    const timeoutId = setTimeout(generateThumbnail, Math.random() * 500);
    return () => clearTimeout(timeoutId);
  }, [videoUri, thumbnailError]);

  const handleVideoPress = async () => {
    try {
      if (!showVideo) {
        setShowVideo(true);
        setIsPlaying(true);
        if (videoRef.current) {
          await videoRef.current.playAsync();
        }
      } else {
        // Toggle play/pause
        if (videoRef.current) {
          if (isPlaying) {
            await videoRef.current.pauseAsync();
            setIsPlaying(false);
          } else {
            await videoRef.current.playAsync();
            setIsPlaying(true);
          }
        }
      }
    } catch (error) {
      console.error('Video play error:', error);
      setVideoError(true);
    }
  };

  const handleVideoError = () => {
    console.error('Video load error');
    setVideoError(true);
  };

  const handleVideoLoad = () => {
    console.log('Video loaded successfully');
    setIsPlaying(true);
  };

  const handlePlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setIsPlaying(status.isPlaying);
      
      // Reset to thumbnail when video ends
      if (status.didJustFinish) {
        setShowVideo(false);
        setIsPlaying(false);
      }
    }
  };

  return (
    <View style={styles.container}>
      {!showVideo && thumbnail && !thumbnailError && !videoError && (
        <TouchableOpacity
          style={styles.thumbnailWrapper}
          onPress={handleVideoPress}
        >
          <Image source={{ uri: thumbnail }} style={styles.thumbnail} />
          <View style={styles.playButtonOverlay}>
            <View style={styles.playTriangle} />
          </View>
        </TouchableOpacity>
      )}

      {!showVideo && !thumbnail && !thumbnailError && !videoError && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      )}

      {!showVideo && thumbnailError && !videoError && (
        <TouchableOpacity
          style={styles.errorThumbnailWrapper}
          onPress={handleVideoPress}
        >
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Video</Text>
          </View>
          <View style={styles.playButtonOverlay}>
            <View style={styles.playTriangle} />
          </View>
        </TouchableOpacity>
      )}

      {videoError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Video Error</Text>
        </View>
      )}

      {showVideo && !videoError && (
        <TouchableOpacity
          style={styles.videoContainer}
          onPress={handleVideoPress}
          activeOpacity={1}
        >
          <Video
            ref={videoRef}
            source={{ uri: videoUri }}
            style={styles.video}
            resizeMode={ResizeMode.COVER}
            shouldPlay={true}
            isLooping={false}
            isMuted={true}
            onError={handleVideoError}
            onLoad={handleVideoLoad}
            onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
          />
          {/* Play/Pause overlay */}
          {!isPlaying && (
            <View style={styles.playPauseOverlay}>
              <View style={styles.playButtonOverlay}>
                <View style={styles.playTriangle} />
              </View>
            </View>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: (width - 60) / 3,
    height: (width - 60) / 3,
    marginVertical: 6,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailWrapper: {
    width: '100%',
    height: '100%',
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  playButtonOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -20 }, { translateY: -20 }],
    width: 40,
    height: 40,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 14,
    borderTopWidth: 10,
    borderBottomWidth: 10,
    borderLeftColor: 'white',
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    marginLeft: 3,
  },
  video: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  errorContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  errorText: {
    color: '#666',
    fontSize: 12,
    fontWeight: '500',
  },
  loadingContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  loadingText: {
    color: '#999',
    fontSize: 12,
  },
  errorThumbnailWrapper: {
    width: '100%',
    height: '100%',
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  videoContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  playPauseOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
});
