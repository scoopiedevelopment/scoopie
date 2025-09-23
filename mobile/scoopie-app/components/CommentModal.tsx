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
import { calculateTimePeriod, formatCount } from '@/utils/formatNumber';

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


  const renderComment = ({ item }: { item: Comment }) => {
    // Add null checks to prevent errors
    if (!item || !item.id) {
      return null;
    }

    return (
      <View style={styles.commentItem}>
        <View style={{ flexDirection: 'row' }}>
          {item.commentBy?.profilePic ? <Image
            source={{
              uri: item.commentBy?.profilePic
            }}
            style={styles.commentAvatar}
          /> :
            <View style={styles.defaultAvatar}>
              <Ionicons name="person" size={20} color="#fff" />
            </View>}
          <View style={styles.commentHeader}>
            <Text style={styles.commentUsername}>
              {item.commentBy?.username || 'Unknown User'}
            </Text>
          </View>
        </View>


        <View style={styles.commentContent}>
          <Text style={styles.commentText}>
            {item.comment || ''}
          </Text>

          <View style={styles.commentActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleLikeComment(item.id)}
            >
              <Ionicons
                name="star-outline"
                size={16}
                color="#666"
              />

              <Text style={styles.actionText}>
                {item._count.likedBy > 0 ? item._count.likedBy : 0}
              </Text>
            </TouchableOpacity>
            <Text style={styles.commentTime}>
              {calculateTimePeriod(item.createdAt || new Date().toISOString())}
            </Text>

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
                    {reply.commentBy?.profilePic ? <Image
                      source={{
                        uri: reply.commentBy?.profilePic || 'https://via.placeholder.com/28'
                      }}
                      style={styles.replyAvatar}
                    /> : <View style={styles.defaultAvatar}>
                      <Ionicons name="person" size={20} color="#fff" />
                    </View>}

                    <View style={styles.replyContent}>
                      <View style={styles.commentHeader}>
                        <Text style={styles.commentUsername}>
                          {reply.commentBy?.username || 'Unknown User'}
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
                            name="star-outline"
                            size={14}
                            color="#666"
                          />

                          <Text style={styles.actionText}>
                            {reply._count?.likedBy > 0 ? reply._count.likedBy : '0'}
                          </Text>
                        </TouchableOpacity>
                        <Text style={styles.commentTime}>
                          {calculateTimePeriod(reply.createdAt || new Date().toISOString())}
                        </Text>

                        {/* <TouchableOpacity
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
                        </TouchableOpacity> */}
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
            {formatCount(comments.length)} {title}
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
        {!replyingTo && (
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
        )}

      </View>
    </Modal>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 10
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f1f1',
    backgroundColor: '#fff',
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

  // Loading / Empty
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#777',
    marginTop: 12,
    fontSize: 15,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  defaultAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: 'black'
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#444',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
  },

  // Comment List
  commentsList: {
    flex: 1,
  },
  commentsContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  commentItem: {
    paddingVertical: 12,
    marginBottom:20,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'black'
  },
  commentContent: {
    flex: 1,
    marginTop: 10
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  commentUsername: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
    marginRight: 6,
  },
  commentTime: {
    fontSize: 12,
    color: '#999',
    marginLeft: 10
  },
  commentText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 6,
    fontWeight: '600'

  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop:5,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 5,
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

  // Replies
  repliesContainer: {
    marginTop: 6,
    marginLeft: 36,
    borderLeftWidth: 2,
    borderLeftColor: '#f0f0f0',
    paddingLeft: 12,
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
    borderWidth: 1,
    borderColor: 'black'
  },
  replyContent: {
    flex: 1,
  },

  // Reply Section (when replying)
  replySection: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 10,
  },
  replyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  replyLabel: {
    fontSize: 13,
    color: '#666',
  },
  replyInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  replyInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#f8f8f8',
    fontSize: 14,
    marginRight: 10,
    maxHeight: 80,
  },

  // Comment Input (default bottom)
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#f8f8f8',
    fontSize: 14,
    marginRight: 10,
    maxHeight: 80,
  },

  // Send button
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#8C5EFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
});

export default CommentModal;