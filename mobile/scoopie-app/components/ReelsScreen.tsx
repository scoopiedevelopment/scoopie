import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Video } from 'expo-av';
import { Feather, FontAwesome, Ionicons } from '@expo/vector-icons';

// --- API services ---
import {
  getClipsFeed,
  toggleLikeClip,
  getComments,
  createComment,
  followUser,
} from '../api/clipService';
import { toggleSaveClip } from '../api/savedService';

const { height, width } = Dimensions.get('window');
const shortText = (txt?: string, len: number = 60) =>
  txt && txt.length > len ? `${txt.slice(0, len)}…` : txt || '';

const iconSize = 30;
const iconColor = 'white';

export default function ReelsScreen() {
  const videoRefs = useRef<Array<Video | null>>([]);

  // Feed state
  const [clips, setClips] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Playback state
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  // Likes state (optimistic)
  const [liked, setLiked] = useState<Record<string, boolean>>({}); // key: clipId
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({}); // key: clipId

  // Comments modal state
  const [isCommentModalVisible, setIsCommentModalVisible] = useState(false);
  const [activeClipId, setActiveClipId] = useState<string | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentsPage, setCommentsPage] = useState(1);
  const [commentsHasMore, setCommentsHasMore] = useState(true);
  const [commentInput, setCommentInput] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(false);

  // Follow (optimistic)
  const [following, setFollowing] = useState<Record<string, boolean>>({}); // key: userId

  const primeCountsFromFeed = useCallback((items: any[]) => {
    setLikeCounts((prev) => {
      const next = { ...prev };
      items.forEach((c) => {
        next[c.id] = c?._count?.likes ?? 0;
      });
      return next;
    });
  }, []);

  const loadFeed = useCallback(async (nextPage: number, isRefresh = false) => {
    if (loading) return;
    try {
      setLoading(true);
      const res = await getClipsFeed(nextPage);
      if (res?.success) {
        const items = Array.isArray(res.data) ? res.data : [];
        primeCountsFromFeed(items);
        setHasMore(items.length > 0);
        setClips((prev) => (isRefresh ? items : [...prev, ...items]));
      } else {
        setHasMore(false);
      }
    } catch (e) {
      console.error('Error fetching clips feed:', e);
      Alert.alert('Clips', 'Failed to load clips feed.');
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  }, [loading, primeCountsFromFeed, setClips]);

  useEffect(() => {
    loadFeed(1, true);
  }, []);

  const onEndReached = () => {
    if (hasMore && !loading) {
      const next = page + 1;
      setPage(next);
      loadFeed(next);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    loadFeed(1, true);
  };

  const handleViewableItemsChanged = ({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const index = viewableItems[0].index;
      if (typeof index === 'number') {
        setCurrentVideoIndex(index);
        videoRefs.current.forEach((video, i) => {
          if (!video) return;
          if (i === index) video.playAsync();
          else video.stopAsync();
        });
      }
    }
  };
  const viewabilityConfig = { itemVisiblePercentThreshold: 80 };

  // --- Likes ---
  const toggleLike = async (clipId: string) => {
    // Optimistic update
    setLiked((prev) => ({ ...prev, [clipId]: !prev[clipId] }));
    setLikeCounts((prev) => ({
      ...prev,
      [clipId]: Math.max(0, (prev[clipId] ?? 0) + (!liked[clipId] ? 1 : -1)),
    }));
    try {
      const clip = clips.find(c => c.id === clipId);
      const likedTo = clip?.user?.userId || clip?.userId || '';
      await toggleLikeClip(clipId, likedTo);
    } catch (e) {
      // Revert on failure
      setLiked((prev) => ({ ...prev, [clipId]: !prev[clipId] }));
      setLikeCounts((prev) => ({
        ...prev,
        [clipId]: Math.max(0, (prev[clipId] ?? 0) + (!liked[clipId] ? -1 : 1)),
      }));
      Alert.alert('Like', 'Could not update like. Please try again.');
    }
  };

  // --- Comments ---
  const openComments = async (clipId: string) => {
    setActiveClipId(clipId);
    setComments([]);
    setCommentsPage(1);
    setCommentsHasMore(true);
    setIsCommentModalVisible(true);
    await loadComments(clipId, 1, true);
  };

  const loadComments = async (clipId: string, pageNum: number, replace = false) => {
    if (commentsLoading) return;
    try {
      setCommentsLoading(true);
      const res: any = await getComments(clipId, pageNum);
      if (res?.success) {
        const items = Array.isArray(res.data) ? res.data : [];
        setComments((prev) => (replace ? items : [...prev, ...items]));
        setCommentsHasMore(items.length > 0);
      } else {
        setCommentsHasMore(false);
      }
    } catch (e) {
      console.error('Error fetching comments:', e);
      Alert.alert('Comments', 'Failed to load comments.');
    } finally {
      setCommentsLoading(false);
    }
  };

  const sendComment = async () => {
    if (!activeClipId || !commentInput.trim()) return;
    const text = commentInput.trim();
    // Optimistically add to UI
    const optimistic = {
      id: `temp-${Date.now()}`,
      text,
      createdAt: new Date().toISOString(),
      user: { username: 'You' },
    };
    setComments((prev) => [optimistic, ...prev]);
    setCommentInput('');

    try {
      await createComment(activeClipId, text);
    } catch (e) {
      Alert.alert('Comment', 'Could not post comment.');
      // Optionally roll back
      setComments((prev) => prev.filter((c) => c.id !== optimistic.id));
    }
  };

  const loadMoreComments = async () => {
    if (!activeClipId || !commentsHasMore || commentsLoading) return;
    const next = commentsPage + 1;
    setCommentsPage(next);
    await loadComments(activeClipId, next);
  };

  // --- Follow ---
  const onFollow = async (userId: string) => {
    // optimistic
    setFollowing((prev) => ({ ...prev, [userId]: true }));
    try {
      await followUser(userId);
    } catch (e) {
      setFollowing((prev) => ({ ...prev, [userId]: false }));
      Alert.alert('Follow', 'Could not follow user.');
    }
  };

  // --- Save/Bookmark ---
  const handleSave = async (clipId: string) => {
    const wasSaved = saved[clipId];
    // Optimistic update
    setSaved((prev) => ({ ...prev, [clipId]: !wasSaved }));
    
    try {
      const response = await toggleSaveClip(clipId);
      if (response.success) {
        setSaved((prev) => ({ ...prev, [clipId]: response.data.saved }));
      }
    } catch (e) {
      // Revert on error
      setSaved((prev) => ({ ...prev, [clipId]: wasSaved }));
      Alert.alert('Save', 'Could not update save status.');
    }
  };

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const clipId = item.id;
    const clipLiked = !!liked[clipId];
    const count = likeCounts[clipId] ?? item?._count?.likes ?? 0;
    const commentCount = item?._count?.comments ?? 0;

    return (
      <View key={clipId} style={{ height, width, backgroundColor: 'black' }}>
        {/* Video */}
        <Video
          ref={(ref) => {
            // @ts-ignore
            videoRefs.current[index] = ref;
          }}
          style={StyleSheet.absoluteFillObject}
          source={{ uri: item.video }}
          shouldPlay={index === currentVideoIndex}
          resizeMode="contain"
          isLooping
          isMuted
        />

        {/* Overlay UI */}
        <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
          {/* Top bar */}
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={styles.backButton}>
              <Ionicons name="arrow-back" size={22} color="white" />
            </TouchableOpacity>
            <Text style={styles.title}>Clips</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* User + caption */}
          <View style={styles.bottomInfo}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Text style={styles.username}>@{item?.user?.username}</Text>
              {!following[item?.user?.userId] && (
                <TouchableOpacity onPress={() => onFollow(item?.user?.userId)} style={styles.followBtn}>
                  <Text style={{ color: 'white', fontWeight: '700' }}>Follow</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.videoDesc}>{shortText(item?.text, 120)}</Text>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            {/* Like */}
            <TouchableOpacity onPress={() => toggleLike(clipId)} style={styles.actionWrap}>
              {clipLiked ? (
                <FontAwesome name="heart" color={iconColor} size={iconSize} />
              ) : (
                <FontAwesome name="heart-o" color={iconColor} size={iconSize} />)
              }
              <Text style={styles.actionText}>{count}</Text>
            </TouchableOpacity>

            {/* Comments */}
            <TouchableOpacity onPress={() => openComments(clipId)} style={styles.actionWrap}>
              <Ionicons name="chatbubble-outline" color={iconColor} size={iconSize} />
              <Text style={styles.actionText}>{commentCount}</Text>
            </TouchableOpacity>

            {/* Save/bookmark */}
            <TouchableOpacity onPress={() => handleSave(clipId)} style={styles.actionWrap}>
              <Feather 
                name="bookmark" 
                color={saved[clipId] ? '#7B4DFF' : iconColor} 
                size={iconSize} 
              />
              <Text style={styles.actionText}>
                {saved[clipId] ? 'Saved' : ''}
              </Text>
            </TouchableOpacity>

            {/* Share placeholder (implement your share util) */}
            {/* <TouchableOpacity onPress={() => shareVideo(item.video)} style={styles.actionWrap}>
              <Ionicons name="share-social-outline" color={iconColor} size={iconSize} />
            </TouchableOpacity> */}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'black' }}>
      <StatusBar barStyle="light-content" />

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
        onEndReached={onEndReached}
        onEndReachedThreshold={0.6}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListFooterComponent={loading ? (
          <View style={{ paddingVertical: 20 }}>
            <ActivityIndicator />
          </View>
        ) : null}
      />

      {/* Comments Modal */}
      <Modal
        visible={isCommentModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsCommentModalVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setIsCommentModalVisible(false)} />
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={{ fontWeight: '700', fontSize: 16 }}>Comments</Text>
            <TouchableOpacity onPress={() => setIsCommentModalVisible(false)}>
              <Ionicons name="close" size={22} />
            </TouchableOpacity>
          </View>

          {/* Comment input */}
          <View style={styles.commentInputRow}>
            <TextInput
              placeholder="Add a comment…"
              placeholderTextColor="#666"
              style={styles.commentInput}
              value={commentInput}
              onChangeText={setCommentInput}
              onSubmitEditing={sendComment}
              returnKeyType="send"
            />
            <TouchableOpacity onPress={sendComment} style={styles.sendBtn}>
              <Ionicons name="send" size={18} color="white" />
            </TouchableOpacity>
          </View>

          {/* Comments list */}
          <FlatList
            data={comments}
            keyExtractor={(item, idx) => item.id?.toString?.() ?? `c-${idx}`}
            renderItem={({ item }) => (
              <View style={styles.commentItem}>
                <Text style={styles.commentUser}>@{item?.user?.username || 'user'}</Text>
                <Text style={styles.commentText}>{item?.text}</Text>
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
    </SafeAreaView>
  );
}

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
  username: { fontSize: 16, color: 'white', fontWeight: 'bold', marginRight: 10 },
  videoDesc: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  actions: {
    position: 'absolute',
    bottom: 120,
    right: 20,
    alignItems: 'center',
    gap: 20,
  },
  actionWrap: { alignItems: 'center' },
  actionText: { color: 'white', fontSize: 12, marginTop: 4 },

  // Comments modal
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  modalSheet: {
    backgroundColor: 'white',
    maxHeight: height * 0.6,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  commentInput: {
    flex: 1,
    height: 40,
    color: '#111',
  },
  sendBtn: {
    marginLeft: 8,
    backgroundColor: '#111',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  commentItem: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e6e6e6',
  },
  commentUser: { fontWeight: '700', marginBottom: 2 },
  commentText: { color: '#222' },
  followBtn: {
    marginLeft: 10,
    backgroundColor: '#2563eb',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
});
