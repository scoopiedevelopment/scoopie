import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, Image, StyleSheet, Dimensions } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import * as VideoThumbnails from 'expo-video-thumbnails';

const { width } = Dimensions.get('window');

export default function RenderClip({ item }: { item: any}) {
  const videoUri = item.video; 

  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [showVideo, setShowVideo] = useState(false);

  // ✅ must pass object
  const player = useVideoPlayer({ uri: videoUri }, (player) => {
    player.loop = false;
  });

  useEffect(() => {
    const generateThumbnail = async () => {
      try {
        const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, {
          time: 1000,
        });
        setThumbnail(uri);
      } catch (e) {
        console.warn('Thumbnail error:', e);
      }
    };
    generateThumbnail();
  }, []);

  return (
    <View style={styles.container}>
      {!showVideo && thumbnail && (
        <TouchableOpacity
          style={styles.thumbnailWrapper}
          onPress={() => {
            setShowVideo(true);
            player.play(); // ✅ start video
          }}
        >
          <Image source={{ uri: thumbnail }} style={styles.thumbnail} />
          <View style={styles.playButtonOverlay}>
            <View style={styles.playTriangle} />
          </View>
        </TouchableOpacity>
      )}

      {showVideo && (
        <VideoView
          player={player}
          style={styles.video}
          contentFit="contain"
          allowsFullscreen
          allowsPictureInPicture
        />
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
});
