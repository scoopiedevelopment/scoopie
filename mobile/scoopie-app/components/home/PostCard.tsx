import { PostFeed } from '@/models/PostfeedModel';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import apiClient from "../../api/apiClient";
import { getProfile } from '@/api/profileService';
import { formatCount } from '@/utils/formatNumber';

interface PostCardProps {
  post: PostFeed;
}
const PostCard = ({ post }: PostCardProps) => {
  const {
    id,
    userId,
    text,
    visibility,
    views,
    shares,
    createdAt,
    updatedAt,
    media,
    user,
    _count
  } = post;

  const [isSaved, setIsSaved] = useState(false);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userLoginId, setUserLoginId] = useState("")
  // 🔹 Save Toggle
  const handleToggleSave = async () => {
    if (loading) return;
    setLoading(true);

    try {
      if (userLoginId) {
        const response = await apiClient.post("/saved/toggle", {
          userId: userLoginId,
          postId: id,
        });
        if (response.data.success) {
          setIsSaved((prev) => !prev);
        }
      }

    } catch (error) {
      console.error("❌ Save toggle failed:", error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    const getProfileData = async () => {
      const response = await getProfile()
      if (response) {
        setUserLoginId(response.data.profile.userId)
      }
    }
    getProfileData()

  }, [])

  // 🔹 Like/Dislike Toggle
  const handleToggleLike = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const response = await apiClient.post<any>("/like/toggle", {
        postId: id,
        likedTo: userId, 
      });

      if (response.data.success) {
        setLiked(!liked);
      }
    } catch (error) {
      console.error("❌ Like toggle failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateHoursAgo = (createdAt: string) => {
    const createdTime = new Date(createdAt).getTime();
    const currentTime = Date.now();
    const diffMs = currentTime - createdTime;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    return diffHours;
  };

  // const handleSavePress = async () => {
  //   if (isTogglingSave) return;
    
  //   setIsTogglingSave(true);
  //   try {
  //     const saved = await toggleSavePostItem(id);
  //     const message = saved ? 'Post saved!' : 'Post removed from saved';
  //     Alert.alert('Success', message);
  //   } catch (error) {
  //     console.error('Error toggling save:', error);
  //     Alert.alert('Error', 'Failed to save post. Please try again.');
  //   } finally {
  //     setIsTogglingSave(false);
  //   }
  // };


  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.profileSection}>
          {user.profilePic ? (
            <Image
              source={{ uri: user.profilePic }}
              style={styles.profileImage}
            />
          ) : (
            <Ionicons name="person-circle" size={50} color="#ccc" />
          )}


          <Text style={styles.username}>{user.username}</Text>
        </View>
        <View style={styles.dotsSection}>
          <TouchableOpacity>
            <Text style={styles.dots}>⋯</Text>
          </TouchableOpacity>
          <Text style={styles.dotNumber}>{calculateHoursAgo(createdAt)}h</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.imageRow}
      >
        {media.map((img, index) => {
          return (
            <Image
              key={index}
              source={{ uri: img.url }}
              style={styles.postImage}
            />
          );
        })}
      </ScrollView>

      <Text style={styles.description}>{text}</Text>

      <View style={styles.engagementRow}>
        <View style={styles.leftIcons}>
          <View style={styles.engagementItem}>
            <Image source={require('../../assets/icons/watchIcon.png')} style={styles.iconImage} />
            <Text style={styles.label}>{formatCount(Number(views))}</Text>
          </View>

          <TouchableOpacity onPress={handleToggleLike} disabled={loading}>
            <View style={styles.engagementItem}>
              <Ionicons
                name={liked ? "star" : "star-outline"}
                size={20}
                color={liked ? "black" : "black"}
              />
              <Text style={styles.label}>{formatCount(Number(_count.likes))}</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.engagementItem}>
            <Image source={require('../../assets/icons/commentIcon.png')} style={styles.iconImage} />
            <Text style={styles.label}>{formatCount(Number(_count.comments))}</Text>
          </View>
          <View style={styles.engagementItem}>
            <Image source={require('../../assets/icons/shareIcon.png')} style={styles.iconImage} />
            <Text style={styles.label}>{formatCount(Number(shares))}</Text>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveIcon} onPress={handleToggleSave} disabled={loading}>
          <Image
            source={
              isSaved
                ? require('../../assets/icons/saveIcon.png')
                : require('../../assets/icons/saveIcon.png')
            }
            style={styles.iconImage}
          />
        </TouchableOpacity>
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eee',
    marginRight: 10,
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e1e1e',
  },
  dotsSection: {
    alignItems: 'center',
  },
  dots: {
    fontSize: 24,
    color: '#999',
  },
  dotNumber: {
    fontSize: 12,
    color: '#777',
    marginTop: 2,
  },
  imageRow: {
    flexDirection: 'row',
    marginVertical: 12,
  },
  postImage: {
    width: 100,
    height: 160,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: '#eee',
    resizeMode: 'cover',
  },
  description: {
    fontSize: 14,
    color: '#444',
    marginBottom: 16,
  },
  engagementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  leftIcons: {
    flexDirection: 'row',
  },
  engagementItem: {
    alignItems: 'center',
    marginRight: 40,
  },
  iconImage: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
    marginBottom: 4,
  },

  icon: {
    fontSize: 20,
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  saveIcon: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 20,
  },
  savedIcon: {
    backgroundColor: '#9f5ef2',
  },
  savedIconImage: {
    tintColor: '#fff',
  },
});

export default PostCard;
