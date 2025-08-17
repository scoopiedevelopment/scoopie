import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';
import ScreenWrapper from '../components/common/ScreenWrapper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TextCard from '@/components/profile/TextCard';
import { getProfile, getUserClips, getUserPosts, getUserTextPosts } from '@/api/profileService';
import ProfileTop from '@/components/profile/ProfileTop';
import ToggleBtnProfiles from '@/components/profile/ToggleBtnProfiles';
import { Clip, ClipResponse, Post } from '@/models/ProfileModel';
import RenderClip from '@/components/profile/RenderClip';

const { width } = Dimensions.get('window');
const TABS = ['Photos', 'Clips', 'Text'];

export default function ProfileScreen() {
  const [activeTab, setActiveTab] = useState<'Photos' | 'Clips' | 'Text'>('Photos');

  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [clips, setClips] = useState<Clip[]>([]);
  const [clipLoading, setClipLoading] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [postPage, setPostPage] = useState(1);
  const [postLoading, setPostLoading] = useState(false);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();


  const fetchProfileData = async () => {
    try {
      const data = await getProfile();
      setProfileData(data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async (page: number = 1) => {
    if (postLoading || !hasMorePosts) return;
    setPostLoading(true);
    try {
      const response = await getUserPosts(page);

      const newPosts = response.data.post;
      const pagination = response.data.pagination;

      setPosts((prev) => (page === 1 ? newPosts : [...prev, ...newPosts]));
      setHasMorePosts(pagination.hasNext);
      setPostPage(page);
    } catch (error) {
      console.error("Failed to load posts:", error);
    } finally {
      setPostLoading(false);
    }
  };
  const fetchTextPosts = async (page: number = 1) => {
    if (postLoading || !hasMorePosts) return;
    setPostLoading(true);
    try {
      const response = await getUserTextPosts(page);

      const newPosts = response.data.posts;
      const pagination = response.data.pagination;

      setPosts((prev) => (page === 1 ? newPosts : [...prev, ...newPosts]));
      setHasMorePosts(pagination.hasNext);
      setPostPage(page);
    } catch (error) {
      console.error("Failed to load text posts:", error);
    } finally {
      setPostLoading(false);
    }
  };

  const fetchClips = async (page: number = 1) => {
    setClipLoading(true);
    try {
      const response: ClipResponse = await getUserClips(page);
      setClips(response.data.clips);
    } catch (error) {
      console.error("Failed to load clips:", error);
    } finally {
      setClipLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  useEffect(() => {
    if (activeTab === 'Clips') {
      fetchClips();
    } else if (activeTab === 'Photos') {
      fetchPosts(1);
    } else if (activeTab === 'Text') {
      fetchTextPosts(1);
    }
  }, [activeTab]);

  const renderPhoto = ({ item }: { item: Post }) => {
    console.log("item phto", item);

    if (!item.media || item.media.length === 0) {
      return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ color: "grey", fontSize: 18 }}>No Image</Text>
        </View>
      );
    }
    return (
      <View style={styles.postBox}>
        <Image source={{ uri: item.media[0].url }} style={styles.postImage} />
      </View>
    );
  };



  const renderClip = ({ item }: { item: Clip }) => {
    return (
      <RenderClip item={item} />
    );
  };



  return (
    <ScreenWrapper gradient>
      <View style={styles.container}>
        <LinearGradient
          colors={['#FFF7D2', 'rgba(86, 55, 158, 0.4)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity>
            <Feather name="more-vertical" size={22} color="#000" />
          </TouchableOpacity>
        </LinearGradient>
        <ProfileTop profileData={profileData} />
        <ToggleBtnProfiles />

        <View style={styles.tabRow}>
          {TABS.map(tab => (
            <TouchableOpacity key={tab} onPress={() => setActiveTab(tab as any)}>
              <Text style={[styles.tabText, activeTab === tab && styles.activeTab]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'Text' ? (
          <FlatList
            key="text"
            data={posts}
            renderItem={({ item }) => (
              <TextCard
                avatar={item.user?.profilePic}
                name={item.user?.username}
                timeAgo={new Date(item.createdAt).toLocaleDateString()}
                description={item.text}
                views={item.views}
                stars={item._count?.likes}
                comments={item._count?.comments}
                shares={item.shares}
              />
            )}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ paddingBottom: 100, marginTop: 10, paddingHorizontal: 20 }}
            showsVerticalScrollIndicator={false}
            onEndReached={() => {
              if (hasMorePosts && !postLoading) {
                fetchTextPosts(postPage + 1);
              }
            }}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              postLoading ? (
                <ActivityIndicator size="small" color="#7B4DFF" style={{ margin: 10 }} />
              ) : null
            }
            ListEmptyComponent={
              !postLoading ? (
                <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ color: "grey", fontSize: 16 }}>No text posts available</Text>
                </View>
              ) : null
            }

          />
        ) : activeTab === 'Clips' ? (
          clipLoading ? (
            <ActivityIndicator size="large" color="#7B4DFF" style={{ marginTop: 20 }} />
          ) : (
            <FlatList
              key="clips"
              data={clips}
              renderItem={renderClip}
              keyExtractor={(item) => item.id}
              numColumns={3}
              columnWrapperStyle={{ paddingHorizontal: 20, gap: 10 }}
              contentContainerStyle={{ paddingBottom: 100, marginTop: 10 }}
              showsVerticalScrollIndicator={false}
            />
          )
        ) : (
          <FlatList
            key="photos"
            data={posts}
            renderItem={renderPhoto}
            keyExtractor={(item, index) => String(item?.id ?? index)}
            numColumns={3}
            columnWrapperStyle={{ justifyContent: "space-between", paddingHorizontal: 20 }}
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 100, marginTop: 10 }}
            showsVerticalScrollIndicator={false}
            onEndReached={() => {
              if (hasMorePosts && !postLoading) {
                fetchPosts(postPage + 1);
              }
            }}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              postLoading ? (
                <ActivityIndicator size="small" color="#7B4DFF" style={{ margin: 10 }} />
              ) : null
            }
            ListEmptyComponent={
              <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: "grey", fontSize: 16 }}>No data available</Text>
              </View>
            }
          />

        )}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#000' },
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 10,
    gap: 20,
  },
  tabText: { fontSize: 14, color: '#777' },
  activeTab: { color: '#7B4DFF', fontWeight: '600' },
  postBox: {
    width: (width - 60) / 3,
    height: (width - 60) / 3,
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    marginTop: 10
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 140,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    overflow: 'hidden',
  },
  postImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    backgroundColor: 'black'
  },
  playIcon: {
    position: 'absolute',
    top: '40%',
    left: '40%',
  },
});
