import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from "react-native";
import { Video, ResizeMode } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import CommentModal from "@/components/CommentModal";

import {
  getClipsFeed,
  toggleLikeClip,
  getComments,
  createComment,
} from "@/api/clipService";
import {
  organizeCommentsIntoNested,
  createCommentReply,
  getClipCommentReplies,
} from "@/api/commentService";
import { toggleSaveClip } from "@/api/savedService";
import { shareVideo } from "@/utils/functions";

const { height, width } = Dimensions.get("window");

const ReelsScreen = () => {
  const [clips, setClips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedClips, setLikedClips] = useState(new Set());
  const [savedClips, setSavedClips] = useState(new Set());
  const [likeCounts, setLikeCounts] = useState<{ [key: string]: number }>({});
  const [comments, setComments] = useState<any[]>([]);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedClip, setSelectedClip] = useState<any>(null);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsRefreshing, setCommentsRefreshing] = useState(false);
  const [currentPlaying, setCurrentPlaying] = useState<string | null>(null);
  const [mute, setMute] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const videoRefs = useRef<{ [key: string]: Video | null }>({});
  const [userId, setUserId] = useState<string>("");

  const isFocused = useIsFocused();

  // fetch reels
  useEffect(() => {
    fetchClips();
  }, []);

  const fetchClips = async () => {
    try {
      setLoading(true);
      const response = await getClipsFeed(1);
      if (response.success) {
        setClips(response.data);
        setUserId(response.data[0]?.userId || "");
        const counts: { [key: string]: number } = {};
        response.data.forEach(
          (clip: any) => (counts[clip.id] = clip._count?.likes || 0)
        );
        setLikeCounts(counts);
      }
    } catch (e) {
      console.error("Error fetching clips:", e);
      setError("Failed to load reels");
    } finally {
      setLoading(false);
    }
  };

  // pause all videos when screen unfocused
  useEffect(() => {
    if (!isFocused) {
      Object.values(videoRefs.current).forEach((video) => {
        if (video) {
          video.pauseAsync();
        }
      });
      setCurrentPlaying(null);
    }
  }, [isFocused]);

  // like handler
  const handleLike = async (clipId: string) => {
    const wasLiked = likedClips.has(clipId);
    setLikedClips((prev) => {
      const copy = new Set(prev);
      wasLiked ? copy.delete(clipId) : copy.add(clipId);
      return copy;
    });
    setLikeCounts((prev) => ({
      ...prev,
      [clipId]: (prev[clipId] || 0) + (wasLiked ? -1 : 1),
    }));
    try {
      if (userId) await toggleLikeClip(clipId, userId);
    } catch (err) {
      console.error("toggleLike error:", err);
    }
  };

  // save handler
  const handleSave = async (clipId: string) => {
    const wasSaved = savedClips.has(clipId);
    setSavedClips((prev) => {
      const copy = new Set(prev);
      wasSaved ? copy.delete(clipId) : copy.add(clipId);
      return copy;
    });
    try {
      await toggleSaveClip(clipId);
    } catch (err) {
      console.error("toggleSave error:", err);
    }
  };

  // comments handler
  const openComments = async (clip: any) => {
    setSelectedClip(clip);
    setCommentModalVisible(true);
    setComments([]);
    setCommentsLoading(true);

    try {
      const response = await getComments(clip.id);
      if (response.success) {
        const validComments = (response.data || []).filter(
          (comment: any) => comment && comment.id && comment.commentBy
        );
        const organizedComments = organizeCommentsIntoNested(validComments);
        setComments(organizedComments);
      } else {
        setComments([]);
      }
    } catch (err) {
      console.error("getComments error:", err);
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleAddComment = async (text: string, parentCommentId?: string) => {
    if (!selectedClip) return;
    try {
      let response;
      if (parentCommentId) {
        response = await createCommentReply(parentCommentId, text);
      } else {
        response = await createComment(selectedClip.id, text, parentCommentId);
      }
      if (response.success) {
        setCommentsRefreshing(true);
        const refreshResponse = await getComments(selectedClip.id);
        if (refreshResponse.success) {
          const validComments = (refreshResponse.data || []).filter(
            (comment: any) => comment && comment.id && comment.commentBy
          );
          const organizedComments =
            organizeCommentsIntoNested(validComments);
          setComments(organizedComments);
        }
      }
    } catch (err) {
      console.error("createComment error:", err);
    } finally {
      setCommentsRefreshing(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    console.log("Liking comment:", commentId);
  };

  const handleViewReplies = async (commentId: string) => {
    try {
      const response = await getClipCommentReplies(commentId, 1);
      if (response.success) {
        setComments((prev) =>
          prev.map((comment) =>
            comment.id === commentId
              ? { ...comment, replies: response.data || [] }
              : comment
          )
        );
      } else {
        Alert.alert("Error", "Failed to load replies");
      }
    } catch (error: any) {
      Alert.alert("Error", "Failed to load replies");
    }
  };

  const handleCloseComments = () => {
    setCommentModalVisible(false);
    setSelectedClip(null);
    setComments([]);
    setCommentsLoading(false);
    setCommentsRefreshing(false);
  };

  // play/pause & auto-mute on scroll
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: any[] }) => {
      if (viewableItems.length > 0 && isFocused) {
        const clipId = viewableItems[0].item.id;
        setCurrentPlaying(clipId);
      }
    },
    [isFocused]
  );

  const viewabilityConfig = { itemVisiblePercentThreshold: 80 };

  const renderItem = ({ item }: { item: any }) => {
    return (
      <View style={styles.videoContainer}>
        <TouchableOpacity
          activeOpacity={1}
          style={{ flex: 1 }}
          onPress={() => setMute(!mute)}
          onLongPress={() => handleLike(item.id)}
        >
          <Video
            ref={(ref) => {
              videoRefs.current[item.id] = ref;
            }}
            source={{ uri: item.video }}
            style={styles.video}
            resizeMode={ResizeMode.COVER}
            shouldPlay={isFocused && currentPlaying === item.id}
            isLooping
            isMuted={mute}
          />
        </TouchableOpacity>

        {/* actions */}
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => handleLike(item.id)}>
            <Ionicons
              name={likedClips.has(item.id) ? "heart" : "heart-outline"}
              size={32}
              color={likedClips.has(item.id) ? "red" : "white"}
            />
            <Text style={styles.actionText}>{likeCounts[item.id] || 0}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => openComments(item)}>
            <Ionicons name="chatbubble-outline" size={32} color="white" />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => handleSave(item.id)}>
            <Ionicons
              name={savedClips.has(item.id) ? "bookmark" : "bookmark-outline"}
              size={32}
              color="white"
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => shareVideo(item.video)}>
            <Ionicons name="share-social-outline" size={32} color="white" />
          </TouchableOpacity>
        </View>

        {/* user info */}
        <View style={styles.userInfo}>
          <Text style={styles.username}>@{item.user?.username}</Text>
          <Text style={styles.caption}>{item.text}</Text>
        </View>
      </View>
    );
  };

  if (loading)
    return (
      <ActivityIndicator size="large" color="gray" style={{ marginTop: 50 }} />
    );
  if (error)
    return <Text style={{ color: "red", marginTop: 50 }}>{error}</Text>;

  return (
    <View style={{ flex: 1, backgroundColor: "black" }}>
      <FlatList
        data={clips}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        pagingEnabled
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        snapToInterval={height}   // 👈 each item takes full screen height
        decelerationRate="fast"   // 👈 quick snapping
        getItemLayout={(data, index) => ({
          length: height,
          offset: height * index,
          index,
        })}
      />

      {/* Comments Modal */}
      <CommentModal
        visible={commentModalVisible}
        onClose={handleCloseComments}
        comments={comments}
        loading={commentsLoading}
        refreshing={commentsRefreshing}
        onAddComment={handleAddComment}
        onLikeComment={handleLikeComment}
        onViewReplies={handleViewReplies}
        title="Comments"
      />
    </View>
  );
};

export default ReelsScreen;

const styles = StyleSheet.create({
  videoContainer: {
    height: height, // 👈 full screen height
    width: width,
    backgroundColor: "black",
    overflow: "hidden",
  },
  video: {
    width: width,
    height: height, // 👈 full screen height
  },
  actions: {
    position: "absolute",
    bottom: 100,
    right: 15,
    alignItems: "center",
    gap: 25,
  },
  actionText: {
    color: "white",
    textAlign: "center",
    marginTop: 4,
    fontSize: 12,
    fontWeight: "600",
  },
  userInfo: {
    position: "absolute",
    bottom: 50,
    left: 15,
    width: width * 0.8,
  },
  username: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 4,
  },
  caption: {
    color: "white",
    fontSize: 14,
    lineHeight: 18,
  },
});
