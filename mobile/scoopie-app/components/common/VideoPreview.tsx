import { VideoView, useVideoPlayer } from 'expo-video';
import { StyleSheet } from 'react-native';

const VideoPreview = ({ uri }: { uri: string }) => {
  const player = useVideoPlayer({ uri }, (player) => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

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