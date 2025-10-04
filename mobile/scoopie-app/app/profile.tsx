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
import SettingsModal from '@/components/common/SettingsModal';

const { width } = Dimensions.get('window');
const TABS = ['Photos', 'Clips', 'Text'];
const numColumns = 3;
const spacing = 10; // gap between items
const containerPadding = 20; // left + right padding
const postWidth = (width - containerPadding * 2 - spacing * (numColumns - 1)) / numColumns;

export default function ProfileScreen() {
  const [activeTab, setActiveTab] = useState<'Photos' | 'Clips' | 'Text'>('Photos');

  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [clips, setClips] = useState<Clip[]>([]);
  const [clipLoading, setClipLoading] = useState(false);
  const [clipPage, setClipPage] = useState(1);
  const [hasMoreClips, setHasMoreClips] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [postPage, setPostPage] = useState(1);
  const [postLoading, setPostLoading] = useState(false);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();


  const [textPosts, setTextPosts] = useState<Post[]>([]);
  const [textPage, setTextPage] = useState(1);
  const [textLoading, setTextLoading] = useState(false);
  const [hasMoreTextPosts, setHasMoreTextPosts] = useState(true);
  const [settingsVisible, setSettingsVisible] = useState(false);

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

  const fetchPosts = async (page: number = 1, isRefresh: boolean = false) => {
    if (postLoading && !isRefresh) return;
    setPostLoading(true);
    try {
      const response = await getUserPosts(page);
      const newPosts = response.data.post || [];
      const pagination = response.data.pagination;

      // Filter out posts with null or invalid media URLs
      const validPosts = newPosts.filter(post => 
        post.media && 
        post.media.length > 0 && 
        post.media.some(media => 
          media.url && 
          media.url.trim() !== '' && 
          media.url !== 'null' &&
          media.url.startsWith('http')
        )
      );

      setHasMorePosts(pagination.hasNext);
      
      if (isRefresh) {
        setPosts(validPosts);
        setPostPage(1);
      } else {
        setPosts(prev => [...prev, ...validPosts]);
      }
      
      setPostPage(page);
    } catch (error) {
      console.error('Failed to load posts:', error);
    } finally {
      setPostLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  };

  const fetchTextPosts = async (page: number = 1) => {
    if (textLoading || !hasMoreTextPosts) return;
    setTextLoading(true);
    try {
      const response = await getUserTextPosts(page);
      const newPosts = response.data.posts;
      const pagination = response.data.pagination;

      setTextPosts((prev) => (page === 1 ? newPosts : [...prev, ...newPosts]));
      setHasMoreTextPosts(pagination.hasNext);
      setTextPage(page);
    } catch (error) {
      console.error('Failed to load text posts:', error);
    } finally {
      setTextLoading(false);
    }
  };

  const fetchClips = async (page: number = 1, isRefresh: boolean = false) => {
    if (clipLoading && !isRefresh) return;
    setClipLoading(true);
    try {
      const response: ClipResponse = await getUserClips(page);
      const newClips = response.data.clips || [];
      const pagination = response.data.pagination;
      
      // Filter out clips with null or invalid video URLs
      const validClips = newClips.filter(clip => 
        clip.video && 
        clip.video.trim() !== '' && 
        clip.video !== 'null' &&
        clip.video.startsWith('http')
      );
      
      setHasMoreClips(pagination.hasNext);
      
      if (isRefresh) {
        setClips(validClips);
        setClipPage(1);
      } else {
        setClips(prev => [...prev, ...validClips]);
      }
      
      setClipPage(page);
    } catch (error) {
      console.error('Failed to load clips:', error);
    } finally {
      setClipLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  useEffect(() => {
    if (activeTab === 'Clips' && clips.length === 0) {
      fetchClips(1, true);
    } else if (activeTab === 'Photos' && posts.length === 0) {
      fetchPosts(1, true);
    } else if (activeTab === 'Text' && textPosts.length === 0) {
      fetchTextPosts(1);
    }
  }, [activeTab]);

  const onRefresh = () => {
    setRefreshing(true);
    if (activeTab === 'Clips') {
      fetchClips(1, true);
    } else if (activeTab === 'Photos') {
      fetchPosts(1, true);
    } else if (activeTab === 'Text') {
      fetchTextPosts(1);
    }
  };

  const onEndReached = () => {
    if (activeTab === 'Clips' && hasMoreClips && !clipLoading) {
      fetchClips(clipPage + 1, false);
    } else if (activeTab === 'Photos' && hasMorePosts && !postLoading) {
      fetchPosts(postPage + 1, false);
    } else if (activeTab === 'Text' && hasMoreTextPosts && !textLoading) {
      fetchTextPosts(textPage + 1);
    }
  };
const renderPhoto = ({ item }: { item: Post }) => {
  if (!item?.media || item.media.length === 0) return null;

  return (
    <View style={[styles.postBox, { width: postWidth, height: postWidth }]}>
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
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.refreshBtn} 
              onPress={onRefresh}
              disabled={refreshing}
            >
              <Ionicons 
                name="refresh" 
                size={20} 
                color={refreshing ? "#999" : "#000"} 
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSettingsVisible(true)}>
              <Feather name="more-vertical" size={22} color="#000" />
            </TouchableOpacity>
          </View>
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
            data={textPosts}
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
            refreshing={refreshing}
            onRefresh={onRefresh}
            onEndReached={onEndReached}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              textLoading && !refreshing ? (
                <ActivityIndicator size="small" color="#7B4DFF" style={{ margin: 10 }} />
              ) : null
            }
            ListEmptyComponent={
              !textLoading ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 50 }}>
                  <Text style={{ color: 'grey', fontSize: 16 }}>No text posts available</Text>
                </View>
              ) : null
            }
          />
        )
          : activeTab === 'Clips' ? (
            <FlatList
              key="clips"
              data={clips}
              renderItem={renderClip}
              keyExtractor={(item) => item.id}
              numColumns={3}
              columnWrapperStyle={{ paddingHorizontal: 20, gap: 10 }}
              contentContainerStyle={{ paddingBottom: 100, marginTop: 10 }}
              showsVerticalScrollIndicator={false}
              refreshing={refreshing}
              onRefresh={onRefresh}
              onEndReached={onEndReached}
              onEndReachedThreshold={0.5}
              ListFooterComponent={
                clipLoading && !refreshing ? (
                  <ActivityIndicator size="small" color="#7B4DFF" style={{ margin: 10 }} />
                ) : null
              }
              ListEmptyComponent={
                !clipLoading ? (
                  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 50 }}>
                    <Text style={{ color: 'grey', fontSize: 16 }}>No clips available</Text>
                  </View>
                ) : null
              }
            />
          ) : (
            <FlatList
              key="photos"
              data={posts}
              renderItem={renderPhoto}
              keyExtractor={(item, index) => String(item?.id ?? index)}
              numColumns={3}
              columnWrapperStyle={{ paddingHorizontal: 20 }}
              contentContainerStyle={{ flexGrow: 1, paddingBottom: 100, marginTop: 10 }}
              showsVerticalScrollIndicator={false}
              refreshing={refreshing}
              onRefresh={onRefresh}
              onEndReached={onEndReached}
              onEndReachedThreshold={0.5}
              ListFooterComponent={
                postLoading && !refreshing ? (
                  <ActivityIndicator size="small" color="#7B4DFF" style={{ margin: 10 }} />
                ) : null
              }
              ListEmptyComponent={
                !postLoading ? (
                  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 50 }}>
                    <Text style={{ color: 'grey', fontSize: 16 }}>No photos available</Text>
                  </View>
                ) : null
              }
            />
          )}
      </View>
      
      <SettingsModal 
        visible={settingsVisible} 
        onClose={() => setSettingsVisible(false)} 
      />
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
    marginTop: 10,
    marginHorizontal:5
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
    backgroundColor: '#eee'
  },
  playIcon: {
    position: 'absolute',
    top: '40%',
    left: '40%',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  refreshBtn: {
    padding: 4,
  },
});
