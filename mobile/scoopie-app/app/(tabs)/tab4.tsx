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
  getClipCommentReplies 
} from '@/api/commentService';
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
    console.log("Opening comments for clip:", clip);
    setSelectedClip(clip);
    setCommentModalVisible(true);
    setComments([]); // Clear previous comments
    setCommentsLoading(true);
    
    try {
      const response = await getComments(clip.id);
      console.log("Comments response:", response);
      if (response.success) {
        // Filter out any null/undefined comments
        const validComments = (response.data || []).filter((comment: any) => 
          comment && comment.id && comment.commentBy
        );
        // Organize comments into nested structure on frontend
        const organizedComments = organizeCommentsIntoNested(validComments);
        setComments(organizedComments);
        console.log("Comments organized and set:", organizedComments);
        
        // Log all comment IDs for debugging
        console.log("🔍 DEBUG: All loaded comment IDs:");
        organizedComments.forEach((comment, index) => {
          console.log(`  Comment ${index}: ID = "${comment.id}", Comment = "${comment.comment}"`);
        });
      } else {
        console.log("Failed to fetch comments:", response.message);
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
    if (!selectedClip) {
      console.log("Cannot add comment: selectedClip is null");
      return;
    }
    
    console.log("Adding comment:", text, "to clip:", selectedClip.id, "parent:", parentCommentId);
    try {
      let response;
      if (parentCommentId) {
        // This is a reply to a comment
        console.log("Creating reply to comment:", parentCommentId);
        response = await createCommentReply(parentCommentId, text);
      } else {
        // This is a top-level comment
        console.log("Creating top-level comment");
        response = await createComment(selectedClip.id, text, parentCommentId);
      }
      console.log("Create comment response:", response);
      if (response.success) {
        console.log("Comment added successfully, refreshing comments...");
        
        // Refresh comments by fetching from API
        try {
          setCommentsRefreshing(true);
          const refreshResponse = await getComments(selectedClip.id);
          console.log("Refresh comments response:", refreshResponse);
          if (refreshResponse.success) {
            // Filter out any null/undefined comments
            const validComments = (refreshResponse.data || []).filter((comment: any) => 
              comment && comment.id && comment.commentBy
            );
            // Organize comments into nested structure on frontend
            const organizedComments = organizeCommentsIntoNested(validComments);
            setComments(organizedComments);
            console.log("Comments refreshed and organized successfully:", organizedComments);
          } else {
            console.log("Failed to refresh comments:", refreshResponse.message);
            // Fallback to optimistic update if refresh fails
            if (parentCommentId) {
              // This is a reply, update the parent comment's replies
              setComments((prev) => 
                prev.map(comment => 
                  comment.id === parentCommentId 
                    ? { 
                        ...comment, 
                        replies: [...(comment.replies || []), response.data].filter((reply: any) => 
                          reply && reply.id && reply.commentBy
                        )
                      }
                    : comment
                )
              );
            } else {
              // This is a top-level comment
              if (response.data && response.data.id && response.data.commentBy) {
                setComments((prev) => [response.data, ...prev]);
              }
            }
          }
        } catch (refreshError) {
          console.error("Error refreshing comments:", refreshError);
          // Fallback to optimistic update if refresh fails
          if (parentCommentId) {
            setComments((prev) => 
              prev.map(comment => 
                comment.id === parentCommentId 
                  ? { 
                      ...comment, 
                      replies: [...(comment.replies || []), response.data].filter((reply: any) => 
                        reply && reply.id && reply.commentBy
                      )
                    }
                  : comment
              )
            );
          } else {
            if (response.data && response.data.id && response.data.commentBy) {
              setComments((prev) => [response.data, ...prev]);
            }
          }
        } finally {
          setCommentsRefreshing(false);
        }
      } else {
        console.log("Failed to create comment:", response.message);
        throw new Error(response.message || "Failed to create comment");
      }
    } catch (err) {
      console.error("createComment error:", err);
      throw err;
    }
  };

  const handleLikeComment = async (commentId: string) => {
    // TODO: Implement comment like functionality
    console.log("Liking comment:", commentId);
    // You can implement this based on your API
  };

  const handleViewReplies = async (commentId: string) => {
    try {
      console.log("🔍 DEBUG: Starting to view replies for comment ID:", commentId);
      console.log("🔍 DEBUG: Comment ID type:", typeof commentId);
      console.log("🔍 DEBUG: Comment ID length:", commentId?.length);
      console.log("🔍 DEBUG: Comment ID value:", JSON.stringify(commentId));
      console.log("🔍 DEBUG: This is the ID of the comment we want to get replies for");
      console.log("🔍 DEBUG: Current comments state before API call:", comments);
      
      // Log all comment IDs in current state for comparison
      console.log("🔍 DEBUG: All comment IDs in current state:");
      comments.forEach((comment, index) => {
        console.log(`  Comment ${index}: ID = "${comment.id}", Type = ${typeof comment.id}`);
      });
      
      const response = await getClipCommentReplies(commentId, 1);
      
      console.log("🔍 DEBUG: API Response received:", response);
      console.log("🔍 DEBUG: Response success:", response.success);
      console.log("🔍 DEBUG: Response data:", response.data);
      console.log("🔍 DEBUG: Response data length:", response.data?.length || 0);
      
      if (response.success) {
        console.log("✅ DEBUG: API call successful, updating comments state");
        
        // Update the comments to include the fetched replies
        setComments(prev => {
          console.log("🔍 DEBUG: Previous comments state:", prev);
          const updated = prev.map(comment => {
            if (comment.id === commentId) {
              console.log("🔍 DEBUG: Found matching comment, updating with replies:", response.data);
              return { 
                ...comment, 
                replies: response.data || []
              };
            }
            return comment;
          });
          console.log("🔍 DEBUG: Updated comments state:", updated);
          return updated;
        });
        
        console.log("✅ DEBUG: Comments state updated successfully");
      } else {
        console.log("❌ DEBUG: API call failed:", response.message);
        console.log("❌ DEBUG: Full response:", response);
        Alert.alert("Error", "Failed to load replies");
      }
    } catch (error: any) {
      console.error("❌ DEBUG: Exception occurred:", error);
      console.error("❌ DEBUG: Error details:", error?.message);
      console.error("❌ DEBUG: Error stack:", error?.stack);
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
  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: any[] }) => {
    if (viewableItems.length > 0 && isFocused) {
      const clipId = viewableItems[0].item.id;
      setCurrentPlaying(clipId);
    }
  }, [isFocused]);

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
              name={
                savedClips.has(item.id) ? "bookmark" : "bookmark-outline"
              }
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
    height: height,
    width: width,
    backgroundColor: "black",
    overflow: "hidden",
  },
  video: {
    width: width,
    height: height,
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