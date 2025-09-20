import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import EnhancedCamera from "./enhancedCamera";

export default function StoryCameraScreen() {
  const router = useRouter();
  const [cameraOpen, setCameraOpen] = useState(true);

  const handleClose = () => {
    setCameraOpen(false);
    router.back();
  };

  return (
    <Modal visible={cameraOpen} animationType="slide">
      <EnhancedCamera onClose={handleClose} mode="story" />
    </Modal>
  );
}
