import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  StatusBar,
  SafeAreaView,
  Alert,
  FlatList,
  TextInput,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons, Feather, MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getPostComments, createPostComment, getPostCommentReplies, organizeCommentsIntoNested } from '@/api/commentService';
import CommentModal from '@/components/CommentModal';

const { width, height } = Dimensions.get('window');

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

export default function PostDetailScreen() {
  const router = useRouter();
  const { postId, postData } = useLocalSearchParams();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  
  // Comment states
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [commentPage, setCommentPage] = useState(1);
  const [hasMoreComments, setHasMoreComments] = useState(true);
  const [loadingMoreComments, setLoadingMoreComments] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsRefreshing, setCommentsRefreshing] = useState(false);

  const post: Post = postData ? JSON.parse(postData as string) : null;

  if (!post) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Post not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleLike = useCallback(() => {
    setIsLiked(!isLiked);
  }, [isLiked]);

  const handleSave = useCallback(() => {
    setIsSaved(!isSaved);
  }, [isSaved]);

  const handleShare = useCallback(() => {
    Alert.alert('Share', 'Share functionality would be implemented here');
  }, []);

  const handleComment = useCallback(() => {
    setShowComments(true);
    loadComments(1, true);
  }, []);

  const loadComments = async (page: number, isRefresh = false) => {
    if (!post?.id) return;
    
    if (isRefresh) {
      setCommentsRefreshing(true);
      setCommentPage(1);
      setHasMoreComments(true);
    } else if (page === 1) {
      setCommentsLoading(true);
    } else {
      setLoadingMoreComments(true);
    }

    try {
      const response = await getPostComments(post.id, page);
      if (response.success) {
        const rawComments = response.data || [];
        // Organize comments into nested structure on frontend
        const organizedComments = organizeCommentsIntoNested(rawComments);
        
        if (page === 1 || isRefresh) {
          setComments(organizedComments);
        } else {
          // For pagination, we need to merge with existing organized comments
          const allRawComments = [...comments, ...rawComments];
          const mergedOrganizedComments = organizeCommentsIntoNested(allRawComments);
          setComments(mergedOrganizedComments);
        }
        setHasMoreComments(rawComments.length === 20);
        setCommentPage(page + 1);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setCommentsLoading(false);
      setCommentsRefreshing(false);
      setLoadingMoreComments(false);
    }
  };

  const handleAddComment = async (text: string, parentCommentId?: string) => {
    if (!post?.id) return;
    
    setCommentsRefreshing(true);
    try {
      const response = await createPostComment(post.id, text, parentCommentId);
      if (response.success) {
        // Refresh comments to show the new comment
        await loadComments(1, true);
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert('Error', 'Failed to add comment. Please try again.');
    } finally {
      setCommentsRefreshing(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    // TODO: Implement comment like functionality
    console.log("Liking comment:", commentId);
  };

  const handleViewReplies = async (commentId: string) => {
    try {
      console.log("🔍 POST-DETAIL DEBUG: Starting to view replies for comment ID:", commentId);
      console.log("🔍 POST-DETAIL DEBUG: Comment ID type:", typeof commentId);
      console.log("🔍 POST-DETAIL DEBUG: Comment ID length:", commentId?.length);
      console.log("🔍 POST-DETAIL DEBUG: Comment ID value:", JSON.stringify(commentId));
      console.log("🔍 POST-DETAIL DEBUG: This is the ID of the comment we want to get replies for");
      console.log("🔍 POST-DETAIL DEBUG: Current comments state before API call:", comments);
      
      // Log all comment IDs in current state for comparison
      console.log("🔍 POST-DETAIL DEBUG: All comment IDs in current state:");
      comments.forEach((comment, index) => {
        console.log(`  Comment ${index}: ID = "${comment.id}", Type = ${typeof comment.id}`);
      });
      
      const response = await getPostCommentReplies(commentId, 1);
      
      console.log("🔍 POST-DETAIL DEBUG: API Response received:", response);
      console.log("🔍 POST-DETAIL DEBUG: Response success:", response.success);
      console.log("🔍 POST-DETAIL DEBUG: Response data:", response.data);
      console.log("🔍 POST-DETAIL DEBUG: Response data length:", response.data?.length || 0);
      
      if (response.success) {
        console.log("✅ POST-DETAIL DEBUG: API call successful, updating comments state");
        
        // Update the comments to include the fetched replies
        setComments(prev => {
          console.log("🔍 POST-DETAIL DEBUG: Previous comments state:", prev);
          const updated = prev.map(comment => {
            if (comment.id === commentId) {
              console.log("🔍 POST-DETAIL DEBUG: Found matching comment, updating with replies:", response.data);
              return { 
                ...comment, 
                replies: response.data || []
              };
            }
            return comment;
          });
          console.log("🔍 POST-DETAIL DEBUG: Updated comments state:", updated);
          return updated;
        });
        
        console.log("✅ POST-DETAIL DEBUG: Comments state updated successfully");
      } else {
        console.log("❌ POST-DETAIL DEBUG: API call failed:", response.message);
        console.log("❌ POST-DETAIL DEBUG: Full response:", response);
        Alert.alert("Error", "Failed to load replies");
      }
    } catch (error: any) {
      console.error("❌ POST-DETAIL DEBUG: Exception occurred:", error);
      console.error("❌ POST-DETAIL DEBUG: Error details:", error?.message);
      console.error("❌ POST-DETAIL DEBUG: Error stack:", error?.stack);
      Alert.alert("Error", "Failed to load replies");
    }
  };

  const nextImage = useCallback(() => {
    if (currentImageIndex < post.media.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  }, [currentImageIndex, post.media.length]);

  const prevImage = useCallback(() => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  }, [currentImageIndex]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="black" />
      
      {/* Back Button */}
      <TouchableOpacity 
        onPress={() => router.back()} 
        style={styles.backButton}
      >
        <Ionicons name="chevron-back" size={28} color="white" />
      </TouchableOpacity>

      {/* Media */}
      <View style={styles.mediaContainer}>
        {post.media.length > 0 ? (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: post.media[currentImageIndex].url }}
              style={styles.mainImage}
              resizeMode="contain"
            />
            
            {/* Image Navigation */}
            {post.media.length > 1 && (
              <>
                <TouchableOpacity 
                  style={[styles.navButton, styles.prevButton]} 
                  onPress={prevImage}
                  disabled={currentImageIndex === 0}
                >
                  <Ionicons 
                    name="chevron-back" 
                    size={24} 
                    color={currentImageIndex === 0 ? '#666' : 'white'} 
                  />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.navButton, styles.nextButton]} 
                  onPress={nextImage}
                  disabled={currentImageIndex === post.media.length - 1}
                >
                  <Ionicons 
                    name="chevron-forward" 
                    size={24} 
                    color={currentImageIndex === post.media.length - 1 ? '#666' : 'white'} 
                  />
                </TouchableOpacity>
                
                {/* Image Indicators */}
                <View style={styles.imageIndicators}>
                  {post.media.map((_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.indicator,
                        index === currentImageIndex && styles.activeIndicator
                      ]}
                    />
                  ))}
                </View>
              </>
            )}
          </View>
        ) : (
          <View style={styles.noMediaContainer}>
            <Feather name="image" size={64} color="#666" />
            <Text style={styles.noMediaText}>No media available</Text>
          </View>
        )}
      </View>
      
      {/* Comments Modal */}
      <CommentModal
        visible={showComments}
        onClose={() => setShowComments(false)}
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
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  errorText: {
    color: 'white',
    fontSize: 18,
    marginBottom: 20,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  mediaContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  imageContainer: {
    position: 'relative',
    width: width,
    height: height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainImage: {
    width: width,
    height: height,
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -20 }],
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  prevButton: {
    left: 16,
  },
  nextButton: {
    right: 16,
  },
  imageIndicators: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 4,
  },
  activeIndicator: {
    backgroundColor: 'white',
  },
  noMediaContainer: {
    width: width,
    height: height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noMediaText: {
    color: '#666',
    fontSize: 16,
    marginTop: 12,
  },
});
