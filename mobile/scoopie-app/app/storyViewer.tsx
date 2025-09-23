import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    FlatList,
    TouchableOpacity,
    Image,
    StyleSheet,
    Modal,
    Dimensions,
    Text,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { getStories } from '@/api/storyService';
import { UserStory } from '@/models/StoryModel';
import CreateStoryButton from './createStoryButton';
import { getProfile } from '@/api/profileService';

const { width, height } = Dimensions.get('window');

interface StoryViewerProps {
    refreshTrigger?: number;
}

const StoryViewer = ({ refreshTrigger }: StoryViewerProps) => {
    const [stories, setStories] = useState<UserStory[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [currentUserIndex, setCurrentUserIndex] = useState(0);
    const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
    const [viewedUserIds, setViewedUserIds] = useState<string[]>([]);
    const [page, setPage] = useState(1);
    const [hasNext, setHasNext] = useState(true);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const [profileImg,setProfileImg] = useState<string|null>("")
    const [videoLoading, setVideoLoading] = useState(false);
    const [videoError, setVideoError] = useState(false);
    const [playerKey, setPlayerKey] = useState(0); // Force player re-initialization
    const [viewedStories, setViewedStories] = useState<Set<string>>(new Set()); // Track viewed stories
    const [videoPreloaded, setVideoPreloaded] = useState<Set<string>>(new Set()); // Track preloaded videos

    const storyTimeout = useRef<number | null>(null);

    // Watch for refresh trigger and refresh stories immediately
    useEffect(() => {
        if (refreshTrigger && refreshTrigger > 0) {
            console.log('StoryViewer: Refresh trigger detected, refreshing stories immediately...');
            // Force immediate refresh without delay
            refreshStories();
            // Also trigger a direct fetch as backup
            setTimeout(() => {
                fetchStories(1);
            }, 100);
        }
    }, [refreshTrigger]);

    // Define isVideo function before using it
    const isVideo = (url: string, mediaType?: string) => {
        if (!url) return false;
        
        // First check mediaType if available (most reliable)
        if (mediaType) {
            return mediaType.toLowerCase() === 'video';
        }
        
        // Remove query parameters for extension check
        const cleanUrl = url.split('?')[0];
        const videoExtensions = ['.mp4', '.mov', '.mkv', '.webm', '.avi', '.m4v'];
        
        return videoExtensions.some(ext => cleanUrl.toLowerCase().endsWith(ext)) ||
               // Check for video MIME types in URL
               url.includes('video/') ||
               // Check for common video hosting patterns
               url.includes('video') && (url.includes('mp4') || url.includes('mov')) ||
               // Check for ImageKit video patterns (even if extension is .jpg)
               url.includes('imagekit.io') && url.includes('video') ||
               // Fallback: if URL contains 'video' in filename, treat as video
               url.toLowerCase().includes('video');
    };

    const currentStory = stories[currentUserIndex]?.stories?.[currentStoryIndex] || null;
    
    // Preload next video for smoother transitions
    const nextStoryForPreload = stories[currentUserIndex]?.stories?.[currentStoryIndex + 1] || 
                     stories[currentUserIndex + 1]?.stories?.[0] || null;
    
    const nextVideoPlayer = useVideoPlayer(
        nextStoryForPreload?.mediaUrl && isVideo(nextStoryForPreload.mediaUrl, nextStoryForPreload.mediaType) ? nextStoryForPreload.mediaUrl : '',
        (player) => {
            if (nextStoryForPreload?.mediaUrl && isVideo(nextStoryForPreload.mediaUrl, nextStoryForPreload.mediaType)) {
                console.log('Preloading next video:', nextStoryForPreload.mediaUrl);
                try {
                    player.muted = true;
                    player.loop = false;
                    setVideoPreloaded(prev => new Set([...prev, nextStoryForPreload.mediaUrl]));
                } catch (error) {
                    console.error('Error preloading next video:', error);
                }
            }
        }
    );
    
    // Create a completely new player instance for each story
    const player = useVideoPlayer(
        currentStory?.mediaUrl || '',
        (player) => {
           
            
            if (currentStory?.mediaUrl && isVideo(currentStory.mediaUrl, currentStory.mediaType)) {
                console.log('Initializing video player for:', currentStory.mediaUrl, 'with key:', playerKey);
                try {
                    // Optimize player settings for faster loading
                    player.loop = false;
                    player.muted = isMuted;
                    player.currentTime = 0;
                    
                    // Ensure video starts playing when modal is visible
                    if (modalVisible) {
                        console.log('Modal is visible, starting video playback');
                        player.play();
                    }
                    
                    console.log('Player settings applied');
                } catch (error) {
                    console.error('Error setting player properties:', error);
                }
            } else {
                console.log('Skipping video player initialization - not a video or no URL');
                console.log('URL:', currentStory?.mediaUrl);
                console.log('MediaType:', currentStory?.mediaType);
            }
        }
    );

    const fetchStories = async (pageNo: number) => {
        if (loading || !hasNext) return;
        setLoading(true);
        try {
            console.log('StoryViewer: Fetching stories for page:', pageNo);
            const response = await getStories(pageNo);
            
            console.log('StoryViewer: Stories response:', response);
            
            if (response.success) {
                // Server returns grouped stories directly
                const responseData = response.data || {};
                const userStories = responseData.stories || [];
                const pagination = responseData.pagination || {};
                
                console.log('StoryViewer: Response data from server:', responseData);
                console.log('StoryViewer: User stories from server:', userStories);
                console.log('StoryViewer: Number of user story groups:', userStories.length);
                
                if (!Array.isArray(userStories)) {
                    console.error('StoryViewer: User stories is not an array:', userStories);
                    setHasNext(false);
                    return;
                }
                
                // Log each user story group structure
                userStories.forEach((userStory, index) => {
                    console.log(`StoryViewer: User story group ${index}:`, {
                        userId: userStory.userId,
                        username: userStory.username,
                        profilePic: userStory.profilePic,
                        individualStoriesCount: userStory.stories ? userStory.stories.length : 0
                    });
                });
                
                if (pageNo === 1) {
                    setStories(userStories);
                } else {
                    setStories((prev) => [...prev, ...userStories]);
                }
                
                // Use pagination info from server if available
                if (pagination && typeof pagination === 'object' && 'hasNext' in pagination) {
                    setHasNext(pagination.hasNext || false);
                } else {
                    // Fallback pagination logic
                    setHasNext(userStories.length >= 20);
                }
                setPage(pageNo + 1);
                
                // If no stories found, log it
                if (userStories.length === 0) {
                    console.log('StoryViewer: No stories found for this page');
                }
            } else {
                console.log('StoryViewer: Stories response not successful:', response);
                setHasNext(false);
            }
        } catch (error: any) {
            console.error('StoryViewer: Error fetching stories:', error);
            
            // Handle specific error types
            if (error.message?.includes('Network connection failed')) {
                Alert.alert(
                    'Connection Error', 
                    'Please check your internet connection and try again.',
                    [{ text: 'OK' }]
                );
            } else if (error.message?.includes('Authentication failed')) {
                Alert.alert(
                    'Authentication Error', 
                    'Please login again to continue.',
                    [{ text: 'OK' }]
                );
            } else {
                Alert.alert(
                    'Error', 
                    error.message || 'Failed to load stories. Please try again.',
                    [{ text: 'OK' }]
                );
            }
            setHasNext(false);
        } finally {
            setLoading(false);
        }
    };

    const refreshStories = async () => {
        setRefreshing(true);
        try {
            console.log('StoryViewer: Refreshing stories...');
            const response = await getStories(1);
            
            console.log('StoryViewer: Refresh response:', response);
            
            if (response.success) {
                // Server returns grouped stories directly
                const responseData = response.data || {};
                const userStories = responseData.stories || [];
                const pagination = responseData.pagination || {};
                
                console.log('StoryViewer: Refresh - User stories from server:', userStories);
                console.log('StoryViewer: Refresh - Number of user story groups:', userStories.length);
                
                if (!Array.isArray(userStories)) {
                    console.error('StoryViewer: Refresh - User stories is not an array:', userStories);
                    return;
                }
                
                setStories(userStories);
                
                // Use pagination info from server if available
                if (pagination && typeof pagination === 'object' && 'hasNext' in pagination) {
                    setHasNext(pagination.hasNext || false);
                } else {
                    setHasNext(userStories.length >= 20);
                }
                setPage(2);
                setCurrentUserIndex(0);
                setCurrentStoryIndex(0);
                setViewedUserIds([]);
                
                console.log('StoryViewer: Stories refreshed successfully');
            } else {
                console.log('StoryViewer: Refresh - Stories response not successful:', response);
            }
        } catch (error: any) {
            console.error('StoryViewer: Error refreshing stories:', error);
            
            // Handle specific error types
            if (error.message?.includes('Network connection failed')) {
                Alert.alert(
                    'Connection Error', 
                    'Please check your internet connection and try again.',
                    [{ text: 'OK' }]
                );
            } else if (error.message?.includes('Authentication failed')) {
                Alert.alert(
                    'Authentication Error', 
                    'Please login again to continue.',
                    [{ text: 'OK' }]
                );
            } else {
                Alert.alert(
                    'Error', 
                    error.message || 'Failed to refresh stories. Please try again.',
                    [{ text: 'OK' }]
                );
            }
        } finally {
            setRefreshing(false);
        }
    };

     const fetchProfileData = async () => {
        try {
          const data = await getProfile();
          setProfileImg(data.data.profile.profilePic)
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      };

    useEffect(() => {
        fetchStories(1);
        fetchProfileData()
    }, []);

    // Refresh stories when screen comes into focus (e.g., after creating a story)
    useFocusEffect(
        React.useCallback(() => {
            console.log('Story viewer focused, refreshing stories...');
            refreshStories();
        }, [])
    );

    useEffect(() => {
        if (!currentStory) return;

        // Debug logging
        console.log('Current story changed:', {
            mediaUrl: currentStory.mediaUrl,
            mediaType: currentStory.mediaType,
            isVideo: isVideo(currentStory.mediaUrl),
            userId: currentStory.userId
        });

        // Reset video states when story changes
        setVideoLoading(false);
        setVideoError(false);
        
        // If this story has been viewed before, force a complete player reset
        if (currentStory?.id && viewedStories.has(currentStory.id)) {
            console.log('Story has been viewed before, forcing complete reset');
            setPlayerKey(prev => prev + 1); // Force player re-initialization
        } else if (currentStory?.id) {
            // Mark this story as viewed
            setViewedStories(prev => new Set(prev).add(currentStory.id));
            console.log('Marking story as viewed:', currentStory.id);
        }

        if (storyTimeout.current) clearTimeout(storyTimeout.current);

        if (!isVideo(currentStory.mediaUrl)) {
            console.log('Image story detected, setting timeout');
            storyTimeout.current = setTimeout(() => {
                nextStory();
            }, 4000);
        }

        if (isVideo(currentStory.mediaUrl) && player) {
            console.log('Video story detected, setting up player listener');
            const sub = player.addListener('statusChange', (payload) => {
                const status = payload.status as any;
                console.log('Video status changed:', status);
                
                // Add error handling
                if (status?.error) {
                    console.error('Video player error:', status.error);
                    setVideoError(true);
                    // Skip to next story on error after a short delay
                    setTimeout(() => {
                        nextStory();
                    }, 2000);
                    return;
                }
                
                if (status?.didJustFinish) {
                    console.log('Video finished, moving to next story');
                    if (stories[currentUserIndex]?.stories?.length > currentStoryIndex + 1) {
                        setCurrentStoryIndex((prev) => prev + 1);
                    } else if (currentUserIndex + 1 < stories.length) {
                        setCurrentUserIndex((prev) => prev + 1);
                        setCurrentStoryIndex(0);
                    } else {
                        closeStory();
                    }
                }
            });

            return () => sub.remove();
        }
    }, [currentStoryIndex, currentUserIndex, currentStory, isMuted]);

    // Ensure video starts playing when modal becomes visible
    useEffect(() => {
        if (modalVisible && currentStory && isVideo(currentStory.mediaUrl, currentStory.mediaType) && player) {
            console.log('Modal became visible, starting video playback for:', currentStory.mediaUrl);
            try {
                player.play();
            } catch (error) {
                console.error('Error starting video playback:', error);
            }
        }
    }, [modalVisible, currentStory, player]);



    const closeStory = () => {
        const userStories = stories[currentUserIndex]?.stories || [];

        if (currentStoryIndex === userStories.length - 1) {
            const viewedUserId = stories[currentUserIndex].userId;
            if (!viewedUserIds.includes(viewedUserId)) {
                setViewedUserIds((prev) => [...prev, viewedUserId]);
            }
        }

        if (player) {
            player.muted = true;
            player.pause();
        }

        // Reset video states
        setVideoLoading(false);
        setVideoError(false);
        setPlayerKey(prev => prev + 1); // Reset player for next time
        setViewedStories(new Set()); // Clear viewed stories
        setModalVisible(false);
        setIsMuted(true);
        if (storyTimeout.current) clearTimeout(storyTimeout.current);
    };


    const openStory = (userIndex: number) => {
        console.log('Opening story for user index:', userIndex);
        setCurrentUserIndex(userIndex);
        setCurrentStoryIndex(0);
        
        // Reset video states when opening a story
        setVideoLoading(false);
        setVideoError(false);
        setPlayerKey(prev => prev + 1); // Force player re-initialization
        
        setModalVisible(true);
        
        // Log the first story details
        const firstStory = stories[userIndex]?.stories?.[0];
        if (firstStory) {
            console.log('First story details:', {
                id: firstStory.id,
                mediaUrl: firstStory.mediaUrl,
                mediaType: firstStory.mediaType,
                isVideo: isVideo(firstStory.mediaUrl, firstStory.mediaType)
            });
        }
    };

    const nextStory = () => {
        const userStories = stories[currentUserIndex].stories;
        if (currentStoryIndex + 1 < userStories.length) {
            setCurrentStoryIndex((prev) => prev + 1);
        } else {
            const viewedUserId = stories[currentUserIndex].userId;
            if (!viewedUserIds.includes(viewedUserId)) {
                setViewedUserIds((prev) => [...prev, viewedUserId]);
            }
            if (currentUserIndex + 1 < stories.length) {
                setCurrentUserIndex((prev) => prev + 1);
                setCurrentStoryIndex(0);
            } else {
                closeStory();
            }
        }
    };

    const previousStory = () => {
        if (currentStoryIndex > 0) {
            setCurrentStoryIndex((prev) => prev - 1);
        } else if (currentUserIndex > 0) {
            const prevUserStories = stories[currentUserIndex - 1].stories;
            setCurrentUserIndex((prev) => prev - 1);
            setCurrentStoryIndex(prevUserStories.length - 1);
        }
    };

    const handleStoryTap = (event: any) => {
        const { locationX } = event.nativeEvent;
        const screenWidth = Dimensions.get('window').width;
        
        // Left half of screen - go to previous story
        if (locationX < screenWidth / 2) {
            previousStory();
        } 
        // Right half of screen - go to next story
        else {
            nextStory();
        }
    };

    const toggleMute = () => {
        const newMutedState = !isMuted;
        setIsMuted(newMutedState);
        if (player) {
            player.muted = newMutedState;
        }
    };

    useEffect(() => {
        if (!modalVisible && player) {
            player.pause();
            player.muted = true;
        }
    }, [modalVisible]);

    // Handle player cleanup and reinitialization when story changes
    useEffect(() => {
        console.log('Story change effect triggered:', {
            storyId: currentStory?.id,
            playerKey,
            mediaUrl: currentStory?.mediaUrl,
            isVideo: currentStory?.mediaUrl ? isVideo(currentStory.mediaUrl) : false
        });
        
        if (player && currentStory && isVideo(currentStory.mediaUrl)) {
            console.log('Resetting video player for new story');
            try {
                player.pause();
                player.currentTime = 0;
                player.muted = isMuted;
                
                // Simple play attempt
                setTimeout(() => {
                    try {
                        player.play();
                        console.log('Video play attempted');
                    } catch (error) {
                        console.error('Video play error:', error);
                        setVideoError(true);
                    }
                }, 300);
            } catch (error) {
                console.error('Error resetting player:', error);
            }
        }
    }, [currentStory?.id, playerKey]); // Trigger when story ID or player key changes





    return (
        <View style={styles.storyContainer}>
            <CreateStoryButton userImage={profileImg}/>
            <FlatList
                data={stories}
                horizontal
                keyExtractor={(item) => item.userId}
                style={styles.storyList}
                contentContainerStyle={styles.storyListContent}
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
                onEndReached={() => {
                    console.log('End reached, loading more stories...');
                    fetchStories(page);
                }}
                onEndReachedThreshold={0.5}
                refreshing={refreshing}
                onRefresh={refreshStories}
                ListFooterComponent={
                    loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="small" color="#7B4DFF" />
                        </View>
                    ) : null
                }
                renderItem={({ item, index }) => {
                    const isViewed = viewedUserIds.includes(item.userId);
                    const hasStories = item.stories && item.stories.length > 0;
                    
                    return (
                        <TouchableOpacity
                            onPress={() => openStory(index)}
                            style={styles.storyItem}
                            activeOpacity={0.8}
                        >
                            <View style={styles.storyAvatarContainer}>
                                <Image
                                    source={{
                                        uri:
                                            item.profilePic ||
                                            'https://www.pngitem.com/pimgs/m/146-1468479_my-profile-icon-blank-profile-picture-circle-hd.png',
                                    }}
                                    style={[
                                        styles.profilePic,
                                        isViewed ? styles.profilePicViewed : styles.profilePicUnviewed,
                                        !hasStories && styles.profilePicNoStories,
                                    ]}
                                />
                                {hasStories && (
                                    <View style={[
                                        styles.storyRing,
                                        isViewed ? styles.storyRingViewed : styles.storyRingUnviewed
                                    ]} />
                                )}
                            </View>
                            <Text 
                                style={[
                                    styles.username,
                                    isViewed ? styles.usernameViewed : styles.usernameUnviewed
                                ]} 
                                numberOfLines={1} 
                                ellipsizeMode="tail"
                            >
                                {item.username}
                            </Text>
                        </TouchableOpacity>
                    );
                }}
            />

            {/* Story Modal */}
            <Modal visible={modalVisible} transparent={true}>
                <View style={styles.modalContainer}>
                    {/* Left tap area for previous story */}
                    <TouchableOpacity
                        style={styles.leftTapArea}
                        activeOpacity={1}
                        onPress={previousStory}
                    />
                    
                    {/* Right tap area for next story */}
                    <TouchableOpacity
                        style={styles.rightTapArea}
                        activeOpacity={1}
                        onPress={nextStory}
                    />
                    
                    {/* Center content area */}
                    <View style={styles.centerContent}>
                        {isVideo(currentStory?.mediaUrl, currentStory?.mediaType) ? (
                            <View style={[styles.storyImage, { backgroundColor: '#000' }]}>
                                {videoLoading && (
                                    <View style={styles.loadingOverlay}>
                                        <ActivityIndicator size="large" color="#fff" />
                                        <Text style={styles.loadingText}>Loading video...</Text>
                                    </View>
                                )}
                                {videoError && (
                                    <View style={styles.errorOverlay}>
                                        <Text style={styles.errorText}>Video failed to load</Text>
                                        <TouchableOpacity onPress={nextStory} style={styles.skipButton}>
                                            <Text style={styles.skipText}>Skip</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                                {!videoLoading && !videoError && !currentStory?.mediaUrl && (
                                    <View style={styles.errorOverlay}>
                                        <Text style={styles.errorText}>No video available</Text>
                                        <TouchableOpacity onPress={nextStory} style={styles.skipButton}>
                                            <Text style={styles.skipText}>Skip</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                                {currentStory?.mediaUrl && !videoError && (
                                    <VideoView
                                        key={`video-${currentStory.id}-${playerKey}`} // Simplified key for better performance
                                        style={styles.storyImage}
                                        player={player}
                                        allowsFullscreen={false}
                                        allowsPictureInPicture={false}
                                        nativeControls={false}
                                        onLoadStart={() => {
                                            console.log('Video load started for story:', currentStory.id);
                                            setVideoLoading(true);
                                        }}
                                        onLoad={() => {
                                            console.log('Video loaded successfully for story:', currentStory.id);
                                            setVideoLoading(false);
                                            // Ensure video starts playing after load
                                            if (player && modalVisible) {
                                                try {
                                                    player.play();
                                                    console.log('Video playback started after load');
                                                } catch (error) {
                                                    console.error('Error starting video after load:', error);
                                                }
                                            }
                                        }}
                                        onError={(error) => {
                                            console.error('Video load error for story:', currentStory.id, error);
                                            setVideoLoading(false);
                                            setVideoError(true);
                                        }}
                                        onPlaybackStatusUpdate={(status) => {
                                            console.log('Video playback status update:', status);
                                            if (status.isLoaded && !status.isPlaying && modalVisible) {
                                                // If video is loaded but not playing and modal is visible, start playing
                                                try {
                                                    player.play();
                                                    console.log('Video playback started from status update');
                                                } catch (error) {
                                                    console.error('Error starting video from status update:', error);
                                                }
                                            }
                                        }}
                                    />
                                )}
                                {/* Debug overlay */}
                                {/* <View style={styles.debugOverlay}>
                                    <Text style={styles.debugText}>
                                        Debug: {currentStory?.mediaUrl ? 'Has URL' : 'No URL'} | 
                                        MediaType: {currentStory?.mediaType || 'None'} |
                                        IsVideo: {isVideo(currentStory?.mediaUrl || '', currentStory?.mediaType) ? 'Yes' : 'No'} |
                                        Loading: {videoLoading ? 'Yes' : 'No'} | 
                                        Error: {videoError ? 'Yes' : 'No'} | 
                                        Key: {playerKey}
                                    </Text>
                                    <TouchableOpacity 
                                        style={styles.refreshButton}
                                        onPress={() => {
                                            console.log('Manual refresh triggered');
                                            setPlayerKey(prev => prev + 1);
                                            setVideoError(false);
                                            setVideoLoading(false);
                                        }}
                                    >
                                        <Text style={styles.refreshText}>Refresh</Text>
                                    </TouchableOpacity>
                                </View> */}
                            </View>
                        ) : (
                            <Image
                                source={{ uri: currentStory?.mediaUrl }}
                                style={styles.storyImage}
                                resizeMode="cover"
                                onError={() => {
                                    console.error('Image load error');
                                }}
                            />
                        )}

                        {/* Progress Bar */}
                        <View style={styles.progressBarContainer}>
                            {stories[currentUserIndex]?.stories.map((story, i) => (
                                <View
                                    key={story.id}
                                    style={[
                                        styles.progressBar,
                                        {
                                            width: `${100 / stories[currentUserIndex].stories.length}%`,
                                            backgroundColor:
                                                i <= currentStoryIndex
                                                    ? '#fff'
                                                    : 'rgba(255,255,255,0.3)',
                                        },
                                    ]}
                                />
                            ))}
                        </View>

                        {/* User Info */}
                        <View style={styles.userInfoContainer}>
                            <Image
                                source={{
                                    uri:
                                        stories[currentUserIndex]?.profilePic ||
                                        'https://www.pngitem.com/pimgs/m/146-1468479_my-profile-icon-blank-profile-picture-circle-hd.png',
                                }}
                                style={styles.userProfilePic}
                            />
                            <Text style={styles.userNameText}>
                                {stories[currentUserIndex]?.username}
                            </Text>
                        </View>

                    </View>

                    {/* Close Button */}
                    <TouchableOpacity style={styles.closeButton} onPress={closeStory}>
                        <Text style={{ color: '#fff', fontSize: 22 }}>✕</Text>
                    </TouchableOpacity>

                    {/* Mute/Unmute Button */}
                    {isVideo(currentStory?.mediaUrl) && (
                        <TouchableOpacity style={styles.muteButton} onPress={toggleMute}>
                            <Text style={{ color: '#fff', fontSize: 16 }}>
                                {isMuted ? 'Unmute' : 'Mute'}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    storyContainer: {
        backgroundColor: '#ffffff',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 0.5,
        borderBottomColor: '#e1e5e9',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        height: 100,
        maxHeight: 100,
    },
    storyList: {
        flex: 1,
        paddingLeft: 12,
        height: 84,
        maxHeight: 84,
    },
    storyListContent: {
        alignItems: 'center',
        justifyContent: 'center',
        height: 84,
    },
    storyItem: {
        alignItems: 'center',
        marginRight: 20,
        top:4,
        width: 75,
        height: 84,
        justifyContent: 'center',
    },
    storyAvatarContainer: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    profilePic: {
        width: 60,
        height: 60,
        borderRadius: 32,
        backgroundColor: '#f8f9fa',
    },
    profilePicUnviewed: {
        borderWidth: 2,
        borderColor: '#333333',
        shadowColor: '#333333',
        shadowOffset: {
            width: 0,
            height: 0,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    profilePicViewed: {
        borderWidth: 2,
        borderColor: '#6c757d',
        opacity: 0.7,
    },
    profilePicNoStories: {
        borderWidth: 2,
        borderColor: '#dee2e6',
        opacity: 0.6,
    },
    storyRing: {
        position: 'absolute',
        width: 60,
        height: 60,
        borderRadius: 34,
        borderWidth: 2,
    },
    storyRingUnviewed: {
        borderColor: '#333333',
    },
    storyRingViewed: {
        borderColor: '#6c757d',
    },
    username: {
        textAlign: 'center',
        fontSize: 12,
        fontWeight: '500',
        marginTop: 3,
        maxWidth: 75,
        lineHeight: 14,
    },
    usernameUnviewed: {
        color: '#212529',
        fontWeight: '600',
    },
    usernameViewed: {
        color: '#6c757d',
        fontWeight: '400',
    },
    loadingContainer: {
        padding: 16,
        alignItems: 'center',
    },
    userInfoContainer: {
        position: 'absolute',
        top: 35,
        left: 20,
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 20,
        // backgroundColor: 'rgba(0,0,0,0.3)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
    },
    userProfilePic: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
        borderWidth: 2,
        borderColor: '#ffffff',
    },
    userNameText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#000',
        position: 'relative',
    },
    leftTapArea: {
        position: 'absolute',
        left: 0,
        top: 0,
        width: '50%',
        height: '100%',
        zIndex: 10,
    },
    rightTapArea: {
        position: 'absolute',
        right: 0,
        top: 0,
        width: '50%',
        height: '100%',
        zIndex: 10,
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    storyImage: {
        width: width,
        height: height,
    },
    closeButton: {
        position: 'absolute',
        top: 40,
        right: 20,
        zIndex: 20,
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressBarContainer: {
        position: 'absolute',
        top: 25,
        left: 16,
        right: 16,
        flexDirection: 'row',
        zIndex: 20,
        paddingHorizontal: 4,
    },
    progressBar: {
        flex: 1,
        height: 3,
        backgroundColor: 'rgba(255,255,255,0.3)',
        marginHorizontal: 2,
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressBarActive: {
        backgroundColor: '#ffffff',
    },
    progressBarViewed: {
        backgroundColor: 'rgba(255,255,255,0.6)',
    },
    muteButton: {
        position: 'absolute',
        bottom: 100,
        right: 20,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        zIndex: 20,
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    loadingText: {
        color: '#fff',
        fontSize: 16,
        marginTop: 10,
        fontWeight: '500',
    },
    errorOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
        paddingHorizontal: 20,
    },
    errorText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 20,
    },
    skipButton: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.5)',
    },
    skipText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    debugOverlay: {
        position: 'absolute',
        top: 10,
        left: 10,
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: 8,
        borderRadius: 4,
        zIndex: 1000,
    },
    debugText: {
        color: '#fff',
        fontSize: 10,
        fontFamily: 'monospace',
    },
    refreshButton: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        marginTop: 4,
    },
    refreshText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '600',
    },
    loadingSpinner: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
});

export default StoryViewer;
