import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons, Feather, MaterialIcons } from '@expo/vector-icons';
import { useRouter, useNavigation } from 'expo-router';
import { getSavedItems } from '../../api/savedService';
import VideoPreview from '../../components/common/VideoPreview';

const { width } = Dimensions.get('window');
const GRID_SPACING = 2;
const NUM_COLUMNS = 3;
const ITEM_SIZE = (width - (GRID_SPACING * (NUM_COLUMNS + 1))) / NUM_COLUMNS;

interface Media {
  id: string;
  postId: string;
  type: 'Image' | 'Video' | 'Clip';
  url: string;
  createdAt: string;
}

interface User {
  id: string;
  username: string;
  profilePic?: string;
}

interface Post {
  id: string;
  userId: string;
  text?: string;
  visibility: 'Public' | 'Private' | 'Archive';
  views: number;
  shares: number;
  createdAt: string;
  updatedAt: string;
  media: Media[];
  user: User;
}

interface Clip {
  id: string;
  userId: string;
  video: string;
  text?: string;
  visibility: 'Public' | 'Private' | 'Archive';
  views: number;
  shares: number;
  createdAt: string;
  updatedAt: string;
  user: User;
}

interface SavedItem {
  createdAt: string;
  post?: Post;
  clip?: Clip;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface ApiResponse {
  success: boolean;
  statusCode: number;
  request: {
    ip: string;
    method: string;
    url: string;
  };
  message: string;
  data: SavedItem[] | {
    saved: SavedItem[];
    pagination: Pagination;
  };
}

export default function SavedPage() {
  const router = useRouter();
  const navigation = useNavigation();
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [pagination, setPagination] = useState<Pagination | null>(null);

  // Hide the default header
  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const fetchSavedItems = useCallback(async (page: number = 1, isRefresh: boolean = false) => {
    try {
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const response = await getSavedItems(page);
      
      if (response.success) {
        // The API returns data directly as an array
        const newItems = response.data || [];
        const paginationData = null; // No pagination info from API

        // Check if we have no data or empty array
        if (!newItems || newItems.length === 0) {
          setHasMore(false);
          if (page === 1) {
            setSavedItems([]);
          }
          return;
        }

        if (isRefresh || page === 1) {
          setSavedItems(newItems);
        } else {
          setSavedItems(prev => [...prev, ...newItems]);
        }

        setPagination(paginationData);
        
        // Stop pagination if:
        // 1. hasNext is false
        // 2. No pagination data available
        // 3. We received fewer items than expected (indicating end of data)
        const shouldStopPagination = newItems.length === 0 || !paginationData;
        
        setHasMore(!shouldStopPagination);
        setCurrentPage(page);
      } else {
        Alert.alert('Error', response.message || 'Failed to fetch saved items');
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error fetching saved items:', error);
      Alert.alert('Error', 'Failed to load saved items. Please try again.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchSavedItems(1);
  }, [fetchSavedItems]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Reset pagination state
    setHasMore(true);
    setCurrentPage(1);
    await fetchSavedItems(1, true);
    setRefreshing(false);
  }, [fetchSavedItems]);

  const loadMore = useCallback(() => {
    // Only load more if:
    // 1. Not currently loading more
    // 2. Has more data available
    // 3. Not in initial loading state
    if (!loadingMore && hasMore && !loading) {
      fetchSavedItems(currentPage + 1);
    }
  }, [loadingMore, hasMore, currentPage, fetchSavedItems, loading]);

  const handleItemPress = useCallback((item: SavedItem) => {
    if (item.post) {
      // Navigate to a full-screen post viewer
      router.push({
        pathname: '/post-detail',
        params: { 
          postId: item.post.id,
          postData: JSON.stringify(item.post)
        }
      } as any);
    } else if (item.clip) {
      // Navigate to a full-screen clip viewer
      router.push({
        pathname: '/clip-detail',
        params: { 
          clipId: item.clip.id,
          clipData: JSON.stringify(item.clip)
        }
      } as any);
    }
  }, [router]);

  const renderSavedItem = useCallback(({ item }: { item: SavedItem }) => {
    const content = item.post || item.clip;
    
    if (!content) {
      return <View style={styles.gridItem} />;
    }

    const isVideo = !!item.clip;
    const isMultiImage = (item.post?.media?.length || 0) > 1;
    
    // Get the appropriate media URL
    const mediaUrl = isVideo 
      ? item.clip?.video 
      : item.post?.media?.[0]?.url;

    return (
      <TouchableOpacity 
        style={styles.gridItem} 
        onPress={() => handleItemPress(item)}
        activeOpacity={0.8}
      >
        {isVideo ? (
          <VideoPreview uri={mediaUrl || ''} />
        ) : (
          <Image 
            source={{ uri: mediaUrl || 'https://via.placeholder.com/150' }} 
            style={styles.image}
            resizeMode="cover"
          />
        )}
        
        {/* Video play icon */}
        {isVideo && (
          <View style={styles.playIconOverlay}>
            <Feather name="play" size={16} color="white" />
          </View>
        )}
        
        {/* Multiple images indicator */}
        {isMultiImage && (
          <View style={styles.multiImageOverlay}>
            <MaterialIcons name="collections" size={12} color="white" />
          </View>
        )}

        {/* Content type indicator */}
        <View style={styles.typeIndicator}>
          <Text style={styles.typeText}>
            {isVideo ? 'VIDEO' : 'POST'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }, [handleItemPress]);

  const renderListFooter = useCallback(() => {
    if (loadingMore) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color="#7B4DFF" />
          <Text style={styles.loadingText}>Loading more...</Text>
        </View>
      );
    }
    
    // Show "No more data" message if we have items but no more to load
    if (savedItems.length > 0 && !hasMore) {
      return (
        <View style={styles.noMoreDataContainer}>
          <Text style={styles.noMoreDataText}>No more saved items</Text>
        </View>
      );
    }
    
    return null;
  }, [loadingMore, savedItems.length, hasMore]);

  const renderEmptyState = useCallback(() => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Feather name="bookmark" size={72} color="#7B4DFF" />
      </View>
      <Text style={styles.emptyTitle}>No Saved Items</Text>
      <Text style={styles.emptySubtitle}>
        Items you save will appear here.{'\n'}
        Tap the bookmark icon on any post or video to save it.
      </Text>
      <TouchableOpacity 
        style={styles.exploreButton}
        onPress={() => router.push('/(tabs)/tab1')}
      >
        <Text style={styles.exploreButtonText}>Explore Content</Text>
      </TouchableOpacity>
    </View>
  ), [router]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#7B4DFF" />
        <Text style={styles.loadingText}>Loading saved items...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved</Text>
        <TouchableOpacity style={styles.menuButton}>
          <Ionicons name="ellipsis-horizontal" size={24} color="#1a1a1a" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      {savedItems.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={savedItems}
          renderItem={renderSavedItem}
          keyExtractor={(item, index) => 
            item.post?.id || item.clip?.id || `saved-${index}`
          }
          numColumns={NUM_COLUMNS}
          contentContainerStyle={styles.listContainer}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={renderListFooter}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#7B4DFF']}
              tintColor="#7B4DFF"
              title="Pull to refresh"
              titleColor="#666666"
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingTop: 50,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  emptyTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 18,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 40,
    fontWeight: '400',
  },
  exploreButton: {
    backgroundColor: '#7B4DFF',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 30,
    shadowColor: '#7B4DFF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  exploreButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  listContainer: {
    padding: 2,
    paddingBottom: 20,
  },
  gridItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    margin: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f8f9fa',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f3f4',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  playIconOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -15 }, { translateY: -15 }],
    width: 30,
    height: 30,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  multiImageOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  typeIndicator: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  typeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 30,
  },
  noMoreDataContainer: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  noMoreDataText: {
    fontSize: 16,
    color: '#999999',
    fontStyle: 'italic',
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  menuButton: {
    padding: 8,
    marginRight: -8,
  },
});