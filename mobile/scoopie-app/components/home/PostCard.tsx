import { PostFeed } from '@/models/PostfeedModel';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import apiClient from "../../api/apiClient";
import { getProfile } from '@/api/profileService';
import { formatCount, calculateTimePeriod } from '@/utils/formatNumber';
import CommentModal from '../CommentModal';
import PostReplyModal from '../PostReplyModal';
import { getPostComments, createPostComment, getPostCommentReplies, PostComment, organizeCommentsIntoNested } from '@/api/commentService';
import PostMedia from '../common/PostMedia';

interface PostCardProps {
  post: PostFeed;
}

const PostCard = ({ post }: PostCardProps) => {
  const {
    id,
    userId,
    text,
    views,
    shares,
    createdAt,
    media,
    user,
    _count,
    likes,
    savedBy,
  } = post;

  const [isSaved, setIsSaved] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(_count.likes || 0);
  const [loading, setLoading] = useState(false);
  const [userLoginId, setUserLoginId] = useState("");
  
  // Comment states
  const [comments, setComments] = useState<PostComment[]>([]);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsRefreshing, setCommentsRefreshing] = useState(false);
  
  // Reply modal states
  const [replyModalVisible, setReplyModalVisible] = useState(false);
  const [selectedCommentForReply, setSelectedCommentForReply] = useState<PostComment | null>(null);

  // ✅ Initial check for liked/saved status
  useEffect(() => {
    const getProfileData = async () => {
      const response = await getProfile();
      if (response) {
        const loginId = response.data.profile.userId;
        setUserLoginId(loginId);

        setLiked(likes?.some((like: any) => like.userId === loginId) || false);
        setIsSaved(savedBy?.some((saved: any) => saved.userId === loginId) || false);
      }
    };
    getProfileData();
  }, [likes, savedBy]);

  // ✅ Save Toggle
  const handleToggleSave = async () => {
    if (loading || !userLoginId) return;
    setLoading(true);
    try {
      const response = await apiClient.post("/saved/toggle", {
        userId: userLoginId,
        postId: id,
      });
      if (response.data.success) {
        setIsSaved(prev => !prev);
      }
    } catch (error) {
      // Handle save toggle error silently
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLike = async () => {
    if (loading || !userLoginId) return;
    setLoading(true);
    try {
      const response = await apiClient.post("/like/toggle", {
        postId: id,
        likedTo: userId,
      });

      if (response.data.success) {
        setLiked((prev) => {
          const newLiked = !prev;
         // const newCount = newLiked ? likeCount + 1 : Math.max(0, likeCount - 1);
         // setLikeCount(newCount);
          return newLiked;
        });
      }
    } catch (error) {
      // Handle like toggle error silently
    } finally {
      setLoading(false);
    }
  };

  // Comment handlers
  const openComments = async () => {
    setCommentModalVisible(true);
    setComments([]); // Clear previous comments
    setCommentsLoading(true);
    
    try {
      const response = await getPostComments(id);
      if (response.success) {
        // Filter out any null/undefined comments
        const validComments = (response.data || []).filter((comment: any) => 
          comment && comment.id && comment.commentBy
        );
        // Organize comments into nested structure on frontend
        const organizedComments = organizeCommentsIntoNested(validComments);
        setComments(organizedComments);
      } else {
        setComments([]);
      }
    } catch (err) {
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleAddComment = async (text: string, parentCommentId?: string) => {
    try {
      const response = await createPostComment(id, text, parentCommentId);
      if (response.success) {
        // Refresh comments by fetching from API
        try {
          setCommentsRefreshing(true);
          const refreshResponse = await getPostComments(id);
          if (refreshResponse.success) {
            // Filter out any null/undefined comments
            const validComments = (refreshResponse.data || []).filter((comment: any) => 
              comment && comment.id && comment.commentBy
            );
            // Organize comments into nested structure on frontend
            const organizedComments = organizeCommentsIntoNested(validComments);
            setComments(organizedComments);
          } else {
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
          }
        } catch (refreshError) {
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
        throw new Error(response.message || "Failed to create comment");
      }
    } catch (err) {
      throw err;
    }
  };

  const handleLikeComment = async (commentId: string) => {
    // TODO: Implement comment like functionality
    // You can implement this based on your API
  };

  const handleViewReplies = async (commentId: string) => {
    try {
      // Find the comment in the current comments state
      const findComment = (comments: PostComment[]): PostComment | null => {
        for (const comment of comments) {
          if (comment.id === commentId) {
            return comment;
          }
          if (comment.replies) {
            const found = findComment(comment.replies);
            if (found) return found;
          }
        }
        return null;
      };
      
      const comment = findComment(comments);
      if (comment) {
        setSelectedCommentForReply(comment);
        setReplyModalVisible(true);
      } else {
        Alert.alert("Error", "Comment not found");
      }
    } catch (error: any) {
      Alert.alert("Error", "Failed to open replies");
    }
  };

  // Handler for when user clicks reply button in CommentModal
  const handleReplyClick = async (commentId: string) => {
    try {
      // Find the comment in the current comments state
      const findComment = (comments: PostComment[]): PostComment | null => {
        for (const comment of comments) {
          if (comment.id === commentId) {
            return comment;
          }
          if (comment.replies) {
            const found = findComment(comment.replies);
            if (found) return found;
          }
        }
        return null;
      };
      
      const comment = findComment(comments);
      if (comment) {
        setSelectedCommentForReply(comment);
        setReplyModalVisible(true);
      } else {
        Alert.alert("Error", "Comment not found");
      }
    } catch (error: any) {
      Alert.alert("Error", "Failed to open replies");
    }
  };

  const handleCloseComments = () => {
    setCommentModalVisible(false);
    setComments([]);
    setCommentsLoading(false);
    setCommentsRefreshing(false);
  };

  const handleCloseReplyModal = () => {
    setReplyModalVisible(false);
    setSelectedCommentForReply(null);
  };

  return (
    <View style={styles.card}>
      {/* 🔹 Header */}
      <View style={styles.header}>
        <View style={styles.profileSection}>
          {user.profilePic ? (
            <Image source={{ uri: user.profilePic }} style={styles.profileImage} />
          ) : (
            <Ionicons name="person-circle" size={50} color="#ccc" />
          )}
          <Text style={styles.username}>{user.username}</Text>
        </View>
        <View style={styles.dotsSection}>
          <TouchableOpacity>
            <Text style={styles.dots}>⋯</Text>
          </TouchableOpacity>
          <Text style={styles.dotNumber}>{calculateTimePeriod(createdAt)}</Text>
        </View>
      </View>

      {/* 🔹 Media */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageRow}>
        {media.map((mediaItem, index) => (
          <PostMedia 
            key={index} 
            url={mediaItem.url} 
            style={styles.postImage}
            showPlayButton={true}
          />
        ))}
      </ScrollView>

      {/* 🔹 Description */}
      <Text style={styles.description}>{text}</Text>

      {/* 🔹 Engagement Row */}
      <View style={styles.engagementRow}>
        <View style={styles.leftIcons}>
          {/* Views */}
          <View style={styles.engagementItem}>
            <Image source={require('../../assets/icons/watchIcon.png')} style={styles.iconImage} />
            <Text style={styles.label}>{formatCount(Number(views))}</Text>
          </View>

          {/* Likes */}
          <TouchableOpacity onPress={handleToggleLike} disabled={loading}>
            <View style={styles.engagementItem}>
              <Ionicons name={likes.length > 0 ? "star" : "star-outline"} size={20} color={likes.length > 0 ? "#ffa500" : "black"} style={{ marginBottom: 5 }} />
              <Text style={styles.label}>{formatCount(likeCount)}</Text>
            </View>
          </TouchableOpacity>

          {/* Comments */}
          <TouchableOpacity onPress={openComments}>
            <View style={styles.engagementItem}>
              <Image source={require('../../assets/icons/commentIcon.png')} style={styles.iconImage} />
              <Text style={styles.label}>{formatCount(Number(_count.comments))}</Text>
            </View>
          </TouchableOpacity>

          {/* Shares */}
          <View style={styles.engagementItem}>
            <Image source={require('../../assets/icons/shareIcon.png')} style={styles.iconImage} />
            <Text style={styles.label}>{formatCount(Number(shares))}</Text>
          </View>
        </View>

        {/* Save */}
        <TouchableOpacity onPress={handleToggleSave} disabled={loading}>
          <Ionicons
            name={isSaved ? "bookmark" : "bookmark-outline"}
            size={22}
            color={isSaved ? "#9f5ef2" : "black"}
          />
        </TouchableOpacity>
      </View>

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
        onReplyClick={handleReplyClick}
        title="Comments"
      />

      {/* Reply Modal */}
      {selectedCommentForReply && (
        <PostReplyModal
          visible={replyModalVisible}
          onClose={handleCloseReplyModal}
          commentId={selectedCommentForReply.id}
          parentCommentText={selectedCommentForReply.comment}
          parentCommentUser={selectedCommentForReply.commentBy?.username || 'Unknown User'}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginVertical: 16, marginHorizontal: 8, elevation: 2 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  profileSection: { flexDirection: 'row', alignItems: 'center' },
  profileImage: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#eee', marginRight: 10 },
  username: { fontSize: 16, fontWeight: 'bold', color: '#1e1e1e' },
  dotsSection: { alignItems: 'center' },
  dots: { fontSize: 24, color: '#999' },
  dotNumber: { fontSize: 12, color: '#777', marginTop: 2 },
  imageRow: { flexDirection: 'row', marginVertical: 12 },
  postImage: { width: 100, height: 160, borderRadius: 8, marginRight: 10, backgroundColor: '#eee', resizeMode: 'cover' },
  description: { fontSize: 14, color: '#444', marginBottom: 16 },
  engagementRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  leftIcons: { flexDirection: 'row' },
  engagementItem: { alignItems: 'center', marginRight: 40 },
  iconImage: { width: 20, height: 20, resizeMode: 'contain', marginBottom: 4 },
  label: { fontSize: 12, color: '#666', marginTop: 4, textAlign: 'center' },
});

export default PostCard;
