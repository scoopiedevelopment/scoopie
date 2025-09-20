import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "expo-router";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions, 
  Image, 
  ActivityIndicator,
  ScrollView,
  Animated,
  Alert
} from "react-native";
import { CameraView, useCameraPermissions, CameraType, FlashMode } from "expo-camera";
import * as MediaLibrary from 'expo-media-library';
import { Audio } from 'expo-av';
import { Video, ResizeMode } from "expo-av";
import * as ImagePicker from "expo-image-picker";
import { Ionicons, Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import ScreenWrapper from "@/components/common/ScreenWrapper";
import { uploadImage, uploadClip } from "@/api/uploadService";
import { createStory } from "@/api/storyService";
import { CAMERA_FILTERS, getFilterPreviewColor } from "@/services/filterService";

const { width, height } = Dimensions.get("window");

// Use filters from service
const FILTERS = CAMERA_FILTERS;

interface EnhancedCameraProps {
  onClose: () => void;
  mode?: 'story' | 'post' | 'clip';
}

export default function EnhancedCamera({ onClose, mode = 'story' }: EnhancedCameraProps) {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [mediaLibraryPermission, requestMediaLibraryPermission] = MediaLibrary.usePermissions();
  const [audioPermission, requestAudioPermission] = Audio.usePermissions();
  const [cameraType, setCameraType] = useState<CameraType>("back");
  const [flash, setFlash] = useState<FlashMode>("off");
  const [selectedFilter, setSelectedFilter] = useState('normal');
  const [capturedMedia, setCapturedMedia] = useState<{ uri: string; type: 'photo' | 'video' } | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const [showTimer, setShowTimer] = useState(false);
  const [currentMode, setCurrentMode] = useState<'story' | 'post' | 'clip'>(mode);
  
  const cameraRef = useRef<CameraView>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const requestAllPermissions = async () => {
      console.log('Requesting all permissions...');
      
      try {
        // Request camera permission
        if (!permission) {
          console.log('Requesting camera permission...');
          const cameraResult = await requestPermission();
          console.log('Camera permission result:', cameraResult);
        }
        
        // Request media library permission for video recording
        if (!mediaLibraryPermission) {
          console.log('Requesting media library permission...');
          const mediaResult = await requestMediaLibraryPermission();
          console.log('Media library permission result:', mediaResult);
        }
        
        // Request audio permission for video recording
        if (!audioPermission) {
          console.log('Requesting audio permission...');
          const audioResult = await requestAudioPermission();
          console.log('Audio permission result:', audioResult);
        }
        
        console.log('Final Camera permission:', permission?.granted ? 'Granted' : 'Denied');
        console.log('Final Media library permission:', mediaLibraryPermission?.granted ? 'Granted' : 'Denied');
        console.log('Final Audio permission:', audioPermission?.granted ? 'Granted' : 'Denied');
      } catch (error) {
        console.error('Error requesting permissions:', error);
      }
    };
    
    requestAllPermissions();
  }, []);

  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  const startTimer = () => {
    setTimer(3);
    setShowTimer(true);
    
    timerIntervalRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          setShowTimer(false);
          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
        });
        setCapturedMedia({ uri: photo.uri, type: 'photo' });
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Error', 'Failed to take picture');
      }
    }
  };

  const checkAndRequestPermissions = async () => {
    console.log('Checking permissions...');
    
    let cameraGranted = permission?.granted;
    let mediaGranted = mediaLibraryPermission?.granted;
    let audioGranted = audioPermission?.granted;
    
    // Request camera permission if not granted
    if (!cameraGranted) {
      console.log('Requesting camera permission...');
      const cameraResult = await requestPermission();
      cameraGranted = cameraResult.granted;
      console.log('Camera permission result:', cameraResult);
    }
    
    // Request media library permission if not granted
    if (!mediaGranted) {
      console.log('Requesting media library permission...');
      const mediaResult = await requestMediaLibraryPermission();
      mediaGranted = mediaResult.granted;
      console.log('Media library permission result:', mediaResult);
    }
    
    // Request audio permission if not granted
    if (!audioGranted) {
      console.log('Requesting audio permission...');
      const audioResult = await requestAudioPermission();
      audioGranted = audioResult.granted;
      console.log('Audio permission result:', audioResult);
    }
    
    return { cameraGranted, mediaGranted, audioGranted };
  };

  const startVideoRecording = async () => {
    console.log('Starting video recording with permission check...');
    
    // Check and request permissions
    const { cameraGranted, mediaGranted, audioGranted } = await checkAndRequestPermissions();
    
    if (!cameraGranted) {
      Alert.alert(
        'Camera Permission Required', 
        'Camera permission is required for video recording. Please grant camera permission in your device settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Try Again', onPress: startVideoRecording }
        ]
      );
      return;
    }
    
    if (!audioGranted) {
      Alert.alert(
        'Audio Permission Required', 
        'Audio permission is required for video recording. Please grant microphone permission in your device settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Try Again', onPress: startVideoRecording }
        ]
      );
      return;
    }
    
    // Media library permission is optional for basic recording
    if (!mediaGranted) {
      console.log('Media library permission not granted, but continuing with recording...');
    }
    
    if (!cameraRef.current) {
      console.log('Camera ref is null');
      Alert.alert('Error', 'Camera not ready');
      return;
    }
    
    if (isRecording) {
      console.log('Already recording');
      return;
    }
    
    try {
      console.log('Preparing camera for recording...');
      setIsRecording(true);
      setRecordingDuration(0);
      
      // Wait longer for camera to be fully ready
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Camera ready, starting recording...');
      
      // Start recording first, then start duration counter
      const recordingPromise = cameraRef.current.recordAsync({
        quality: '720p',
        maxDuration: currentMode === 'story' ? 15 : 60,
        mute: !audioGranted,
        android: {
          extension: '.mp4',
        },
        ios: {
          extension: '.mov',
        },
      });
      
      console.log('Recording started, beginning duration counter...');
      
      // Start duration counter AFTER recording has started
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => {
          const newDuration = prev + 1;
          console.log('Recording duration:', newDuration);
          
          // Auto-stop for story mode at 15 seconds (but ensure minimum 3 seconds)
          if (currentMode === 'story' && newDuration >= 15 && newDuration >= 3) {
            console.log('Auto-stopping recording at 15 seconds');
            stopVideoRecording();
          }
          
          return newDuration;
        });
      }, 1000);
      
      // Wait for recording to complete
      const video = await recordingPromise;
      
      console.log('Video recorded successfully:', video);
      if (video && video.uri) {
        setCapturedMedia({ uri: video.uri, type: 'video' });
        console.log('Video set to captured media:', video.uri);
      } else {
        console.log('No video URI received');
        Alert.alert('Error', 'No video was recorded');
      }
    } catch (error) {
      console.error('Error recording video:', error);
      
      // Handle specific permission errors
      if (error.message?.includes('RECORD_AUDIO') || error.message?.includes('audio')) {
        Alert.alert(
          'Audio Permission Required', 
          'Microphone permission is required for video recording. Would you like to try recording without audio?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Record Muted', onPress: () => startVideoRecordingMuted() }
          ]
        );
      } else if (error.message?.includes('permission')) {
        Alert.alert(
          'Permission Error', 
          'Camera recording failed due to permissions. Would you like to try the alternative recording method?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Try Alternative', onPress: recordVideoFallback }
          ]
        );
      } else if (error.message?.includes('stopped before any data')) {
        Alert.alert(
          'Recording Too Short', 
          'Recording was stopped too quickly. Please use the Timer Recording button for guaranteed success.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Use Timer Recording', onPress: startTimerRecording }
          ]
        );
      } else {
        Alert.alert(
          'Recording Failed', 
          'Camera recording failed. Would you like to try the alternative recording method?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Try Alternative', onPress: recordVideoFallback }
          ]
        );
      }
    } finally {
      console.log('Recording finished, cleaning up...');
      setIsRecording(false);
      setRecordingDuration(0);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  };

  // Muted video recording (without audio permission)
  const startVideoRecordingMuted = async () => {
    console.log('Starting muted video recording...');
    
    if (!cameraRef.current) {
      console.log('Camera ref is null');
      Alert.alert('Error', 'Camera not ready');
      return;
    }
    
    if (isRecording) {
      console.log('Already recording');
      return;
    }
    
    try {
      setIsRecording(true);
      setRecordingDuration(0);
      
      // Start duration counter
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => {
          const newDuration = prev + 1;
          console.log('Muted recording duration:', newDuration);
          
          // Auto-stop for story mode at 15 seconds
          if (currentMode === 'story' && newDuration >= 15) {
            console.log('Auto-stopping muted recording at 15 seconds');
            stopVideoRecording();
          }
          
          return newDuration;
        });
      }, 1000);
      
      console.log('Calling recordAsync with mute=true...');
      
      // Record with audio muted
      const video = await cameraRef.current.recordAsync({
        quality: '720p',
        maxDuration: currentMode === 'story' ? 15 : 60,
        mute: true, // Force mute
      });
      
      console.log('Muted video recorded successfully:', video);
      if (video && video.uri) {
        setCapturedMedia({ uri: video.uri, type: 'video' });
        console.log('Muted video set to captured media:', video.uri);
      } else {
        console.log('No muted video URI received');
        Alert.alert('Error', 'No video was recorded');
      }
    } catch (error) {
      console.error('Error recording muted video:', error);
      Alert.alert('Error', 'Failed to record muted video: ' + (error.message || 'Unknown error'));
    } finally {
      console.log('Muted recording finished, cleaning up...');
      setIsRecording(false);
      setRecordingDuration(0);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  };

  const stopVideoRecording = () => {
    if (cameraRef.current && isRecording) {
      console.log('Stopping video recording...');
      console.log('Current recording duration:', recordingDuration);
      
      try {
        cameraRef.current.stopRecording();
        console.log('Stop recording called');
      } catch (error) {
        console.error('Error stopping recording:', error);
      }
    }
  };

  // Timer-based recording that ensures minimum duration
  const startTimerRecording = async () => {
    console.log('Starting timer-based recording...');
    
    // Check permissions first
    const { cameraGranted, mediaGranted, audioGranted } = await checkAndRequestPermissions();
    
    if (!cameraGranted || !audioGranted) {
      Alert.alert('Permissions Required', 'Camera and audio permissions are required for video recording');
      return;
    }
    
    if (!cameraRef.current || isRecording) {
      return;
    }
    
    try {
      setIsRecording(true);
      setRecordingDuration(0);
      
      console.log('Preparing timer recording...');
      
      // Wait for camera to be ready
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Starting timer recording...');
      
      // Start recording
      const recordingPromise = cameraRef.current.recordAsync({
        quality: '720p',
        maxDuration: currentMode === 'story' ? 15 : 60,
        mute: !audioGranted,
        android: {
          extension: '.mp4',
        },
        ios: {
          extension: '.mov',
        },
      });
      
      // Start duration counter
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => {
          const newDuration = prev + 1;
          console.log('Timer recording duration:', newDuration);
          return newDuration;
        });
      }, 1000);
      
      // Wait for minimum duration before allowing stop
      const minDuration = currentMode === 'story' ? 3 : 5;
      console.log(`Waiting for minimum ${minDuration} seconds...`);
      
      // Auto-stop after minimum duration
      setTimeout(() => {
        if (cameraRef.current && isRecording) {
          console.log('Auto-stopping after minimum duration');
          cameraRef.current.stopRecording();
        }
      }, minDuration * 1000);
      
      // Wait for recording to complete
      const video = await recordingPromise;
      
      console.log('Timer recording completed:', video);
      if (video && video.uri) {
        setCapturedMedia({ uri: video.uri, type: 'video' });
        console.log('Video saved successfully');
      } else {
        console.log('No video URI received');
        Alert.alert('Error', 'No video was recorded');
      }
    } catch (error) {
      console.error('Timer recording error:', error);
      Alert.alert('Recording Error', 'Failed to record video: ' + error.message);
    } finally {
      setIsRecording(false);
      setRecordingDuration(0);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  };

  // Hold-to-record method - only stops when user releases
  const startHoldRecording = async () => {
    console.log('Starting hold-to-record...');
    
    // Check permissions first
    const { cameraGranted, mediaGranted, audioGranted } = await checkAndRequestPermissions();
    
    if (!cameraGranted || !audioGranted) {
      Alert.alert('Permissions Required', 'Camera and audio permissions are required for video recording');
      return;
    }
    
    if (!cameraRef.current || isRecording) {
      return;
    }
    
    try {
      setIsRecording(true);
      setRecordingDuration(0);
      
      console.log('Preparing hold recording...');
      
      // Wait for camera to be ready
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Starting hold recording...');
      
      // Start recording
      const recordingPromise = cameraRef.current.recordAsync({
        quality: '720p',
        maxDuration: currentMode === 'story' ? 15 : 60,
        mute: !audioGranted,
        android: {
          extension: '.mp4',
        },
        ios: {
          extension: '.mov',
        },
      });
      
      // Start duration counter
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => {
          const newDuration = prev + 1;
          console.log('Hold recording duration:', newDuration);
          return newDuration;
        });
      }, 1000);
      
      // Wait for recording to complete
      const video = await recordingPromise;
      
      console.log('Hold recording completed:', video);
      if (video && video.uri) {
        setCapturedMedia({ uri: video.uri, type: 'video' });
        console.log('Video saved successfully');
      } else {
        console.log('No video URI received');
        Alert.alert('Error', 'No video was recorded');
      }
    } catch (error) {
      console.error('Hold recording error:', error);
      Alert.alert('Recording Error', 'Failed to record video: ' + error.message);
    } finally {
      setIsRecording(false);
      setRecordingDuration(0);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  };

  // Guaranteed recording method - uses ImagePicker as fallback
  const startGuaranteedRecording = async () => {
    console.log('Starting guaranteed recording...');
    
    // Check permissions first
    const { cameraGranted, mediaGranted, audioGranted } = await checkAndRequestPermissions();
    
    if (!cameraGranted) {
      Alert.alert('Permissions Required', 'Camera permission is required for video recording');
      return;
    }
    
    try {
      console.log('Using ImagePicker camera for guaranteed recording...');
      
      // Use ImagePicker camera as it's more reliable
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        aspect: [9, 16],
        quality: 0.8,
        videoMaxDuration: currentMode === 'story' ? 15 : 60,
      });
      
      console.log('ImagePicker camera result:', result);
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const video = result.assets[0];
        console.log('Video recorded successfully:', video);
        
        if (video.uri) {
          setCapturedMedia({ uri: video.uri, type: 'video' });
          console.log('Video set to captured media:', video.uri);
        } else {
          console.log('No video URI received');
          Alert.alert('Error', 'No video was recorded');
        }
      } else {
        console.log('Recording was canceled');
      }
    } catch (error) {
      console.error('Guaranteed recording error:', error);
      Alert.alert('Recording Error', 'Failed to record video: ' + error.message);
    }
  };

  // Simple recording method - minimal options
  const startSimpleRecording = async () => {
    console.log('Starting simple recording...');
    
    if (!cameraRef.current || isRecording) {
      return;
    }
    
    try {
      setIsRecording(true);
      console.log('Starting simple recording...');
      
      // Simple recording with minimal options
      const video = await cameraRef.current.recordAsync({
        quality: '720p',
        maxDuration: currentMode === 'story' ? 15 : 60,
      });
      
      console.log('Simple recording completed:', video);
      if (video && video.uri) {
        setCapturedMedia({ uri: video.uri, type: 'video' });
        console.log('Video saved successfully');
      } else {
        console.log('No video URI received');
        Alert.alert('Error', 'No video was recorded');
      }
    } catch (error) {
      console.error('Simple recording error:', error);
      Alert.alert('Recording Error', 'Failed to record video: ' + error.message);
    } finally {
      setIsRecording(false);
    }
  };

  const pickFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [9, 16],
        quality: 0.8,
        videoMaxDuration: currentMode === 'story' ? 15 : 60,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setCapturedMedia({ 
          uri: asset.uri, 
          type: asset.type === 'video' ? 'video' : 'photo' 
        });
      }
    } catch (error) {
      console.error('Error picking from gallery:', error);
      Alert.alert('Error', 'Failed to pick from gallery');
    }
  };

  // Fallback video recording using ImagePicker
  const recordVideoFallback = async () => {
    try {
      console.log('Using fallback video recording...');
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        aspect: [9, 16],
        quality: 0.8,
        videoMaxDuration: currentMode === 'story' ? 15 : 60,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setCapturedMedia({ 
          uri: asset.uri, 
          type: 'video' 
        });
        console.log('Fallback video recorded:', asset.uri);
      }
    } catch (error) {
      console.error('Error with fallback video recording:', error);
      Alert.alert('Error', 'Failed to record video using fallback method');
    }
  };

  const retakeMedia = () => {
    setCapturedMedia(null);
  };

  const confirmMedia = async () => {
    if (!capturedMedia) return;
    
    console.log('Starting media upload...');
    console.log('Captured media:', capturedMedia);
    console.log('Current mode:', currentMode);
    
    setLoading(true);
    try {
      let mediaUrl: string;
      
      if (capturedMedia.type === 'video') {
        console.log('Uploading video:', capturedMedia.uri);
        const response = await uploadClip(capturedMedia.uri);
        console.log('Video upload response:', response);
        if (response.success && response.data.url) {
          mediaUrl = response.data.url;
          console.log('Video upload successful:', mediaUrl);
        } else {
          throw new Error('Failed to upload video');
        }
      } else {
        console.log('Uploading image:', capturedMedia.uri);
        const response = await uploadImage(capturedMedia.uri);
        console.log('Image upload response:', response);
        if (response.success && response.data.urls?.length > 0) {
          mediaUrl = response.data.urls[0];
          console.log('Image upload successful:', mediaUrl);
        } else {
          throw new Error('Failed to upload image');
        }
      }

      // Handle different modes
      if (currentMode === 'story') {
        console.log('Creating story with:', { mediaUrl, mediaType: capturedMedia.type === 'video' ? 'Video' : 'Image' });
        const storyResponse = await createStory({
          mediaUrl: mediaUrl,
          mediaType: capturedMedia.type === 'video' ? 'Video' : 'Image',
        });
        console.log('Story created successfully:', storyResponse);
        
        // Show success message
        Alert.alert(
          'Success!', 
          'Your story has been uploaded successfully!',
          [{ 
            text: 'OK',
            onPress: () => {
              // Close camera and navigate back
              onClose();
              router.replace("/(tabs)/tab1");
            }
          }]
        );
      } else if (currentMode === 'post') {
        // Navigate to post creation screen
        router.push({
          pathname: '/textPostScreen',
          params: {
            uploadedImageUrls: capturedMedia.type === 'photo' 
              ? encodeURIComponent(JSON.stringify([mediaUrl]))
              : undefined,
            uploadedVideoUrl: capturedMedia.type === 'video'
              ? encodeURIComponent(mediaUrl)
              : undefined,
          },
        });
      } else if (currentMode === 'clip') {
        // Navigate to clip creation screen
        router.push({
          pathname: '/textPostScreen',
          params: {
            uploadedVideoUrl: encodeURIComponent(mediaUrl),
          },
        });
      }
    } catch (error) {
      console.error('Error uploading media:', error);
      console.error('Error details:', error.message || error);
      Alert.alert('Upload Error', `Failed to upload media: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleFlash = () => {
    setFlash(flash === "off" ? "on" : "off");
  };

  const toggleCamera = () => {
    setCameraType(cameraType === "back" ? "front" : "back");
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!permission || !permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>
          Camera permission not granted
        </Text>
        <Text style={styles.permissionSubtext}>
          Camera permission is required for taking photos and videos
        </Text>
        <TouchableOpacity 
          onPress={async () => {
            await requestPermission();
          }} 
          style={styles.permissionButton}
        >
          <Text style={styles.permissionButtonText}>Grant Camera Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        {capturedMedia ? (
          // Preview Screen
          <View style={styles.previewContainer}>
            {capturedMedia.type === 'video' ? (
              <Video
                source={{ uri: capturedMedia.uri }}
                style={styles.previewVideo}
                useNativeControls={false}
                resizeMode={ResizeMode.COVER}
                shouldPlay
                isLooping
              />
            ) : (
              <Image source={{ uri: capturedMedia.uri }} style={styles.previewImage} />
            )}
            
            <View style={styles.previewOverlay}>
              <View style={styles.previewButtons}>
                <TouchableOpacity onPress={retakeMedia} style={styles.retakeButton}>
                  <Ionicons name="refresh" size={24} color="white" />
                  <Text style={styles.buttonText}>Retake</Text>
                </TouchableOpacity>
                
                {!loading && (
                  <TouchableOpacity onPress={confirmMedia} style={styles.confirmButton}>
                    <Ionicons name="checkmark" size={24} color="white" />
                    <Text style={styles.buttonText}>Share</Text>
                  </TouchableOpacity>
                )}
                
                {loading && (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#8C5EFF" />
                    <Text style={styles.loadingText}>Uploading...</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        ) : (
          // Camera Screen
          <View style={styles.cameraContainer}>
            <CameraView
              style={styles.camera}
              facing={cameraType}
              flash={flash}
              ref={cameraRef}
            >
              {/* Timer Overlay */}
              {showTimer && (
                <Animated.View style={[styles.timerOverlay, { opacity: fadeAnim }]}>
                  <Text style={styles.timerText}>{timer}</Text>
                </Animated.View>
              )}

              {/* Recording Duration */}
              {isRecording && (
                <View style={styles.recordingOverlay}>
                  <View style={styles.recordingIndicator} />
                  <Text style={styles.recordingText}>
                    {formatDuration(recordingDuration)}
                  </Text>
                </View>
              )}

              {/* Debug Status */}
              <View style={styles.debugStatus}>
                <Text style={styles.debugText}>
                  Camera: {cameraRef.current ? 'Ready' : 'Not Ready'} | 
                  Recording: {isRecording ? 'Yes' : 'No'} | 
                  Mode: {currentMode}
                </Text>
                <Text style={styles.debugText}>
                  Camera Perm: {permission?.granted ? 'Yes' : 'No'} | 
                  Media Perm: {mediaLibraryPermission?.granted ? 'Yes' : 'No'} |
                  Audio Perm: {audioPermission?.granted ? 'Yes' : 'No'}
                </Text>
              </View>

              {/* Top Controls */}
              <View style={styles.topControls}>
                <TouchableOpacity onPress={onClose} style={styles.controlButton}>
                  <Ionicons name="close" size={28} color="white" />
                </TouchableOpacity>
                
                <View style={styles.topRightControls}>
                  <TouchableOpacity onPress={toggleFlash} style={styles.controlButton}>
                    <Ionicons 
                      name={flash === "off" ? "flash-off" : "flash"} 
                      size={24} 
                      color="white" 
                    />
                  </TouchableOpacity>
                  
                  <TouchableOpacity onPress={startTimer} style={styles.controlButton}>
                    <Ionicons name="timer" size={24} color="white" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity onPress={toggleCamera} style={styles.controlButton}>
                    <Ionicons name="camera-reverse" size={24} color="white" />
                  </TouchableOpacity>
                  
                  {/* Video recording button */}
                  <TouchableOpacity 
                    onPress={() => {
                      console.log('Video recording button pressed');
                      console.log('Camera Permission:', permission?.granted);
                      console.log('Media Library Permission:', mediaLibraryPermission?.granted);
                      console.log('Audio Permission:', audioPermission?.granted);
                      startVideoRecording();
                    }} 
                    style={[styles.controlButton, { backgroundColor: isRecording ? 'red' : 'rgba(255,0,0,0.7)' }]}
                  >
                    <Ionicons name="videocam" size={20} color="white" />
                  </TouchableOpacity>
                  
                  {/* Fallback video recording button */}
                  <TouchableOpacity 
                    onPress={recordVideoFallback}
                    style={[styles.controlButton, { backgroundColor: 'rgba(0,255,0,0.7)' }]}
                  >
                    <Ionicons name="camera" size={20} color="white" />
                  </TouchableOpacity>
                  
                  {/* Simple test recording button */}
                  <TouchableOpacity 
                    onPress={startSimpleRecording}
                    style={[styles.controlButton, { backgroundColor: 'rgba(0,0,255,0.7)' }]}
                  >
                    <Ionicons name="play" size={20} color="white" />
                  </TouchableOpacity>
                  
                  {/* Timer recording button */}
                  <TouchableOpacity 
                    onPress={startTimerRecording}
                    style={[styles.controlButton, { backgroundColor: 'rgba(255,165,0,0.7)' }]}
                  >
                    <Ionicons name="timer" size={20} color="white" />
                  </TouchableOpacity>
                  
                  {/* Hold recording button */}
                  <TouchableOpacity 
                    onPress={startHoldRecording}
                    style={[styles.controlButton, { backgroundColor: 'rgba(0,255,0,0.7)' }]}
                  >
                    <Ionicons name="hand-left" size={20} color="white" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Filter Selection */}
              {showFilters && (
                <View style={styles.filterContainer}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {FILTERS.map((filter) => (
                      <TouchableOpacity
                        key={filter.id}
                        onPress={() => setSelectedFilter(filter.id)}
                        style={[
                          styles.filterItem,
                          selectedFilter === filter.id && styles.selectedFilter
                        ]}
                      >
                        <View style={[
                          styles.filterPreview,
                          { backgroundColor: getFilterPreviewColor(filter.id) }
                        ]}>
                          <Text style={styles.filterName}>{filter.name}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Bottom Controls */}
              <View style={styles.bottomControls}>
                <View style={styles.modeTabs}>
                  <TouchableOpacity 
                    style={[styles.modeTab, currentMode === 'story' && styles.activeModeTab]}
                    onPress={() => setCurrentMode('story')}
                  >
                    <Text style={[styles.modeTabText, currentMode === 'story' && styles.activeModeTabText]}>
                      Story
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.modeTab, currentMode === 'post' && styles.activeModeTab]}
                    onPress={() => setCurrentMode('post')}
                  >
                    <Text style={[styles.modeTabText, currentMode === 'post' && styles.activeModeTabText]}>
                      Post
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.modeTab, currentMode === 'clip' && styles.activeModeTab]}
                    onPress={() => setCurrentMode('clip')}
                  >
                    <Text style={[styles.modeTabText, currentMode === 'clip' && styles.activeModeTabText]}>
                      Reel
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.actionControls}>
                  <TouchableOpacity onPress={pickFromGallery} style={styles.galleryButton}>
                    <Ionicons name="images" size={32} color="white" />
                  </TouchableOpacity>

                  <View style={styles.captureContainer}>
                    <TouchableOpacity
                      onPress={takePicture}
                      onLongPress={startGuaranteedRecording}
                      onPressOut={stopVideoRecording}
                      style={[
                        styles.captureButton,
                        isRecording && styles.recordingButton
                      ]}
                      activeOpacity={0.8}
                    >
                      <View style={[
                        styles.captureButtonInner,
                        isRecording && styles.recordingButtonInner
                      ]} />
                    </TouchableOpacity>
                    
                    {/* Recording indicator */}
                    {isRecording && (
                      <View style={styles.recordingIndicator}>
                        <View style={styles.recordingDot} />
                        <Text style={styles.recordingText}>REC</Text>
                      </View>
                    )}
                  </View>

                  <TouchableOpacity onPress={toggleFilters} style={styles.filterButton}>
                    <Ionicons name="color-palette" size={32} color="white" />
                  </TouchableOpacity>
                  
                  {/* Permission request button */}
                  <TouchableOpacity 
                    onPress={async () => {
                      console.log('Requesting permissions...');
                      if (!permission?.granted) {
                        await requestPermission();
                      }
                      if (!mediaLibraryPermission?.granted) {
                        await requestMediaLibraryPermission();
                      }
                      if (!audioPermission?.granted) {
                        await requestAudioPermission();
                      }
                    }}
                    style={[styles.filterButton, { backgroundColor: 'rgba(255,255,0,0.7)' }]}
                  >
                    <Ionicons name="shield-checkmark" size={24} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            </CameraView>
          </View>
        )}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  permissionText: {
    color: 'white',
    fontSize: 18,
    marginBottom: 10,
    textAlign: 'center',
  },
  permissionSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  permissionButton: {
    backgroundColor: '#8C5EFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  timerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  timerText: {
    fontSize: 120,
    fontWeight: 'bold',
    color: 'white',
  },
  recordingOverlay: {
    position: 'absolute',
    top: 100,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordingIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'red',
    marginRight: 8,
  },
  recordingText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  debugStatus: {
    position: 'absolute',
    top: 120,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  debugText: {
    color: 'white',
    fontSize: 12,
  },
  topControls: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  topRightControls: {
    flexDirection: 'row',
    gap: 20,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    position: 'absolute',
    bottom: 200,
    left: 0,
    right: 0,
    height: 80,
  },
  filterItem: {
    marginHorizontal: 8,
    alignItems: 'center',
  },
  selectedFilter: {
    borderWidth: 2,
    borderColor: '#8C5EFF',
    borderRadius: 8,
  },
  filterPreview: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterName: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  modeTabs: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 25,
    padding: 4,
  },
  modeTab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  modeTabText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  activeModeTab: {
    backgroundColor: '#8C5EFF',
  },
  activeModeTabText: {
    color: 'white',
  },
  actionControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '80%',
  },
  galleryButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureContainer: {
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  recordingButton: {
    backgroundColor: 'red',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
  },
  recordingButtonInner: {
    backgroundColor: 'red',
  },
  recordingIndicator: {
    position: 'absolute',
    top: -30,
    left: '50%',
    transform: [{ translateX: -20 }],
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'red',
    marginRight: 4,
  },
  recordingText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  filterButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewContainer: {
    flex: 1,
  },
  previewImage: {
    width: width,
    height: height,
    resizeMode: 'cover',
  },
  previewVideo: {
    width: width,
    height: height,
  },
  previewOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 20,
  },
  previewButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8C5EFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    marginTop: 10,
  },
});
