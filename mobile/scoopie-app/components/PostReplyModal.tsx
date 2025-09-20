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
import { getPostCommentReplies, createCommentReply } from '@/api/commentService';

interface ReplyUser {
  username: string;
  profilePic?: string;
  userId: string;
}

interface Reply {
  id: string;
  comment: string;
  commentById: string;
  createdAt: string;
  commentBy: ReplyUser;
  _count: {
    likedBy: number;
  };
}

interface PostReplyModalProps {
  visible: boolean;
  onClose: () => void;
  commentId: string;
  parentCommentText: string;
  parentCommentUser: string;
}

const PostReplyModal: React.FC<PostReplyModalProps> = ({
  visible,
  onClose,
  commentId,
  parentCommentText,
  parentCommentUser
}) => {
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(false);
  const [newReply, setNewReply] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Reset states when modal closes
  useEffect(() => {
    if (!visible) {
      setReplies([]);
      setNewReply('');
      setIsSubmitting(false);
      setPage(1);
      setHasMore(true);
    }
  }, [visible]);

  // Load replies when modal opens
  useEffect(() => {
    if (visible && commentId) {
      loadReplies();
    }
  }, [visible, commentId]);

  const loadReplies = async (pageNum: number = 1, append: boolean = false) => {
    if (loading) return;
    
    setLoading(true);
    try {
      const response = await getPostCommentReplies(commentId, pageNum);
      
      if (response.success) {
        const newReplies = response.data || [];
        setReplies(prev => append ? [...prev, ...newReplies] : newReplies);
        setHasMore(newReplies.length > 0);
        setPage(pageNum);
      } else {
        Alert.alert('Error', 'Failed to load replies');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load replies');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReply = async () => {
    if (!newReply.trim()) return;
    
    setIsSubmitting(true);
    try {
      const response = await createCommentReply(commentId, newReply.trim());
      
      if (response.success) {
        setNewReply('');
        // Reload replies to show the new one
        await loadReplies(1, false);
      } else {
        Alert.alert('Error', response.message || 'Failed to add reply');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add reply. Please try again.');
    } finally {
      setIsSubmitting(false);
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

  const renderReply = ({ item }: { item: Reply }) => (
    <View style={styles.replyItem}>
      <Image
        source={{ 
          uri: item.commentBy?.profilePic || 'https://via.placeholder.com/32' 
        }}
        style={styles.replyAvatar}
      />
      
      <View style={styles.replyContent}>
        <View style={styles.replyHeader}>
          <Text style={styles.replyUsername}>
            {item.commentBy?.username || 'Unknown User'}
          </Text>
          <Text style={styles.replyTime}>
            {formatDate(item.createdAt)}
          </Text>
        </View>
        
        <Text style={styles.replyText}>
          {item.comment}
        </Text>
      </View>
    </View>
  );

  const loadMoreReplies = () => {
    if (hasMore && !loading) {
      loadReplies(page + 1, true);
    }
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
          <Text style={styles.headerTitle}>Replies</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Parent Comment */}
        <View style={styles.parentComment}>
          <Text style={styles.parentCommentUser}>@{parentCommentUser}</Text>
          <Text style={styles.parentCommentText}>{parentCommentText}</Text>
        </View>

        {/* Replies List */}
        {loading && replies.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading replies...</Text>
          </View>
        ) : replies.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubble-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>No replies yet</Text>
            <Text style={styles.emptySubtitle}>Be the first to reply!</Text>
          </View>
        ) : (
          <FlatList
            data={replies}
            keyExtractor={(item) => item.id}
            renderItem={renderReply}
            style={styles.repliesList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.repliesContent}
            onEndReached={loadMoreReplies}
            onEndReachedThreshold={0.3}
            ListFooterComponent={
              loading && replies.length > 0 ? (
                <View style={styles.footerLoader}>
                  <ActivityIndicator size="small" color="#007AFF" />
                </View>
              ) : null
            }
          />
        )}

        {/* Reply Input */}
        <View style={styles.inputContainer}>
          <TextInput
            placeholder="Add a reply..."
            placeholderTextColor="#999"
            value={newReply}
            onChangeText={setNewReply}
            style={styles.replyInput}
            multiline
            maxLength={500}
          />
          <TouchableOpacity 
            onPress={handleSubmitReply}
            style={[
              styles.sendButton,
              (!newReply.trim() || isSubmitting) && styles.sendButtonDisabled
            ]}
            disabled={!newReply.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons name="send" size={18} color="white" />
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
  parentComment: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  parentCommentUser: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 4,
  },
  parentCommentText: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
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
  repliesList: {
    flex: 1,
  },
  repliesContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  replyItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  replyAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  replyContent: {
    flex: 1,
  },
  replyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  replyUsername: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginRight: 8,
  },
  replyTime: {
    fontSize: 12,
    color: '#999',
  },
  replyText: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
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
  replyInput: {
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

export default PostReplyModal;
