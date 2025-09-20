
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Alert, ViewToken } from "react-native";
import { useFocusEffect } from '@react-navigation/native';
import {
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  ActivityIndicator,
} from 'react-native';

import PostCard from '../../components/home/PostCard';
import Header from '../../components/home/Header';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import { getAddedFeeds, getPostFeeds } from '@/api/feedService';
import { PostFeed } from '@/models/PostfeedModel';
import { UserStory } from '@/models/StoryModel';
import { getStories } from '@/api/storyService';
import StoryViewer from '../storyViewer';
import apiClient from '@/api/apiClient';

const screenWidth = Dimensions.get('window').width;
const CARD_WIDTH = screenWidth / 2 - 20;

export default function HomeScreen() {
  const [feedData, setFeedData] = useState<PostFeed[]>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'hot' | 'added'>('hot');
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);

  const [storyPage, setStoryPage] = useState<number>(1);
  const [storyHasMore, setStoryHasMore] = useState<boolean>(true);
  const [stories, setStories] = useState<UserStory[]>([]);

  // 🔹 Track already viewed post IDs so same post ka API bar-bar na hit ho
  const viewedIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    loadData(1, true);
    loadStories(1);
  }, [activeTab]);

  // Refresh stories when screen comes into focus (e.g., after creating a story)
  useFocusEffect(
    useCallback(() => {
      console.log('Home screen focused, refreshing stories...');
      loadStories(1);
    }, [])
  );

  const loadData = async (pageNumber: number, isRefreshing = false) => {
    if (pageNumber === 1 && !isRefreshing && loading) return;

    if (isRefreshing) {
      setRefreshing(true);
      setHasMore(true);
    } else if (pageNumber === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const response =
        activeTab === 'hot'
          ? await getPostFeeds(pageNumber)
          : await getAddedFeeds(pageNumber);

      const newData = response?.data || [];

      if (pageNumber === 1) {
        setFeedData(newData);
      } else {
        setFeedData((prev) => [...prev, ...newData]);
      }

      if (newData.length === 0) {
        setHasMore(false);
      }

      setPage(pageNumber);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore && !loading) {
      loadData(page + 1);
    }
  };

  const loadStories = async (pageNumber: number) => {
    try {
      const res = await getStories(pageNumber);
      
      if (res?.success) {
        // Server now returns raw stories array, need to group them by user
        const rawStories = res.data || [];
        
        // Group stories by user
        const userStoriesMap = new Map();
        rawStories.forEach((story: any) => {
          const userId = story.userId;
          if (!userStoriesMap.has(userId)) {
            userStoriesMap.set(userId, {
              userId: story.user?.userId || story.userId,
              username: story.user?.username || 'Unknown',
              profilePic: story.user?.profilePic || null,
              stories: []
            });
          }
          userStoriesMap.get(userId).stories.push({
            id: story.id,
            userId: story.userId,
            mediaUrl: story.mediaUrl,
            mediaType: story.mediaType,
            createdAt: story.createdAt,
            expiresAt: story.expiresAt,
          });
        });
        
        const userStories = Array.from(userStoriesMap.values());
        
        if (pageNumber === 1) {
          setStories(userStories);
        } else {
          setStories((prev) => [...prev, ...userStories]);
        }
        
        // Simple pagination logic - if we got fewer stories than expected, no more pages
        setStoryHasMore(rawStories.length >= 20);
        setStoryPage(pageNumber + 1);
      } else {
        setStoryHasMore(false);
      }
    } catch (error: any) {
      // Handle specific error types
      if (error.message?.includes('Network connection failed')) {
        Alert.alert(
          'Connection Error', 
          'Please check your internet connection and try again.',
          [{ text: 'OK' }]
        );
      } else if (error.message?.includes('Authentication failed')) {
        Alert.alert(
          'Authentication Error', 
          'Please login again to continue.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Error', 
          error.message || 'Failed to load stories. Please try again.',
          [{ text: 'OK' }]
        );
      }
      setStoryHasMore(false);
    }
  };

  const onRefresh = () => {
    loadData(1, true);
  };

  // 🔹 API call jab user post scroll karke dekh le
  const sendViewApi = async (postId: string) => {
    try {
      await apiClient.post(`/count/post/${postId}`);
      // console.log("✅ View counted for:", prostId);
    } catch (err) {
      console.log("❌ Error sending view:", err);
    }
  };

  // 🔹 Jab FlatList me ek post visible ho jaye
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      viewableItems.forEach((viewable) => {
        const postId = (viewable.item as PostFeed).id;
        if (postId && !viewedIds.current.has(postId)) {
          viewedIds.current.add(postId);
          sendViewApi(postId);
        }
      });
    },
    []
  );

  // 🔹 ViewabilityConfig set kiya - kam se kam 50% visible hoga tab trigger karega
  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  };

  const renderSkeleton = () => (
    <>
      {[1, 2].map((_, row) => (
        <View key={row} style={styles.cardSkeletonRow}>
          <View style={[styles.cardSkeleton, { height: 240, width: '100%' }]} />
          <View style={[styles.cardSkeleton, { height: 240, width: '100%' }]} />
        </View>
      ))}
    </>
  );

  const renderPostCard = ({ item }: { item: PostFeed }) => (
    <PostCard post={item} />
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return <ActivityIndicator size="small" color="purple" style={{ margin: 10 }} />;
  };

  const renderContent = () => {
    if (loading) return renderSkeleton();

    return (
      <FlatList
        data={feedData}
        keyExtractor={(item) => item.id}
        renderItem={renderPostCard}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: 60,
          justifyContent: feedData?.length === 0 ? 'center' : 'flex-start',
        }}
        ListEmptyComponent={
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: 'black', fontSize: 18 }}>No Feed Available</Text>
          </View>
        }
        // 🔹 Scroll detection
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />
    );
  };

  const renderHeader = () => {
    return <>
      <Header />
      <StoryViewer />
    </>

  };

  return (
    <ScreenWrapper gradient>
      <View style={styles.container}>
        {renderHeader()}
        <View style={styles.tabContainer}>
          {['hot', 'added'].map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab as 'hot' | 'added')}
              style={styles.tabButton}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTab]}>
                {tab === 'hot' ?
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <Image
                      source={require('../../assets/icons/hotIcon.png')}
                      style={{ width: 24, height: 24 }}
                    />
                    <Text>Hot</Text>
                  </View> : <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <Image
                      source={require('../../assets/icons/addedIcon.png')}
                      style={{ width: 24, height: 24 }}
                    />
                    <Text>Added</Text>
                  </View>}
              </Text>
              {activeTab === tab && <View style={styles.underline} />}
            </TouchableOpacity>
          ))}
        </View>

        {renderContent()}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#F2F2F2', flex: 1, marginBottom: -50 },
  icon: { marginRight: 12 },
  storyWrapper: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  storyList: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  storyItem: {
    alignItems: 'center',
    marginRight: 16,
    position: 'relative',
    width: 70,
  },
  storyAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 6,
    backgroundColor: '#f8f9fa',
    borderWidth: 3,
    borderColor: '#7B4DFF',
  },
  storyName: {
    fontSize: 11,
    color: '#495057',
    fontWeight: '600',
    textAlign: 'center',
    maxWidth: 70,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingTop: 6,
    paddingBottom: 10,
    paddingHorizontal: 16,
    gap: 24,
    backgroundColor: 'white',
    marginBottom: 16
  },
  tabButton: {
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'black',
  },
  activeTab: {
    color: '#000',
  },
  underline: {
    marginTop: 4,
    height: 2,
    width: '100%',
    backgroundColor: '#8e44ad',
    borderRadius: 2,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    paddingLeft: 4,
  },
  avatarLarge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 8,
    backgroundColor: '#eee'
  },
  usernameLarge: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
  },
  card: {
    backgroundColor: '#fff',
    width: CARD_WIDTH,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  cardImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover'
  },
  playIconOverlay: {
    position: 'absolute',
    top: 50,
    left: '42%',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 6,
  },
  playIcon: {
    color: '#fff',
    fontSize: 20,
  },
  textCard: {
    height: 'auto'
  },
  textContent: {
    fontSize: 14,
    color: '#333',
    margin: 8
  },
  cardSkeletonRow: {
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginBottom: 12,
    gap: 10
  },
  cardSkeleton: {
    backgroundColor: '#E0E0E0',
    borderRadius: 12,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    flexDirection: 'column'
  },
});

