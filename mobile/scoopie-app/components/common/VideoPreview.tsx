import { VideoView, useVideoPlayer } from "expo-video";
import { StyleSheet } from "react-native";

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
    />
  );
};

const styles = StyleSheet.create({
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 4,
    marginRight: 8,
    backgroundColor: "#eee",
  },

})

export default VideoPreview