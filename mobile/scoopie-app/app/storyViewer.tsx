import React, { useState, useEffect, useRef } from "react";
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
} from "react-native";
import { VideoView, useVideoPlayer } from "expo-video"; 
import { getStories } from "@/api/storyService";
import { UserStory } from "@/models/StoryModel";

const { width, height } = Dimensions.get("window");

const StoryViewer = () => {
    const [stories, setStories] = useState<UserStory[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [currentUserIndex, setCurrentUserIndex] = useState(0);
    const [currentStoryIndex, setCurrentStoryIndex] = useState(0);

    const [viewedUserIds, setViewedUserIds] = useState<string[]>([]);
    const [page, setPage] = useState(1);
    const [hasNext, setHasNext] = useState(true);
    const [loading, setLoading] = useState(false);

    const storyTimeout = useRef<number | null>(null);

    const currentStory =
        stories[currentUserIndex]?.stories?.[currentStoryIndex] || null;
    const player = useVideoPlayer(
        currentStory?.mediaUrl || "",
        (player) => {
            player.loop = true;
            player.play(); 
        }
    );

    const fetchStories = async (pageNo: number) => {
        if (loading || !hasNext) return;
        setLoading(true);
        try {
            const response = await getStories(pageNo);
            const newStories = response.data.stories;
            setStories((prev) =>
                pageNo === 1 ? newStories : [...prev, ...newStories]
            );
            setHasNext(response.data.pagination.hasNext);
            setPage(response.data.pagination.currentPage + 1);
        } catch (error) {
            console.error("Error fetching stories:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStories(1);
    }, []);

    useEffect(() => {
        if (!currentStory) return;
        if (storyTimeout.current) {
            clearTimeout(storyTimeout.current);
        }
        if (!isVideo(currentStory.mediaUrl)) {
            storyTimeout.current = setTimeout(() => {
                nextStory();
            }, 5000);
        }
        if (isVideo(currentStory.mediaUrl) && player) {
            const sub = player.addListener("statusChange", (payload) => {
                const status = payload.status as any;

                if (status?.didJustFinish) {
                    nextStory();
                }
            });

            return () => sub.remove();
        }
    }, [currentStoryIndex, currentUserIndex, currentStory]);


    const openStory = (userIndex: number) => {
        setCurrentUserIndex(userIndex);
        setCurrentStoryIndex(0);
        setModalVisible(true);
    };

    const closeStory = () => {
        const userStories = stories[currentUserIndex]?.stories || [];

        if (currentStoryIndex === userStories.length - 1) {
            const viewedUserId = stories[currentUserIndex].userId;
            if (!viewedUserIds.includes(viewedUserId)) {
                setViewedUserIds((prev) => [...prev, viewedUserId]);
            }
        }

        setModalVisible(false);
        if (storyTimeout.current) clearTimeout(storyTimeout.current);
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

    const isVideo = (url: string) =>
        url?.endsWith(".mp4") || url?.endsWith(".mov") || url?.endsWith(".mkv");

    return (
        <View style={{ backgroundColor: "white", justifyContent: "center" }}>
            <FlatList
                data={stories}
                horizontal
                keyExtractor={(item) => item.userId}
                style={{ paddingVertical: 10, paddingLeft: 10 }}
                onEndReached={() => fetchStories(page)}
                onEndReachedThreshold={0.5}
                ListFooterComponent={
                    loading ? <ActivityIndicator size="small" color="black" /> : null
                }
                renderItem={({ item, index }) => {
                    const isViewed = viewedUserIds.includes(item.userId);
                    return (
                        <TouchableOpacity
                            onPress={() => openStory(index)}
                            style={{ marginRight: 10 }}
                        >
                            <Image
                                source={{
                                    uri:
                                        item.profilePic ||
                                        "https://www.pngitem.com/pimgs/m/146-1468479_my-profile-icon-blank-profile-picture-circle-hd.png",
                                }}
                                style={[
                                    styles.profilePic,
                                    { borderColor: isViewed ? "grey" : "grey" },
                                ]}
                            />
                            <Text style={styles.username} numberOfLines={1} ellipsizeMode="tail">
                                {item.username}
                            </Text>
                        </TouchableOpacity>
                    );
                }}
            />

            {/* Story Modal */}
            <Modal visible={modalVisible} transparent={true}>
                <View style={styles.modalContainer}>
                    <TouchableOpacity
                        style={styles.modalContainer}
                        activeOpacity={1}
                        onPress={nextStory}
                    >
                        {isVideo(currentStory?.mediaUrl) ? (
                            <VideoView
                                style={styles.storyImage}
                                player={player} 
                                allowsFullscreen
                                allowsPictureInPicture
                                nativeControls={false}
                            />
                        ) : (
                            <Image
                                source={{ uri: currentStory?.mediaUrl }}
                                style={styles.storyImage}
                                resizeMode="cover"
                            />
                        )}

                        <View style={styles.progressBarContainer}>
                            {stories[currentUserIndex]?.stories.map((story, i) => (
                                <View
                                    key={story.id}
                                    style={[
                                        styles.progressBar,
                                        {
                                            width: `${100 / stories[currentUserIndex].stories.length}%`,
                                            backgroundColor:
                                                i < currentStoryIndex
                                                    ? "#fff"
                                                    : i === currentStoryIndex
                                                        ? "#fff"
                                                        : "rgba(255,255,255,0.3)",
                                        },
                                    ]}
                                />
                            ))}
                        </View>

                        <View style={styles.userInfoContainer}>
                            <Image
                                source={{
                                    uri:
                                        stories[currentUserIndex]?.profilePic ||
                                        "https://www.pngitem.com/pimgs/m/146-1468479_my-profile-icon-blank-profile-picture-circle-hd.png",
                                }}
                                style={styles.userProfilePic}
                            />
                            <Text style={styles.userNameText}>
                                {stories[currentUserIndex]?.username}
                            </Text>
                        </View>

                        <TouchableOpacity style={styles.closeButton} onPress={closeStory}>
                            <Text style={{ color: "#fff", fontSize: 22 }}>✕</Text>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    profilePic: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 2,
    },
    username: {
        textAlign: "center",
        fontSize: 12,
        color: "#000",
        width: 60,
        marginTop: 5,
    },
    userInfoContainer: {
        position: "absolute",
        top: 45,
        left: 20,
        flexDirection: "row",
        alignItems: "center",
        marginTop: 10,
    },
    userProfilePic: {
        width: 35,
        height: 35,
        borderRadius: 20,
        marginRight: 8,
        borderWidth: 1,
        borderColor: "#fff",
    },
    userNameText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "600",
    },
    modalContainer: {
        flex: 1,
        backgroundColor: "#000",
        justifyContent: "center",
        alignItems: "center",
    },
    storyImage: {
        width: width,
        height: height,
    },
    closeButton: {
        position: "absolute",
        top: 50,
        right: 20,
    },
    progressBarContainer: {
        position: "absolute",
        top: 40,
        flexDirection: "row",
        width: "90%",
        height: 3,
        alignSelf: "center",
        justifyContent: "space-between",
    },
    progressBar: {
        height: 3,
        marginHorizontal: 1,
        borderRadius: 2,
    },
});

export default StoryViewer;
