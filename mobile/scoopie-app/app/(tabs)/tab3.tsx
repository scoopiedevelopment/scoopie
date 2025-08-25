import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "expo-router";
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Image, ActivityIndicator } from "react-native";
import { CameraView, useCameraPermissions, CameraType, FlashMode } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { Ionicons, Feather } from "@expo/vector-icons";
import ScreenWrapper from "@/components/common/ScreenWrapper";
import { uploadImage } from "@/api/uploadService";

const { width, height } = Dimensions.get("window");

export default function CustomCamera({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraType, setCameraType] = useState<CameraType>("back");
  const [flash, setFlash] = useState<FlashMode>("off");
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission]);

  const takePicture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync();
      setCapturedPhoto(photo?.uri); // photo preview ke liye set karo
    }
  };

  const pickFromGallery = async () => {
    router.push("/mediaUpload");
  };

  const retakePhoto = () => {
    setCapturedPhoto(null); // wapas camera par
  };

  const confirmPhoto = async () => {
    const imageUrls: string[] = [];
    // yahan photo upload/crop/next screen ka logic
    setLoading(true)
    if (capturedPhoto) {
      const response = await uploadImage(capturedPhoto);
      if (response.success && response.data.urls?.length > 0) {
        imageUrls.push(response.data.urls[0]);
        setLoading(false)
        router.push({
          pathname: '/textPostScreen',
          params: {
            uploadedImageUrls: encodeURIComponent(JSON.stringify(imageUrls)),
          },
        });
      }

    }
  };

  if (!permission || !permission.granted) {
    return <Text style={{ color: "white" }}>Camera permission not granted</Text>;
  }

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        {capturedPhoto ? (
          // Preview Screen
          <View style={styles.previewContainer}>
            <Image source={{ uri: capturedPhoto }} style={styles.previewImage} />
            <View style={styles.previewButtons}>
              <TouchableOpacity onPress={retakePhoto} style={styles.retakeButton}>
                <Text style={styles.buttonText}>Retake</Text>
              </TouchableOpacity>
              {!loading && <TouchableOpacity onPress={confirmPhoto} style={styles.confirmButton}>
                <Text style={styles.buttonText}>Next</Text>
              </TouchableOpacity>}
              {loading && <ActivityIndicator size="large" color="#8C5EFF" style={{ margin: 10 }} />}
            </View>

          </View>
        ) : (
          // Camera Screen
          <CameraView
            style={styles.camera}
            facing={cameraType}
            flash={flash}
            ref={cameraRef}
          >
            {/* Top Icons */}
            <View style={styles.topIcons}>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={28} color="white" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setFlash(flash === "off" ? "on" : "off")}>
                <Ionicons name={flash === "off" ? "flash-off" : "flash"} size={24} color="white" />
              </TouchableOpacity>
              <TouchableOpacity>
                <Feather name="clock" size={24} color="white" />
              </TouchableOpacity>
              <TouchableOpacity>
                <Feather name="grid" size={24} color="white" />
              </TouchableOpacity>
              <TouchableOpacity>
                <Feather name="moon" size={24} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() =>
                  setCameraType(cameraType === "back" ? "front" : "back")
                }
              >
                <Ionicons name="camera-reverse" size={24} color="white" />
              </TouchableOpacity>
            </View>

            {/* Bottom Buttons */}
            <View style={styles.bottomContainer}>
              <View style={styles.tabRow}>
                <Text style={styles.tabText}>Photos</Text>
                <Text style={styles.tabText}>Clips</Text>
                <Text style={styles.tabText}>Text</Text>
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity onPress={pickFromGallery}>
                  <Ionicons name="images" size={32} color="white" />
                </TouchableOpacity>

                <TouchableOpacity onPress={takePicture} style={styles.captureButton} />

                <TouchableOpacity>
                  <Ionicons name="refresh" size={32} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          </CameraView>
        )}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "black" },
  camera: { flex: 1 },
  topIcons: {
    position: "absolute",
    top: 40,
    right: 20,
    alignItems: "flex-end",
    gap: 20,
  },
  bottomContainer: {
    position: "absolute",
    bottom: 40,
    width: width,
    alignItems: "center",
  },
  tabRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "60%",
    marginBottom: 20,
  },
  tabText: { color: "white", fontSize: 16 },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "60%",
    alignItems: "center",
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "white",
  },
  previewContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  previewImage: { width: width, height: '80%', resizeMode: "cover" },
  previewButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    padding: 20,
  },
  retakeButton: {
    padding: 15,
    backgroundColor: "red",
    borderRadius: 10,
  },
  confirmButton: {
    padding: 15,
    backgroundColor: "green",
    borderRadius: 10,
  },
  buttonText: { color: "white", fontSize: 16 },
});
