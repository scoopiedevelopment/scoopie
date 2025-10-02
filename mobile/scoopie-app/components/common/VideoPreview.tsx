import { VideoView, useVideoPlayer } from 'expo-video';
import { StyleSheet } from 'react-native';
import { useEffect, useRef } from 'react';
import audioManager from '@/utils/audioManager';

const VideoPreview = ({ uri }: { uri: string }) => {
  const isMountedRef = useRef(true);

  const player = useVideoPlayer({ uri }, (player) => {
    if (isMountedRef.current && player) {
      try {
        player.loop = true;
        player.muted = true;
        // Register player with audio manager
        audioManager.registerPlayer(player);
        // Don't auto-play to prevent background audio
      } catch (error) {
        console.log('VideoPreview player initialization error (ignored):', error);
      }
    }
  });

  // Cleanup: Stop video playback when component unmounts
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      // Unregister player from audio manager
      if (player) {
        audioManager.unregisterPlayer(player);
      }
      // Don't try to cleanup player on unmount to avoid errors
    };
  }, [player]);

  return (
    <VideoView
      style={styles.previewImage}
      player={player}
      nativeControls={false}
      allowsFullscreen={false}
      allowsPictureInPicture={false}
    />
  );
};

const styles = StyleSheet.create({
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    backgroundColor: '#eee',
  },
});

export default VideoPreview;