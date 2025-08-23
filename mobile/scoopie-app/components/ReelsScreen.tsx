import React, { useEffect, useRef, useState } from "react";
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
  StyleSheet
} from "react-native";
import { router } from "expo-router";
import { Video } from "expo-av";
import { Feather, FontAwesome, Ionicons } from "@expo/vector-icons";
import { videos } from "../constants/videos";
import { shareVideo } from "../utils/functions";
import CommentModal from "./CommentModal";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { saveUserData, getUserData } from "../utils/storage";

const { height, width } = Dimensions.get("window");
const shortText = (txt, len) => (txt?.length > len ? txt?.slice(0, len) + "..." : txt);
const iconSize = 32, iconColor = "white";

const ReelsScreen = () => {
  const videoRefs = useRef([]);
  const [likedVideos, setLikedVideos] = useState([]);
  const [bookmarkedVideos, setBookmarkedVideos] = useState([]);
  const [isCommentModalVisible, setIsCommentModalVisible] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [videoComments, setVideoComments] = useState([]);
  const [selectedVideoId, setSelectedVideoId] = useState(null);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(1);
  const [userToken, setUserToken] = useState(null);
  const [isOptionsModalVisible, setIsOptionsModalVisible] = useState(false);
  const [likeCounts, setLikeCounts] = useState({}); // Store dynamic like counts

  useEffect(() => {
    const loadData = async () => {
      const token = await AsyncStorage.getItem("accessToken");
      setUserToken(token);
      const savedLikes = await getUserData(token, "likes");
      const savedBookmarks = await getUserData(token, "bookmarks");
      setLikedVideos(savedLikes || []);
      setBookmarkedVideos(savedBookmarks || []);
      // Initialize like counts for videos
      const initialCounts = {};
      videos.forEach((_, i) => (initialCounts[i] = 999)); // Default count
      setLikeCounts(initialCounts);
    };
    loadData();
  }, []);

  const handleLike = (index) => {
    let updatedLikes;
    let updatedCounts = { ...likeCounts };

    if (likedVideos.includes(index)) {
      updatedLikes = likedVideos.filter((i) => i !== index);
      updatedCounts[index] = Math.max(0, updatedCounts[index] - 1);
    } else {
      updatedLikes = [...likedVideos, index];
      updatedCounts[index] = (updatedCounts[index] || 0) + 1;
    }

    setLikedVideos(updatedLikes);
    setLikeCounts(updatedCounts);
    saveUserData(userToken, "likes", updatedLikes);
  };

  const handleBookmark = (index) => {
    let updatedBookmarks;
    if (bookmarkedVideos.includes(index)) {
      updatedBookmarks = bookmarkedVideos.filter((i) => i !== index);
    } else {
      updatedBookmarks = [...bookmarkedVideos, index];
    }
    setBookmarkedVideos(updatedBookmarks);
    saveUserData(userToken, "bookmarks", updatedBookmarks);
  };

  const showCommentModal = (comments, index) => {
    setSelectedVideoId(index);
    setVideoComments(comments);
    setIsCommentModalVisible(true);
  };

  const handleComment = () => {
    if (commentText.trim() === "") return;
    const updatedVideos = videos.map((video, i) => {
      if (selectedVideoId === i) {
        video.comments.push(commentText);
      }
      return video;
    });
    setVideoComments([...videoComments, commentText]);
    setCommentText("");
    saveUserData(userToken, `comments_${selectedVideoId}`, [...videoComments, commentText]);
  };

  const handleViewableItemsChanged = ({ viewableItems }) => {
    if (viewableItems.length > 0) {
      const index = viewableItems[0].index;
      setCurrentVideoIndex(index);
      videoRefs.current.forEach((video, i) => {
        if (i === index) {
          video?.playAsync();
        } else {
          video?.stopAsync();
        }
      });
    }
  };

  const viewabilityConfig = { itemVisiblePercentThreshold: 80 };

  const renderItem = ({ item, index }) => (
    <View key={index} style={{ height, width, backgroundColor: "black" }}>
      {/* Video - keeps aspect ratio */}
      <Video
        style={StyleSheet.absoluteFillObject}
        ref={(ref) => { videoRefs.current[index] = ref; }}
        isMuted
        source={{ uri: item?.sources }}
        shouldPlay={index === currentVideoIndex}
        resizeMode="contain"
        isLooping
      />

      {/* OVERLAY UI */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.7}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={22} color="white" />
          </TouchableOpacity>
          <Text style={styles.title}>Clips</Text>
          <TouchableOpacity onPress={() => setIsOptionsModalVisible(true)}>
            <Ionicons name="ellipsis-vertical" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Title & description */}
        <View style={styles.bottomInfo}>
          <Text style={styles.videoTitle}>{item?.title}</Text>
          <Text style={styles.videoDesc}>{shortText(item?.description, 60)}</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          {/* Like */}
          <TouchableOpacity onPress={() => handleLike(index)} style={{ alignItems: "center" }}>
            {likedVideos.includes(index) ? (
              <FontAwesome name="heart" color={iconColor} size={iconSize} />
            ) : (
              <FontAwesome name="heart-o" color={iconColor} size={iconSize} />
            )}
            <Text style={styles.actionText}>{likeCounts[index]}</Text>
          </TouchableOpacity>

          {/* Comments */}
          <TouchableOpacity onPress={() => showCommentModal(item.comments, index)} style={{ alignItems: "center" }}>
            <Ionicons name="chatbubble-outline" color={iconColor} size={iconSize} />
            <Text style={styles.actionText}>{item.comments.length}</Text>
          </TouchableOpacity>

          {/* Save */}
          <TouchableOpacity onPress={() => handleBookmark(index)} style={{ alignItems: "center" }}>
            <Feather name="bookmark" color={iconColor} size={iconSize} />
            <Text style={styles.actionText}>
              {bookmarkedVideos.includes(index) ? "Saved" : ""}
            </Text>
          </TouchableOpacity>

          {/* Share */}
          <TouchableOpacity onPress={() => shareVideo(item?.sources)} style={{ alignItems: "center" }}>
            <Ionicons name="share-social-outline" color={iconColor} size={iconSize} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Comment Modal */}
      <CommentModal
        isVisible={isCommentModalVisible}
        setIsVisible={setIsCommentModalVisible}
        videoComments={videoComments}
        commentText={commentText}
        setCommentText={setCommentText}
        handleAddComment={handleComment}
      />
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "black" }}>
      <StatusBar barStyle={"light-content"} />
      <FlatList
        data={videos}
        renderItem={renderItem}
        pagingEnabled
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        showsVerticalScrollIndicator={false}
        bounces={false}
        decelerationRate="fast"
        snapToInterval={height}
        snapToAlignment="start"
      />

      {/* Options Bottom Sheet */}
      <Modal
        visible={isOptionsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsOptionsModalVisible(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}
          onPress={() => setIsOptionsModalVisible(false)}
        />
        <View
          style={{
            backgroundColor: "white",
            padding: 20,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
          }}
        >
          <TouchableOpacity
            style={{ paddingVertical: 15 }}
            onPress={() => {
              handleBookmark(currentVideoIndex);
              setIsOptionsModalVisible(false);
            }}
          >
            <Text style={{ fontSize: 16 }}>Save the Reel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ paddingVertical: 15 }}
            onPress={() => {
              setIsOptionsModalVisible(false);
              alert("Reported!");
            }}
          >
            <Text style={{ fontSize: 16, color: "red" }}>Report</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  topBar: {
    position: "absolute",
    top: 20,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 18, fontWeight: "bold", color: "white" },
  bottomInfo: {
    position: "absolute",
    bottom: 100,
    left: 20,
    width: "70%",
  },
  videoTitle: { fontSize: 16, color: "white", fontWeight: "bold" },
  videoDesc: { fontSize: 14, color: "rgba(255,255,255,0.7)", marginTop: 5 },
  actions: {
    position: "absolute",
    bottom: 120,
    right: 20,
    alignItems: "center",
    gap: 20,
  },
  actionText: { color: "white", fontSize: 12, marginTop: 4 },
});

export default ReelsScreen;
