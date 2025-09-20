import React, { useState } from "react";
import { View, Image, TouchableOpacity, StyleSheet, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import EnhancedCamera from "./enhancedCamera"; // ✅ Import enhanced camera

interface CreateStoryButtonProps {
  userImage?: string|null;
}

const CreateStoryButton: React.FC<CreateStoryButtonProps> = ({ userImage }) => {
  const [cameraOpen, setCameraOpen] = useState(false);
  
  const defaultImage =
    "https://cdn-icons-png.flaticon.com/512/149/149071.png"; // default user image

  return (
    <>
      <TouchableOpacity onPress={() => setCameraOpen(true)} activeOpacity={0.8}>
        <View style={styles.container}>
          <Image
            source={{ uri: userImage || defaultImage }}
            style={styles.profileImage}
          />
          <View style={styles.plusIcon}>
            <Ionicons name="add" size={16} color="#fff" />
          </View>
        </View>
      </TouchableOpacity>

      {/* ✅ Enhanced Camera Modal */}
      <Modal visible={cameraOpen} animationType="slide">
        <EnhancedCamera onClose={() => setCameraOpen(false)} mode="story" />
      </Modal>
    </>
  );
};

export default CreateStoryButton;

const styles = StyleSheet.create({
  container: {
    width: 62,
    height: 62,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: "#ccc",
    top: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 38,
  },
  plusIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#6200EE",
    borderRadius: 10,
    padding: 2,
    borderWidth: 2,
    borderColor: "#fff",
  },
});
