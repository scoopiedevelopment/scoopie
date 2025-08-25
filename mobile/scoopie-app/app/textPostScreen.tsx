
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import ScreenWrapper from '@/components/common/ScreenWrapper';
import VideoPreview from '@/components/common/VideoPreview';
import { useRouter } from 'expo-router';
import { createClip, createPost, uploadImage } from '@/api/uploadService';
import { getProfile } from '@/api/profileService';

export default function SecondScreen() {

  const navigation = useNavigation();
  const [postText, setPostText] = useState('');
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { uploadedImageUrls, uploadedVideoUrl } = useLocalSearchParams<{
    uploadedImageUrls?: string;
    uploadedVideoUrl?: string;
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

  const handlePost = async () => {
    try {
      if (videoUrl) {
        const result = await createClip(videoUrl, postText || '');
      }

      // Handle captured image from camera
      // if (capturedImage) {
      //   const uploadResult = await uploadImage(capturedImage);
      //   if (uploadResult.success && uploadResult.data.urls?.length > 0) {
      //     const result = await createPost(uploadResult.data.urls, postText || '');
      //   }
      // }

      if (imageUrls.length > 0) {
        const result = await createPost(imageUrls, postText || '');
      }

      router.replace('/(tabs)/tab1');
    } catch (error) {
      console.error('Error while posting ❌:', error);
    }
  };


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

          <Text style={styles.headerTitle}>Text</Text>

          <TouchableOpacity style={styles.postBtn} onPress={handlePost}>
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
