import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Dimensions,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Video, ResizeMode } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native"; // ✅ import

import {
  getClipsFeed,
  toggleLikeClip,
  getComments,
  createComment,
} from "@/api/clipService";
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
  const [newComment, setNewComment] = useState("");
  const [currentPlaying, setCurrentPlaying] = useState<string | null>(null);
  const [mute, setMute] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const videoRefs = useRef<{ [key: string]: Video | null }>({});
  const [userId, setUserId] = useState<string>("");

  const isFocused = useIsFocused(); // ✅ check screen focus

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

  // ✅ pause all videos when screen unfocused
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
    try {
      const response = await getComments(clip.id);
      if (response.success) {
        setComments(response.data);
      }
    } catch (err) {
      console.error("getComments error:", err);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedClip) return;
    try {
      const response = await createComment(selectedClip.id, newComment);
      if (response.success) {
        setComments((prev) => [response.data, ...prev]);
        setNewComment("");
      }
    } catch (err) {
      console.error("createComment error:", err);
    }
  };

  // play/pause & auto-mute on scroll
  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (viewableItems.length > 0 && isFocused) {
      const clipId = viewableItems[0].item.id;
      setCurrentPlaying(clipId);
      // setMute(true);
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
            ref={(ref) => (videoRefs.current[item.id] = ref)}
            source={{ uri: item.video }}
            style={styles.video}
            resizeMode={ResizeMode.COVER}
            shouldPlay={isFocused && currentPlaying === item.id} // ✅ only play when screen focused
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

      {/* comments modal */}
      <Modal
        visible={commentModalVisible}
        animationType="slide"
        onRequestClose={() => setCommentModalVisible(false)}
      >
        <View style={{ flex: 1, padding: 16 }}>
          <Text
            style={{ fontWeight: "bold", fontSize: 16, marginBottom: 10 }}
          >
            Comments
          </Text>
          <FlatList
            data={comments}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={{ marginBottom: 10 }}>
                <Text style={{ fontWeight: "bold" }}>
                  {item.user?.username}
                </Text>
                <Text>{item.text}</Text>
              </View>
            )}
          />
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TextInput
              placeholder="Add a comment..."
              value={newComment}
              onChangeText={setNewComment}
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: "#ccc",
                borderRadius: 20,
                paddingHorizontal: 10,
              }}
            />
            <TouchableOpacity onPress={handleAddComment}>
              <Ionicons
                name="send"
                size={24}
                color="blue"
                style={{ marginLeft: 10 }}
              />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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