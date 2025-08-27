import React, { useEffect, useRef, useState } from 'react';
import {
  SafeAreaView,
  StatusBar,
  FlatList,
  View,
  Dimensions,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TextInput
} from 'react-native';
import { router } from 'expo-router';
import { Video } from 'expo-av';
import { Feather, FontAwesome, Ionicons } from '@expo/vector-icons';
import { getClipsFeed, toggleLikeClip, getComments, createComment } from '@/api/clipService';
import { toggleSaveClip } from '@/api/savedService';
import { shareVideo } from '@/utils/functions';
import CommentModal from '@/components/CommentModal';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { height, width } = Dimensions.get('window');
const shortText = (txt, len) => (txt?.length > len ? txt?.slice(0, len) + '...' : txt);
const iconSize = 32, iconColor = 'white';

const ReelsScreen = () => {
  const videoRefs = useRef([]);
  const [clips, setClips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [likedClips, setLikedClips] = useState(new Set());
  const [savedClips, setSavedClips] = useState(new Set());
  const [likeCounts, setLikeCounts] = useState({});
  const [isCommentModalVisible, setIsCommentModalVisible] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [videoComments, setVideoComments] = useState([]);
  const [selectedClipId, setSelectedClipId] = useState(null);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isOptionsModalVisible, setIsOptionsModalVisible] = useState(false);
  const [isTogglingSave, setIsTogglingSave] = useState(false);
  const [isTogglingLike, setIsTogglingLike] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsPage, setCommentsPage] = useState(1);
  const [commentsHasMore, setCommentsHasMore] = useState(true);

  useEffect(() => {
    fetchClips(1);
  }, []);

  const initializeCounts = (clipsData) => {
    const counts = {};
    clipsData.forEach(clip => {
      counts[clip.id] = clip._count?.likes || 0;
    });
    setLikeCounts(counts);
  };

  const fetchClips = async (pageNum = 1) => {
    if (loadingMore && pageNum > 1) return;
    
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const response = await getClipsFeed(pageNum);
      if (response.success) {
        const newClips = response.data;
        if (pageNum === 1) {
          setClips(newClips);
          initializeCounts(newClips);
        } else {
          setClips(prev => {
            const updated = [...prev, ...newClips];
            initializeCounts(newClips);
            return updated;
          });
        }
        setHasMore(newClips.length === 20);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Error fetching clips:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchClips(1);
    setRefreshing(false);
  };

  const handleLike = async (clipId) => {
    if (isTogglingLike) return;
    
    setIsTogglingLike(true);
    const wasLiked = likedClips.has(clipId);
    const currentCount = likeCounts[clipId] || 0;
    
    // Optimistic update
    if (wasLiked) {
      setLikedClips(prev => {
        const newSet = new Set(prev);
        newSet.delete(clipId);
        return newSet;
      });
      setLikeCounts(prev => ({ ...prev, [clipId]: Math.max(0, currentCount - 1) }));
    } else {
      setLikedClips(prev => new Set(prev).add(clipId));
      setLikeCounts(prev => ({ ...prev, [clipId]: currentCount + 1 }));
    }
    
    try {
      const clip = clips.find(c => c.id === clipId);
      const likedTo = clip?.user?.userId || clip?.userId || '';
      await toggleLikeClip(clipId, likedTo);
    } catch (error) {
      // Revert on error
      if (wasLiked) {
        setLikedClips(prev => new Set(prev).add(clipId));
        setLikeCounts(prev => ({ ...prev, [clipId]: currentCount }));
      } else {
        setLikedClips(prev => {
          const newSet = new Set(prev);
          newSet.delete(clipId);
          return newSet;
        });
        setLikeCounts(prev => ({ ...prev, [clipId]: currentCount }));
      }
      console.error('Error toggling like:', error);
    } finally {
      setIsTogglingLike(false);
    }
  };

  const handleBookmark = async (clipId) => {
    if (isTogglingSave) return;
    
    setIsTogglingSave(true);
    const wasSaved = savedClips.has(clipId);
    
    // Optimistic update
    if (wasSaved) {
      setSavedClips(prev => {
        const newSet = new Set(prev);
        newSet.delete(clipId);
        return newSet;
      });
    } else {
      setSavedClips(prev => new Set(prev).add(clipId));
    }
    
    try {
      const response = await toggleSaveClip(clipId);
      // Update based on server response
      if (response.success) {
        if (response.data.saved) {
          setSavedClips(prev => new Set(prev).add(clipId));
        } else {
          setSavedClips(prev => {
            const newSet = new Set(prev);
            newSet.delete(clipId);
            return newSet;
          });
        }
      }
    } catch (error) {
      // Revert on error
      if (wasSaved) {
        setSavedClips(prev => new Set(prev).add(clipId));
      } else {
        setSavedClips(prev => {
          const newSet = new Set(prev);
          newSet.delete(clipId);
          return newSet;
        });
      }
      console.error('Error toggling save clip:', error);
    } finally {
      setIsTogglingSave(false);
    }
  };

  const showCommentModal = async (clipId) => {
    setSelectedClipId(clipId);
    setVideoComments([]);
    setCommentsPage(1);
    setCommentsHasMore(true);
    setIsCommentModalVisible(true);
    await loadComments(clipId, 1, true);
  };

  const loadComments = async (clipId, pageNum, replace = false) => {
    if (commentsLoading) return;
    
    try {
      setCommentsLoading(true);
      const response = await getComments(clipId, pageNum);
      if (response.success) {
        const newComments = Array.isArray(response.data) ? response.data : [];
        if (replace) {
          setVideoComments(newComments);
        } else {
          setVideoComments(prev => [...prev, ...newComments]);
        }
        setCommentsHasMore(newComments.length > 0);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleComment = async () => {
    if (!selectedClipId || commentText.trim() === '') return;
    
    const text = commentText.trim();
    setCommentText('');
    
    // Optimistic update
    const optimisticComment = {
      id: `temp-${Date.now()}`,
      text,
      createdAt: new Date().toISOString(),
      user: { username: 'You' }
    };
    setVideoComments(prev => [optimisticComment, ...prev]);
    
    try {
      await createComment(selectedClipId, text);
    } catch (error) {
      // Remove optimistic comment on error
      setVideoComments(prev => prev.filter(c => c.id !== optimisticComment.id));
      console.error('Error posting comment:', error);
    }
  };

  const loadMoreComments = async () => {
    if (!selectedClipId || !commentsHasMore || commentsLoading) return;
    const nextPage = commentsPage + 1;
    setCommentsPage(nextPage);
    await loadComments(selectedClipId, nextPage);
  };

  const handleViewableItemsChanged = ({ viewableItems }) => {
    if (viewableItems.length > 0) {
      const index = viewableItems[0].index;
      setCurrentVideoIndex(index);
      videoRefs.current.forEach((video, i) => {
        if (i === index) {
          video?.playAsync();
        } else {
          video?.stopAsync();
        }
      });
    }
  };

  const viewabilityConfig = { itemVisiblePercentThreshold: 80 };

  const renderItem = ({ item, index }) => (
    <View key={index} style={{ height, width, backgroundColor: 'black' }}>
      {/* Video - keeps aspect ratio */}
      <Video
        style={StyleSheet.absoluteFillObject}
        ref={(ref) => { videoRefs.current[index] = ref; }}
        isMuted
        source={{ uri: item?.video }}
        shouldPlay={index === currentVideoIndex}
        resizeMode="contain"
        isLooping
      />

      {/* OVERLAY UI */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.7}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={22} color="white" />
          </TouchableOpacity>
          <Text style={styles.title}>Clips</Text>
          <TouchableOpacity onPress={() => setIsOptionsModalVisible(true)}>
            <Ionicons name="ellipsis-vertical" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Title & description */}
        <View style={styles.bottomInfo}>
          <Text style={styles.videoTitle}>@{item?.user?.username}</Text>
          <Text style={styles.videoDesc}>{shortText(item?.text, 60)}</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          {/* Like */}
          <TouchableOpacity onPress={() => handleLike(item.id)} style={{ alignItems: 'center' }} disabled={isTogglingLike}>
            {likedClips.has(item.id) ? (
              <FontAwesome name="heart" color="#ff3040" size={iconSize} />
            ) : (
              <FontAwesome name="heart-o" color={iconColor} size={iconSize} />
            )}
            <Text style={styles.actionText}>{likeCounts[item.id] || item?._count?.likes || 0}</Text>
          </TouchableOpacity>

          {/* Comments */}
          <TouchableOpacity onPress={() => showCommentModal(item.id)} style={{ alignItems: 'center' }}>
            <Ionicons name="chatbubble-outline" color={iconColor} size={iconSize} />
            <Text style={styles.actionText}>{item?._count?.comments || 0}</Text>
          </TouchableOpacity>

          {/* Save */}
          <TouchableOpacity onPress={() => handleBookmark(item.id)} style={{ alignItems: 'center' }} disabled={isTogglingSave}>
            <Feather 
              name="bookmark" 
              color={savedClips.has(item.id) ? '#7B4DFF' : iconColor} 
              size={iconSize} 
            />
            <Text style={styles.actionText}>
              {savedClips.has(item.id) ? 'Saved' : ''}
            </Text>
          </TouchableOpacity>

          {/* Share */}
          <TouchableOpacity onPress={() => shareVideo(item?.video)} style={{ alignItems: 'center' }}>
            <Ionicons name="share-social-outline" color={iconColor} size={iconSize} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Comment Modal */}
      <Modal
        visible={isCommentModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsCommentModalVisible(false)}
      >
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} onPress={() => setIsCommentModalVisible(false)} />
        <View style={{
          backgroundColor: 'white',
          maxHeight: height * 0.6,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 8,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ fontWeight: '700', fontSize: 16 }}>Comments</Text>
            <TouchableOpacity onPress={() => setIsCommentModalVisible(false)}>
              <Ionicons name="close" size={22} />
            </TouchableOpacity>
          </View>

          {/* Comment input */}
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f2f2f2', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 }}>
            <TextInput
              placeholder="Add a comment…"
              placeholderTextColor="#666"
              style={{ flex: 1, height: 40, color: '#111' }}
              value={commentText}
              onChangeText={setCommentText}
              onSubmitEditing={handleComment}
              returnKeyType="send"
            />
            <TouchableOpacity onPress={handleComment} style={{ marginLeft: 8, backgroundColor: '#111', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 }}>
              <Ionicons name="send" size={18} color="white" />
            </TouchableOpacity>
          </View>

          {/* Comments list */}
          <FlatList
            data={videoComments}
            keyExtractor={(item, idx) => item.id?.toString?.() ?? `c-${idx}`}
            renderItem={({ item }) => (
              <View style={{ paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#e6e6e6' }}>
                <Text style={{ fontWeight: '700', marginBottom: 2 }}>@{item?.user?.username || 'user'}</Text>
                <Text style={{ color: '#222' }}>{item?.text}</Text>
              </View>
            )}
            ListEmptyComponent={commentsLoading ? null : (
              <Text style={{ textAlign: 'center', color: '#666', marginVertical: 16 }}>
                No comments yet. Be the first!
              </Text>
            )}
            onEndReached={loadMoreComments}
            onEndReachedThreshold={0.4}
            ListFooterComponent={commentsLoading ? (
              <View style={{ paddingVertical: 16 }}>
                <ActivityIndicator />
              </View>
            ) : null}
            style={{ marginTop: 12 }}
          />
        </View>
      </Modal>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' }}>
        <StatusBar barStyle={'light-content'} />
        <ActivityIndicator size="large" color="white" />
        <Text style={{ color: 'white', marginTop: 10 }}>Loading clips...</Text>
      </SafeAreaView>
    );
  }

  if (!loading && clips.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' }}>
        <StatusBar barStyle={'light-content'} />
        <Feather name="video" size={64} color="#666" />
        <Text style={{ color: '#666', marginTop: 10, fontSize: 18 }}>No clips available</Text>
        <Text style={{ color: '#888', marginTop: 5, fontSize: 14, textAlign: 'center', paddingHorizontal: 40 }}>
          Clips will appear here once they're uploaded to the platform
        </Text>
        <TouchableOpacity 
          onPress={onRefresh} 
          style={{ marginTop: 20, padding: 10, backgroundColor: '#333', borderRadius: 8 }}
        >
          <Text style={{ color: 'white' }}>Refresh</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'black' }}>
      <StatusBar barStyle={'light-content'} />
      <FlatList
        data={clips}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        pagingEnabled
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        showsVerticalScrollIndicator={false}
        bounces={false}
        decelerationRate="fast"
        snapToInterval={height}
        snapToAlignment="start"
        onEndReached={() => {
          if (hasMore) fetchClips(page + 1);
        }}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="white"
          />
        }
      />

      {/* Options Bottom Sheet */}
      <Modal
        visible={isOptionsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsOptionsModalVisible(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}
          onPress={() => setIsOptionsModalVisible(false)}
        />
        <View
          style={{
            backgroundColor: 'white',
            padding: 20,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
          }}
        >
          <TouchableOpacity
            style={{ paddingVertical: 15 }}
            onPress={() => {
              handleBookmark(clips[currentVideoIndex]?.id);
              setIsOptionsModalVisible(false);
            }}
          >
            <Text style={{ fontSize: 16 }}>
              {savedClips.has(clips[currentVideoIndex]?.id) ? 'Remove from Saved' : 'Save the Clip'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ paddingVertical: 15 }}
            onPress={() => {
              setIsOptionsModalVisible(false);
              alert('Reported!');
            }}
          >
            <Text style={{ fontSize: 16, color: 'red' }}>Report</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  topBar: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 18, fontWeight: 'bold', color: 'white' },
  bottomInfo: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    width: '70%',
  },
  videoTitle: { fontSize: 16, color: 'white', fontWeight: 'bold' },
  videoDesc: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 5 },
  actions: {
    position: 'absolute',
    bottom: 120,
    right: 20,
    alignItems: 'center',
    gap: 20,
  },
  actionText: { color: 'white', fontSize: 12, marginTop: 4 },
});

export default ReelsScreen;
