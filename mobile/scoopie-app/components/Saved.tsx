import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSaved } from '../contexts/SavedContext';
import { getSavedItems } from '../api/savedService';

const { width } = Dimensions.get('window');
const GRID_SPACING = 4;
const NUM_COLUMNS = 3;
const ITEM_SIZE = (width - (GRID_SPACING * (NUM_COLUMNS + 1))) / NUM_COLUMNS;

export default function SavedPage() {
  const router = useRouter();
  const { savedItems, refreshSavedItems, loading } = useSaved();
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [allSavedItems, setAllSavedItems] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    refreshSavedItems();
    fetchSavedItems(1);
  }, [refreshSavedItems]);

  // Update local list when context items change
  useEffect(() => {
    if (page === 1) {
      setAllSavedItems(savedItems || []);
    }
  }, [savedItems, page]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshSavedItems();
    setPage(1);
    setHasMore(true);
    setRefreshing(false);
  };

  const fetchSavedItems = async (pageNum = 1) => {
    if (loadingMore) return;
    
    if (pageNum === 1) {
      // First page is handled by context
      return;
    }
    
    setLoadingMore(true);

    try {
      const response = await getSavedItems(pageNum);
      const newItems = response?.data?.saved || [];
      const pagination = response?.data?.pagination;

      setAllSavedItems(prev => [...prev, ...newItems]);
      setHasMore(pagination?.hasNext ?? false);
      setPage(pageNum);
    } catch (error) {
      console.error('Failed to fetch saved items:', error);
    } finally {
      setLoadingMore(false);
    }
  };
  
  const handleItemPress = (item) => {
    const { post, clip } = item;
    if (clip?.id) {
        // Navigate to the specific clip page
        router.push(`/clips/${clip.id}`);
    } else if (post?.id) {
        // Navigate to the specific post page
        router.push(`/posts/${post.id}`);
    }
  };

  const renderSavedItem = ({ item }) => {
    const content = item.post || item.clip;
    if (!content) return <View style={styles.gridItem} />;

    const isVideo = !!item.clip;
    const isMultiImage = item.post?.media?.length > 1;
    
    // For clips, use the video URL as thumbnail (will show first frame)
    // For posts, use the first media item
    const imageUrl = isVideo ? content.video : content.media?.[0]?.url;

    return (
      <TouchableOpacity style={styles.gridItem} onPress={() => handleItemPress(item)}>
        <Image 
          source={{ uri: imageUrl || 'https://via.placeholder.com/150' }} 
          style={styles.image}
        />
        {isVideo && (
            <View style={styles.iconOverlay}>
                <Feather name="play" size={20} color="white" />
            </View>
        )}
        {isMultiImage && (
            <View style={[styles.iconOverlay, { 
              top: 8, 
              right: 8, 
              left: 'auto', 
              transform: [],
              width: 20,
              height: 20,
              borderRadius: 10
            }]}>
                <Ionicons name="layers" size={12} color="white" />
            </View>
        )}
      </TouchableOpacity>
    );
  };
  
  const renderListFooter = () => {
      if (!loadingMore) return null;
      return <ActivityIndicator size="small" color="#7B4DFF" style={{ marginVertical: 20 }} />;
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#7B4DFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="black" />
        </TouchableOpacity>
        <Text style={styles.title}>Saved</Text>
        <View style={{ width: 30 }} /> 
      </View>

      {(!allSavedItems || allSavedItems.length === 0) ? (
        <View style={styles.centered}>
          <Feather name="bookmark" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>No Saved Items</Text>
          <Text style={styles.emptySubtitle}>Items you save will appear here.</Text>
        </View>
      ) : (
        <FlatList
          data={allSavedItems || []}
          renderItem={renderSavedItem}
          keyExtractor={(item) => item.id}
          numColumns={NUM_COLUMNS}
          contentContainerStyle={styles.listContainer}
          onEndReached={() => {
              if(hasMore) fetchSavedItems(page + 1)
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderListFooter}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#7B4DFF']}
              tintColor="#7B4DFF"
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    paddingTop: 50, // SafeArea
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  backButton: {},
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 20,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
  },
  // Grid Styles
  listContainer: {
    paddingHorizontal: GRID_SPACING,
  },
  gridItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    padding: GRID_SPACING,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 8, // Softer corners
    backgroundColor: '#eee',
  },
  iconOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -10 }, { translateY: -10 }],
    width: 28,
    height: 28,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  }
});