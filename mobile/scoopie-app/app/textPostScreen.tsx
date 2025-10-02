
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import ScreenWrapper from '@/components/common/ScreenWrapper';
import VideoPreview from '@/components/common/VideoPreview';
import { useRouter } from 'expo-router';
import { createClip, createPost, uploadImage } from '@/api/uploadService';
import { getProfile } from '@/api/profileService';
import { createStory } from '@/api/storyService';
import audioManager from '@/utils/audioManager';
const { width, height } = Dimensions.get("window");
export default function SecondScreen() {
  const [isVisible, setIsVisible] = useState(false);
  const navigation = useNavigation();
  const [postText, setPostText] = useState('');
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { uploadedImageUrls, uploadedVideoUrl, mode } = useLocalSearchParams<{
    uploadedImageUrls?: string;
    uploadedVideoUrl?: string;
    mode?: 'post' | 'reel';
  }>();
  const router = useRouter();

  const imageUrls = uploadedImageUrls
    ? JSON.parse(decodeURIComponent(uploadedImageUrls))
    : [];

  const videoUrl = uploadedVideoUrl ? decodeURIComponent(uploadedVideoUrl) : null;
  const combinedData = [
    ...(imageUrls || []),
    ...(videoUrl ? [videoUrl] : []),
  ];

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getProfile();
        setProfile(data);
      } catch (error) {
        console.error('Profile fetch error ❌:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);


  const handlePost = async () => {
    try {
      // Stop all video audio before posting
      audioManager.stopAllAudio();
      
      // Determine if this is a reel (clip) or regular post based on mode
      const isReel = mode === 'reel';
      
      if (videoUrl) {
        if (isReel) {
          // For reels, use clip/create API
          await createClip(videoUrl, postText || "");
        } else {
          // For regular posts with video, use post/create API
          await createPost([videoUrl], postText || "");
        }
      }

      if (imageUrls.length > 0) {
        // Images always use post/create API
        await createPost(imageUrls, postText || "");
      }

      setIsVisible(false);
      // Navigate away - this will trigger cleanup in VideoPreview components
      router.replace("/(tabs)/tab1");
    } catch (error) {
      console.error("Error while posting ❌:", error);
    }
  };

  const handleStory = async () => {
    try {
      // Stop all video audio before creating story
      audioManager.stopAllAudio();
      
      const storyUrl = videoUrl || imageUrls[0];
      const mediaType = videoUrl ? "Video" : "Image";

      await createStory({
        mediaUrl: storyUrl,
        mediaType: mediaType,
      });

      setIsVisible(false);
      // Navigate away - this will trigger cleanup in VideoPreview components
      router.replace("/(tabs)/tab1");
    } catch (error) {
      console.error("Error while creating story ❌:", error);
    }
  };

  return (
    <ScreenWrapper gradient>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >

        <LinearGradient
          colors={['#FFF7D2', 'rgba(106, 85, 178, 0.14)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={24} color="#000" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            {mode === 'reel' ? 'Reel' : 'Text'}
          </Text>

          <TouchableOpacity style={styles.postBtn} onPress={() => setIsVisible(true)}>
            <Text style={styles.postBtnText}>Post</Text>
          </TouchableOpacity>
        </LinearGradient>


        <View style={styles.mainContent}>
          <View style={styles.userRow}>

            <Image
              source={{
                uri: profile?.data?.profile?.profilePic,
              }}
              style={styles.avatar}
            />
            <View>
              <Text style={styles.userName}>{profile?.data?.profile?.username}</Text>
              <View style={styles.publicRow}>
                <Ionicons name="earth" size={14} color="gray" />
                <Text style={styles.publicText}> {profile?.data?.profile?.type}</Text>
              </View>
            </View>
          </View>
          <ScrollView style={{ flex: 1 }}>
            <TextInput
              style={styles.input}
              placeholder="What's on your mind?"
              placeholderTextColor="#000000"
              multiline
              value={postText}
              onChangeText={setPostText}
            />
          </ScrollView>
        </View>
        <View style={styles.bottomImages}>
          <FlatList
            data={combinedData}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, index) => index.toString()}
            renderItem={({ item, index }) => {
              const isVideo = videoUrl && item === videoUrl;
              return isVideo ? (
                <VideoPreview uri={item} />
              ) : (
                <Image source={{ uri: item }} style={styles.previewImage} />
              );
            }}
            contentContainerStyle={{ paddingHorizontal: 15 }}
          />
        </View>
        <Modal
          animationType="slide"
          transparent
          visible={isVisible}
          onRequestClose={() => setIsVisible(false)}
        >
          <View style={styles.modalBackground}>
            <View style={styles.modalContainer}>
              <Text style={styles.title}>Choose Option</Text>

              <TouchableOpacity style={styles.optionButton} onPress={handlePost}>
                <Text style={styles.optionText}>Post</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.optionButton} onPress={handleStory}>
                <Text style={styles.optionText}>Story</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setIsVisible(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 80,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 23, fontWeight: '500', color: '#000' },
  postBtn: {
    backgroundColor: '#8C5EFF',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  modalBackground: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    width: width,
    alignItems: "center",
  },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 15 },
  optionButton: {
    width: "100%",
    backgroundColor: "#f1f1f1",
    paddingVertical: 12,
    borderRadius: 10,
    marginVertical: 6,
    alignItems: "center",
  },
  optionText: { fontSize: 16, color: "#333" },
  cancelButton: {
    marginTop: 10,
    paddingVertical: 10,
    alignItems: "center",
    width: "100%",
  },
  cancelText: { fontSize: 16, color: "red" },
  postBtnText: { color: '#fff', fontWeight: '600' },
  mainContent: {
    flex: 1,
    backgroundColor: '#fff',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10, backgroundColor: '#eee' },
  userName: { fontWeight: '600', fontSize: 16 },
  publicRow: { flexDirection: 'row', alignItems: 'center' },
  publicText: { color: 'gray', fontSize: 12 },
  input: {
    fontSize: 16,
    paddingHorizontal: 15,
    paddingVertical: 10,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  bottomImages: {
    paddingVertical: 10,
    borderTopWidth: 0.5,
    borderTopColor: '#ddd',
    marginBottom: 20
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 4,
    marginRight: 8,
    backgroundColor: '#eee',
  },
});
