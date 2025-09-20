import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CommentUser {
  username: string;
  profilePic?: string;
  userId: string;
}

interface Comment {
  id: string;
  postId?: string | null;
  clipId?: string | null;
  comment: string;
  commentById: string;
  parentCommentId?: string | null;
  createdAt: string;
  commentBy: CommentUser;
  _count: {
    likedBy: number;
  };
  replies?: Comment[];
}

interface CommentModalProps {
  visible: boolean;
  onClose: () => void;
  comments: Comment[];
  loading: boolean;
  onAddComment: (text: string, parentCommentId?: string) => Promise<void>;
  onLikeComment?: (commentId: string) => Promise<void>;
  onViewReplies?: (commentId: string) => Promise<void>;
  onReplyClick?: (commentId: string) => Promise<void>;
  title?: string;
  refreshing?: boolean;
}

const CommentModal: React.FC<CommentModalProps> = ({
  visible,
  onClose,
  comments,
  loading,
  onAddComment,
  onLikeComment,
  onViewReplies,
  onReplyClick,
  title = "Comments",
  refreshing = false
}) => {
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());

  // Reset states when modal closes
  useEffect(() => {
    if (!visible) {
      setNewComment('');
      setReplyingTo(null);
      setReplyText('');
      setIsSubmitting(false);
      setExpandedReplies(new Set());
    }
  }, [visible]);

  // Log comments when they change
  useEffect(() => {
    // Comments are processed when they change
  }, [comments]);

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onAddComment(newComment.trim());
      setNewComment('');
    } catch (error) {
      Alert.alert('Error', 'Failed to add comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitReply = async () => {
    if (!replyText.trim() || !replyingTo) return;
    
    setIsSubmitting(true);
    try {
      await onAddComment(replyText.trim(), replyingTo.id);
      setReplyText('');
      setReplyingTo(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to add reply. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = async (comment: Comment) => {
    // If onReplyClick is provided, use it to open the PostReplyModal
    if (onReplyClick) {
      try {
        await onReplyClick(comment.id);
        return;
      } catch (error) {
        return;
      }
    }
    
    // Fallback to inline reply handling
    setReplyingTo(comment);
    setReplyText('');
    
    // If this comment doesn't have replies loaded yet, fetch them
    if (!comment.replies || comment.replies.length === 0) {
      if (onViewReplies) {
        try {
          await onViewReplies(comment.id);
          
          // Expand replies after fetching them
          setExpandedReplies(prev => {
            const newSet = new Set(prev);
            newSet.add(comment.id);
            return newSet;
          });
        } catch (error) {
          // Handle error silently
        }
      }
    }
  };

  const handleViewReplies = async (commentId: string) => {
    if (onViewReplies) {
      try {
        await onViewReplies(commentId);
        
        // Toggle the expanded state after loading replies
        setExpandedReplies(prev => {
          const newSet = new Set(prev);
          if (newSet.has(commentId)) {
            newSet.delete(commentId);
          } else {
            newSet.add(commentId);
          }
          return newSet;
        });
      } catch (error) {
        Alert.alert('Error', 'Failed to load replies. Please try again.');
      }
    }
  };

  const toggleReplies = (commentId: string) => {
    setExpandedReplies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  const handleLikeComment = async (commentId: string) => {
    if (onLikeComment) {
      try {
        await onLikeComment(commentId);
      } catch (error) {
        // Handle error silently
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h`;
    } else if (diffInHours < 168) { // 7 days
      return `${Math.floor(diffInHours / 24)}d`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const renderComment = ({ item }: { item: Comment }) => {
    // Add null checks to prevent errors
    if (!item || !item.id) {
      return null;
    }

    return (
      <View style={styles.commentItem}>
        <Image
          source={{ 
            uri: item.commentBy?.profilePic || 'https://via.placeholder.com/32' 
          }}
          style={styles.commentAvatar}
        />
        
        <View style={styles.commentContent}>
          <View style={styles.commentHeader}>
            <Text style={styles.commentUsername}>
              {item.commentBy?.username || 'Unknown User'}
            </Text>
            <Text style={styles.commentTime}>
              {formatDate(item.createdAt || new Date().toISOString())}
            </Text>
          </View>
          
          <Text style={styles.commentText}>
            {item.comment || ''}
          </Text>
        
        <View style={styles.commentActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleLikeComment(item.id)}
          >
            <Ionicons 
              name="heart-outline" 
              size={16} 
              color="#666" 
            />
            <Text style={styles.actionText}>
              {item._count.likedBy > 0 ? item._count.likedBy : ''}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={async () => {
              await handleReply(item);
              // Also expand replies if they exist or are being loaded
              if (item.replies && item.replies.length > 0) {
                setExpandedReplies(prev => {
                  const newSet = new Set(prev);
                  newSet.add(item.id);
                  return newSet;
                });
              }
            }}
          >
            <Text style={styles.replyText}>Reply</Text>
          </TouchableOpacity>

          {/* Show View Replies button if there are replies */}
          {item.replies && item.replies.length > 0 && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => {
                if (expandedReplies.has(item.id)) {
                  toggleReplies(item.id);
                } else {
                  handleViewReplies(item.id);
                }
              }}
            >
              <Text style={styles.viewRepliesText}>
                {expandedReplies.has(item.id) 
                  ? `Hide ${item.replies.length} ${item.replies.length === 1 ? 'reply' : 'replies'}`
                  : `View ${item.replies.length} ${item.replies.length === 1 ? 'reply' : 'replies'}`
                }
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Render replies */}
        {item.replies && item.replies.length > 0 && expandedReplies.has(item.id) && (
          <View style={styles.repliesContainer}>
            {item.replies.map((reply) => {
              // Add null checks for replies
              if (!reply || !reply.id) {
                return null;
              }
              
              return (
                <View key={reply.id} style={styles.replyItem}>
                  <Image
                    source={{ 
                      uri: reply.commentBy?.profilePic || 'https://via.placeholder.com/28' 
                    }}
                    style={styles.replyAvatar}
                  />
                  
                  <View style={styles.replyContent}>
                    <View style={styles.commentHeader}>
                      <Text style={styles.commentUsername}>
                        {reply.commentBy?.username || 'Unknown User'}
                      </Text>
                      <Text style={styles.commentTime}>
                        {formatDate(reply.createdAt || new Date().toISOString())}
                      </Text>
                    </View>
                    
                    <Text style={styles.commentText}>
                      {reply.comment || ''}
                    </Text>
                    
                    <View style={styles.commentActions}>
                      <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => handleLikeComment(reply.id)}
                      >
                        <Ionicons 
                          name="heart-outline" 
                          size={14} 
                          color="#666" 
                        />
                        <Text style={styles.actionText}>
                          {reply._count?.likedBy > 0 ? reply._count.likedBy : ''}
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={async () => {
                          await handleReply(reply);
                          // Also expand replies if they exist or are being loaded
                          if (reply.replies && reply.replies.length > 0) {
                            setExpandedReplies(prev => {
                              const newSet = new Set(prev);
                              newSet.add(reply.id);
                              return newSet;
                            });
                          }
                        }}
                      >
                        <Text style={styles.replyText}>Reply</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#1a1a1a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {title} ({comments.length})
          </Text>
          <View style={styles.placeholder} />
        </View>

        {/* Comments List */}
        {loading || refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>
              {loading ? 'Loading comments...' : 'Refreshing comments...'}
            </Text>
          </View>
        ) : comments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubble-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>No comments yet</Text>
            <Text style={styles.emptySubtitle}>Be the first to comment!</Text>
          </View>
        ) : (
          <FlatList
            data={comments.filter(item => item && item.id)} // Filter out null/undefined items
            keyExtractor={(item) => item?.id || Math.random().toString()}
            renderItem={renderComment}
            style={styles.commentsList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.commentsContent}
          />
        )}

        {/* Reply Section */}
        {replyingTo && replyingTo.id && (
          <View style={styles.replySection}>
            <View style={styles.replyHeader}>
              <Text style={styles.replyLabel}>
                Replying to {replyingTo.commentBy?.username || 'Unknown User'}
              </Text>
              <TouchableOpacity onPress={() => setReplyingTo(null)}>
                <Ionicons name="close" size={20} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.replyInputContainer}>
              <TextInput
                placeholder={`Reply to ${replyingTo.commentBy?.username || 'Unknown User'}...`}
                placeholderTextColor="#999"
                value={replyText}
                onChangeText={setReplyText}
                style={styles.replyInput}
                multiline
                maxLength={500}
              />
              <TouchableOpacity 
                onPress={handleSubmitReply}
                style={[
                  styles.sendButton,
                  (!replyText.trim() || isSubmitting) && styles.sendButtonDisabled
                ]}
                disabled={!replyText.trim() || isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Ionicons name="send" size={18} color="white" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Comment Input */}
        <View style={styles.inputContainer}>
          <TextInput
            placeholder="Add a comment..."
            placeholderTextColor="#999"
            value={newComment}
            onChangeText={setNewComment}
            style={styles.commentInput}
            multiline
            maxLength={500}
          />
          <TouchableOpacity 
            onPress={handleSubmitComment}
            style={[
              styles.sendButton,
              (!newComment.trim() || isSubmitting) && styles.sendButtonDisabled
            ]}
            disabled={!newComment.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons name="send" size={20} color="white" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#666',
    marginTop: 16,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    color: '#666',
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtitle: {
    color: '#999',
    marginTop: 8,
    fontSize: 14,
  },
  commentsList: {
    flex: 1,
  },
  commentsContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  commentItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentUsername: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginRight: 8,
  },
  commentTime: {
    fontSize: 12,
    color: '#999',
  },
  commentText: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
    marginBottom: 8,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  actionText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  replyText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  viewRepliesText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  repliesContainer: {
    marginTop: 8,
    marginLeft: 12,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: '#e1e5e9',
  },
  replyItem: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  replyAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 10,
  },
  replyContent: {
    flex: 1,
  },
  replySection: {
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#e1e5e9',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  replyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  replyLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  replyInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  replyInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    fontSize: 14,
    marginRight: 12,
    maxHeight: 80,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e1e5e9',
    backgroundColor: '#ffffff',
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    fontSize: 16,
    marginRight: 12,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
});

export default CommentModal;