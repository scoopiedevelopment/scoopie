import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  FlatList,
  StyleSheet,
  Dimensions,
  Alert,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import ScreenWrapper from "@/components/common/ScreenWrapper";
import { VideoView, useVideoPlayer } from "expo-video";
import { uploadClip, uploadImage } from "@/api/uploadService";

const { width } = Dimensions.get("window");

type MediaItem = {
  uri: string;
  type: "image" | "video";
};

export default function FirstScreen() {
  const [selectedMedia, setSelectedMedia] = useState<MediaItem[]>([]);
  const [previewMedia, setPreviewMedia] = useState<MediaItem | null>(null);
  const [loading, setLoading] = useState(false)
  const router = useRouter();

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "We need access to your media library.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
      const savedItems: MediaItem[] = [];

      for (const asset of result.assets) {
        const pickedUri = asset.uri;
        let fileName = pickedUri.split("/").pop() || `image_${Date.now()}.jpg`;
        const newPath = `${FileSystem.documentDirectory}${fileName}`;

        await FileSystem.copyAsync({ from: pickedUri, to: newPath });
        savedItems.push({ uri: newPath, type: "image" });
      }

      const updatedList = [...selectedMedia, ...savedItems];
      setSelectedMedia(updatedList);
      if (!previewMedia) setPreviewMedia(updatedList[0]);
    }
  };


  const handleUploadAll = async () => {
    try {
      const imageUrls: string[] = [];
      let videoUrl: string | null = null;
      setLoading(true)
      for (const item of selectedMedia) {
        if (item.type === "image") {
          const response = await uploadImage(item.uri);
          if (response.success && response.data.urls.length > 0) {
            imageUrls.push(response.data.urls[0]);
          }
        } else if (item.type === "video") {
          const response = await uploadClip(item.uri);
          if (response.success && response.data.url) {
            videoUrl = response.data.url;
          }
        }
      }
      setLoading(false)
      router.push({
        pathname: "/textPostScreen",
        params: {
          uploadedImageUrls: encodeURIComponent(JSON.stringify(imageUrls)),
          uploadedVideoUrl: videoUrl ? encodeURIComponent(videoUrl) : "",
        },
      });
    } catch (err) {
      console.error("❌ Error uploading media:", err);
    }
  };


  const pickVideo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "We need access to your media library.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "videos",
      allowsMultipleSelection: false,
      quality: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
      const pickedUri = result.assets[0].uri;
      let fileName = pickedUri.split("/").pop() || `video_${Date.now()}.mp4`;
      const newPath = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.copyAsync({ from: pickedUri, to: newPath });

      const updatedList = [
        ...selectedMedia.filter((m) => m.type === "image"),
        { uri: newPath, type: "video" as const },
      ];
      setSelectedMedia(updatedList);
      setPreviewMedia({ uri: newPath, type: "video" });
    }
  };


  const removeMedia = (uri: string) => {
    const updated = selectedMedia.filter((m) => m.uri !== uri);
    setSelectedMedia(updated);
    if (previewMedia?.uri === uri) {
      setPreviewMedia(updated.length > 0 ? updated[0] : null);
    }
  };

  const goToNextScreen = () => {
    handleUploadAll()
  };

  return (
    <ScreenWrapper gradient>
      <View style={styles.container}>
        <LinearGradient
          colors={["#FFF7D2", "rgba(86, 55, 158, 0.35)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerContainer}
        >
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={26} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Media</Text>
          <View style={{ width: 26 }} />
        </LinearGradient>

        {previewMedia &&
          (previewMedia.type === "image" ? (
            <Image source={{ uri: previewMedia.uri }} style={styles.mainPreview} />
          ) : (
            <VideoPlayer uri={previewMedia.uri} style={styles.mainPreview} />
          ))}

        <View style={styles.buttonsRow}>
          <TouchableOpacity style={styles.pickButton} onPress={pickImages}>
            <Ionicons name="images-outline" size={18} color="#fff" />
            <Text style={styles.pickButtonText}>Select Images</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.pickButton} onPress={pickVideo}>
            <Ionicons name="videocam-outline" size={18} color="#fff" />
            <Text style={styles.pickButtonText}>Select Video</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={selectedMedia}
          numColumns={3}
          contentContainerStyle={styles.gridContainer}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => setPreviewMedia(item)}>
              <View style={styles.thumbnailWrapper}>
                {item.type === "image" ? (
                  <Image source={{ uri: item.uri }} style={styles.thumbnail} />
                ) : (
                  <VideoPlayer uri={item.uri} style={styles.thumbnail} muted />
                )}
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeMedia(item.uri)}
                >
                  <Ionicons name="close-circle" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
        />

        {selectedMedia.length > 0 && !loading && (
          <TouchableOpacity style={styles.nextButton} onPress={goToNextScreen}>
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        )}

        {loading && (<ActivityIndicator size="large" color="#8C5EFF" style={{ margin: 10 }} />)}
      </View>
    </ScreenWrapper>
  );
}

const VideoPlayer = ({ uri, style, muted = false }: { uri: string; style?: any; muted?: boolean }) => {
  const player = useVideoPlayer({ uri }, (player) => {
    player.loop = true;
    player.muted = muted;
    if (!muted) player.play();
  });

  return <VideoView style={style} player={player} nativeControls={!muted} />;
};


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  headerContainer: {
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#000" },
  mainPreview: { width: "100%", height: width * 0.8, borderRadius: 12 },
  buttonsRow: { flexDirection: "row", justifyContent: "space-around", marginVertical: 12 },
  pickButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#8C5EFF",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 25,
    gap: 6,
  },
  pickButtonText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  gridContainer: { paddingHorizontal: 10 },
  thumbnailWrapper: { position: "relative", margin: 5 },
  thumbnail: {
    width: (width - 40) / 3,
    height: (width - 40) / 3,
    borderRadius: 12,
  },
  removeButton: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 10,
    padding: 2,
  },
  nextButton: {
    backgroundColor: "#8C5EFF",
    marginHorizontal: 20,
    marginBottom: 25,
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: "center",
  },
  nextButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
