import React, { useEffect, useState, useRef } from 'react';
import { View, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
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
  const isMountedRef = useRef(true);

  const player = useVideoPlayer(
    isVideo ? { uri: url } : '',
    (player) => {
      if (isVideo && isMountedRef.current && player) {
        try {
          player.loop = false;
          player.muted = true;
          // Don't auto-play to prevent background audio
        } catch (error) {
          console.log('Player initialization error (ignored):', error);
        }
      }
    }
  );

  useEffect(() => {
    const checkIfVideo = () => {
      const videoCheck = isVideoUrl(url);
      setIsVideo(videoCheck);
      
      if (videoCheck) {
        generateThumbnail();
      }
    };
    
    checkIfVideo();
  }, [url]);

  const generateThumbnail = async () => {
    if (!isVideo || thumbnailLoading) return;
    
    setThumbnailLoading(true);
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
            console.log(`Thumbnail generated successfully at ${time}ms`);
            break; // Success, exit the loop
          }
        } catch (timeError) {
          console.log(`Thumbnail generation failed at ${time}ms:`, timeError);
          // Continue to next time point
        }
      }
    } catch (error) {
      console.log('All thumbnail generation attempts failed:', error);
      // Keep thumbnail as null if all attempts fail
    } finally {
      if (isMountedRef.current) {
        setThumbnailLoading(false);
      }
    }
  };

  // Cleanup: Stop video playback when component unmounts
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      // Don't try to cleanup player on unmount to avoid errors
    };
  }, []);

  const handlePlayPress = () => {
    if (isVideo && isMountedRef.current) {
      try {
        setShowVideo(true);
        if (player) {
          player.play();
        }
      } catch (error) {
        console.log('Play error (ignored):', error);
      }
    }
  };

  const handleThumbnailPress = () => {
    // If thumbnail generation failed, try again
    if (!thumbnail && !thumbnailLoading) {
      generateThumbnail();
    } else {
      handlePlayPress();
    }
  };

  const handleVideoPress = () => {
    if (!isMountedRef.current) return;
    
    try {
      if (showVideo) {
        setShowVideo(false);
        if (player) {
          player.pause();
        }
      } else {
        setShowVideo(true);
        if (player) {
          player.play();
        }
      }
    } catch (error) {
      console.log('Video toggle error (ignored):', error);
    }
  };

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
                {!thumbnailLoading && (
                  <View style={styles.retryOverlay}>
                    <Ionicons name="refresh" size={16} color="white" />
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
            <VideoView
              style={styles.media}
              player={player}
              nativeControls={false}
              allowsFullscreen={false}
              allowsPictureInPicture={false}
            />
            <View style={styles.videoOverlay}>
              <Ionicons name="pause" size={20} color="white" />
            </View>
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
  videoOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 15,
    padding: 6,
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
});

export default PostMedia;
