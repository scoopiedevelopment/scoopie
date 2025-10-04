import React, { useEffect, useState, useRef } from 'react';
import { View, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { isVideoUrl } from '@/utils/videoUtils';

interface PostMediaProps {
  url: string;
  style?: any;
  showPlayButton?: boolean;
}

const PostMedia: React.FC<PostMediaProps> = ({ 
  url, 
  style, 
  showPlayButton = true 
}) => {
  const [isVideo, setIsVideo] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [thumbnailLoading, setThumbnailLoading] = useState(false);
  const [thumbnailError, setThumbnailError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<Video>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    const checkIfVideo = () => {
      const videoCheck = isVideoUrl(url);
      setIsVideo(videoCheck);
      
      if (videoCheck) {
        // Add a small random delay to prevent too many simultaneous thumbnail generations
        const delay = Math.random() * 1000; // 0-1 second delay
        const timeoutId = setTimeout(() => {
          if (isMountedRef.current) {
            generateThumbnail();
          }
        }, delay);
        
        // Return cleanup function
        return () => clearTimeout(timeoutId);
      }
    };
    
    const cleanup = checkIfVideo();
    return cleanup;
  }, [url]);

  const generateThumbnail = async () => {
    if (!isVideo || thumbnailLoading || thumbnail) return; // Don't regenerate if already exists
    
    setThumbnailLoading(true);
    setThumbnailError(false);
    
    try {
      // Try multiple time points to get a good thumbnail
      const timePoints = [500, 1000, 2000, 5000]; // Try at 0.5s, 1s, 2s, 5s
      
      for (const time of timePoints) {
        try {
          const { uri } = await VideoThumbnails.getThumbnailAsync(url, {
            time: time,
            quality: 0.7, // Good quality but optimized for performance
          });
          
          if (isMountedRef.current && uri) {
            setThumbnail(uri);
            setThumbnailError(false);
            console.log(`Thumbnail generated successfully at ${time}ms for URL: ${url}`);
            break; // Success, exit the loop
          }
        } catch (timeError) {
          console.log(`Thumbnail generation failed at ${time}ms:`, timeError);
          // Continue to next time point
        }
      }
      
      // If all time points failed, set error state
      if (!thumbnail) {
        setThumbnailError(true);
        console.log('All thumbnail generation attempts failed for URL:', url);
      }
    } catch (error) {
      console.log('All thumbnail generation attempts failed:', error);
      setThumbnailError(true);
    } finally {
      if (isMountedRef.current) {
        setThumbnailLoading(false);
      }
    }
  };

  const retryThumbnailGeneration = () => {
    if (retryCount < 3) { // Limit retries to prevent infinite loops
      setRetryCount(prev => prev + 1);
      setThumbnailError(false);
      generateThumbnail();
    }
  };

  // Cleanup: Stop video playback when component unmounts
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      // Don't try to cleanup player on unmount to avoid errors
    };
  }, []);

  const handleVideoPress = async () => {
    try {
      if (videoError) {
        // Retry video loading
        setVideoError(false);
        setShowVideo(false);
        setIsPlaying(false);
        return;
      }
      
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

  const handleThumbnailPress = () => {
    // If thumbnail generation failed, try again
    if (thumbnailError && retryCount < 3) {
      retryThumbnailGeneration();
    } else if (thumbnail) {
      handleVideoPress();
    } else if (!thumbnailLoading) {
      // If no thumbnail and not loading, try to generate one
      generateThumbnail();
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

  // Check if video URL is valid
  if (isVideo && (!url || url.trim() === '' || url === 'null' || !url.startsWith('http'))) {
    return (
      <View style={[styles.container, style]}>
        <View style={[styles.media, styles.errorContainer]}>
          <Ionicons name="alert-circle" size={24} color="#666" />
        </View>
      </View>
    );
  }

  if (isVideo) {
    return (
      <View style={[styles.container, style]}>
        {!showVideo ? (
          <TouchableOpacity 
            style={styles.mediaContainer} 
            onPress={handleThumbnailPress}
            activeOpacity={0.8}
          >
            {/* Video thumbnail or placeholder */}
            {thumbnail ? (
              <Image 
                source={{ uri: thumbnail }} 
                style={styles.media}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.media, styles.videoPlaceholder]}>
                <Ionicons name="play-circle" size={40} color="rgba(255,255,255,0.8)" />
                {thumbnailError && retryCount < 3 && (
                  <View style={styles.retryOverlay}>
                    <Ionicons name="refresh" size={16} color="white" />
                    <Ionicons name="camera" size={12} color="white" style={{ marginTop: 2 }} />
                  </View>
                )}
                {thumbnailError && retryCount >= 3 && (
                  <View style={styles.errorOverlay}>
                    <Ionicons name="alert-circle" size={16} color="white" />
                    <Ionicons name="camera" size={12} color="white" style={{ marginTop: 2 }} />
                  </View>
                )}
              </View>
            )}
            {showPlayButton && (
              <View style={styles.playButtonOverlay}>
                <Ionicons name="play" size={20} color="white" />
              </View>
            )}
            {thumbnailLoading && (
              <View style={styles.loadingOverlay}>
                <Ionicons name="camera" size={16} color="white" />
                <Ionicons name="hourglass" size={12} color="white" style={{ marginLeft: 2 }} />
              </View>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.mediaContainer} 
            onPress={handleVideoPress}
            activeOpacity={0.8}
          >
            <Video
              ref={videoRef}
              source={{ uri: url }}
              style={styles.media}
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
                  <Ionicons name="play" size={20} color="white" />
                </View>
              </View>
            )}
            {videoError && (
              <View style={styles.errorOverlay}>
                <Ionicons name="alert-circle" size={16} color="white" />
                <Ionicons name="refresh" size={12} color="white" style={{ marginTop: 2 }} />
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <Image 
        source={{ uri: url }} 
        style={styles.media}
        resizeMode="cover"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  mediaContainer: {
    position: 'relative',
  },
  media: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  videoPlaceholder: {
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -10 }, { translateY: -10 }],
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    padding: 8,
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
  loadingOverlay: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 15,
    padding: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  retryOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 15,
    padding: 6,
    alignItems: 'center',
  },
  errorOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,0,0,0.6)',
    borderRadius: 15,
    padding: 6,
    alignItems: 'center',
  },
  errorContainer: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PostMedia;
