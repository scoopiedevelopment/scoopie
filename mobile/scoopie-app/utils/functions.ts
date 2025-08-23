import { Share } from 'react-native';

export const shareVideo = async (videoUrl: string) => {
  try {
    await Share.share({
      message: `Check out this amazing video: ${videoUrl}`,
      url: videoUrl,
    });
  } catch (error) {
    console.error('Error sharing video:', error);
  }
};