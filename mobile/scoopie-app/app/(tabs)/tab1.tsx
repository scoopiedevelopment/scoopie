import React, { useEffect, useState, } from 'react';
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
  useEffect(() => {
    loadData(1, true);
    loadStories(1);
  }, [activeTab]);

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
      if (res?.data?.stories) {
        if (pageNumber === 1) {
          setStories(res.data.stories);
        } else {
          setStories((prev) => [...prev, ...res.data.stories]);
        }
        setStoryHasMore(res.data.pagination.hasNext);
        setStoryPage(pageNumber);
      }
    } catch (error) {
      console.error('Error fetching stories:', error);
    }
  };

  const onRefresh = () => {
    loadData(1, true);
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
            <TouchableOpacity key={tab} onPress={() => setActiveTab(tab as 'hot' | 'added')} style={styles.tabButton}>
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
    paddingBottom: 10,
    backgroundColor: '#eee',
  },
  storyList: {
    paddingVertical: 16,
    paddingLeft: 12,
  },
  storyItem: {
    alignItems: 'center',
    marginRight: 16,
  },
  storyAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    marginBottom: 4,
    backgroundColor: '#eee'
  },
  storyName: {
    fontSize: 12,
    color: '#444',
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

