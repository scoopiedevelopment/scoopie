import React from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

interface CommentModalProps {
  isVisible: boolean;
  setIsVisible: (visible: boolean) => void;
  videoComments: string[];
  commentText: string;
  setCommentText: (text: string) => void;
  handleAddComment: () => void;
}

const CommentModal: React.FC<CommentModalProps> = ({
  isVisible,
  setIsVisible,
  videoComments,
  commentText,
  setCommentText,
  handleAddComment,
}) => {
  const renderComment = ({ item, index }: { item: string; index: number }) => (
    <View style={styles.commentItem}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>👤</Text>
      </View>
      <View style={styles.commentContent}>
        <Text style={styles.username}>User {index + 1}</Text>
        <Text style={styles.commentText}>{item}</Text>
      </View>
    </View>
  );

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setIsVisible(false)}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Comments</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setIsVisible(false)}
          >
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={videoComments}
          renderItem={renderComment}
          keyExtractor={(item, index) => index.toString()}
          style={styles.commentsList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No comments yet</Text>
              <Text style={styles.emptySubtext}>Be the first to comment!</Text>
            </View>
          }
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.inputContainer}
        >
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder="Add a comment..."
              placeholderTextColor="#9aa0a6"
              value={commentText}
              onChangeText={setCommentText}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                commentText.trim() ? styles.sendButtonActive : styles.sendButtonInactive
              ]}
              onPress={handleAddComment}
              disabled={!commentText.trim()}
            >
              <Text style={[
                styles.sendText,
                commentText.trim() ? styles.sendTextActive : styles.sendTextInactive
              ]}>
                Send
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#202124',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f3f4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 16,
    color: '#5f6368',
    fontWeight: 'bold',
  },
  commentsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  commentItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f3f4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
  },
  commentContent: {
    flex: 1,
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: '#202124',
    marginBottom: 2,
  },
  commentText: {
    fontSize: 14,
    color: '#5f6368',
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9aa0a6',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9aa0a6',
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e1e8ed',
    backgroundColor: '#fff',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e1e8ed',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
    color: '#202124',
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  sendButtonActive: {
    backgroundColor: '#1a73e8',
  },
  sendButtonInactive: {
    backgroundColor: '#f1f3f4',
  },
  sendText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sendTextActive: {
    color: '#fff',
  },
  sendTextInactive: {
    color: '#9aa0a6',
  },
});

export default CommentModal;