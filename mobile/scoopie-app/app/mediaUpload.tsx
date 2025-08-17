import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, FlatList, StyleSheet, Dimensions, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useRouter } from 'expo-router';
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import ScreenWrapper from '@/components/common/ScreenWrapper';

const { width } = Dimensions.get('window');

export default function FirstScreen() {
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const router = useRouter();

  const pickMedia = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "We need access to your media library.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsMultipleSelection: true,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
      const savedUris: string[] = [];

      for (const asset of result.assets) {
        const pickedUri = asset.uri;
        let fileName = pickedUri.split("/").pop() || `image_${Date.now()}.jpg`;
        const newPath = `${FileSystem.documentDirectory}${fileName}`;

        await FileSystem.copyAsync({
          from: pickedUri,
          to: newPath,
        });

        savedUris.push(newPath);
      }

      const updatedList = [...selectedImages, ...savedUris];
      setSelectedImages(updatedList);
      if (!previewImage) setPreviewImage(updatedList[0]);
    }
  };

  const removeImage = (uri: string) => {
    const updated = selectedImages.filter(img => img !== uri);
    setSelectedImages(updated);
    if (previewImage === uri) {
      setPreviewImage(updated.length > 0 ? updated[0] : null);
    }
  };

  const goToNextScreen = () => {
    router.push({
      pathname: "/textPostScreen",
      params: { mediaUris: encodeURIComponent(JSON.stringify(selectedImages)) },
    });
  };

  return (
    <ScreenWrapper gradient>
      <View style={styles.container}>
        <LinearGradient
          colors={['#FFF7D2', 'rgba(86, 55, 158, 0.35)']}
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

        {previewImage && (
          <Image
            source={{ uri: previewImage }}
            style={styles.mainPreview}
          />
        )}

        <TouchableOpacity style={styles.pickButton} onPress={pickMedia}>
          <Ionicons name="images-outline" size={18} color="#fff" />
          <Text style={styles.pickButtonText}>Select Images</Text>
        </TouchableOpacity>

        <FlatList
          data={selectedImages}
          numColumns={3}
          contentContainerStyle={styles.gridContainer}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => setPreviewImage(item)}>
              <View style={styles.thumbnailWrapper}>
                <Image source={{ uri: item }} style={styles.thumbnail} />
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeImage(item)}
                >
                  <Ionicons name="close-circle" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
        />

        {selectedImages.length > 0 && (
          <TouchableOpacity style={styles.nextButton} onPress={goToNextScreen}>
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  headerContainer: {
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#000' },
  mainPreview: { width: '100%', height: width * 0.8, resizeMode: 'cover' },
  pickButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8C5EFF',
    marginHorizontal: 20,
    marginVertical: 12,
    paddingVertical: 12,
    borderRadius: 25,
    justifyContent: 'center',
    gap: 8
  },
  pickButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  gridContainer: { paddingHorizontal: 10 },
  thumbnailWrapper: { position: 'relative', margin: 5 },
  thumbnail: {
    width: (width - 40) / 3,
    height: (width - 40) / 3,
    borderRadius: 12
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
    padding: 2,
  },
  nextButton: {
    backgroundColor: '#8C5EFF',
    marginHorizontal: 20,
    marginBottom: 25,
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
  },
  nextButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
