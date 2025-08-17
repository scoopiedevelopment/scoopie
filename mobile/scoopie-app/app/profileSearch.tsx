
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "expo-router";
import ScreenWrapper from "@/components/common/ScreenWrapper";
import { getFollowers } from "@/api/memberService";

interface Member {
  id: string;
  name: string;
  username: string;
  avatar: string;
}

const ProfileSearch = () => {
  const [activeTab, setActiveTab] = useState<"Members" | "Following">("Members");
  const [membersData, setMembersData] = useState<Member[]>([]);
  const [followingData, setFollowingData] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);

  const navigation = useNavigation();

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const data = await getFollowers(1);
      const formattedMembers: Member[] = data.data.followers.map((f) => ({
        id: f.follower.userId,
        name: f.follower.name,
        username: f.follower.username,
        avatar: f.follower.profilePic || "https://via.placeholder.com/45",
      }));
      setMembersData(formattedMembers);
    } catch (err) {
      console.error("Error fetching members:", err);
    } finally {
      setLoading(false);
    }
  };


  const fetchFollowing = async () => {
    setLoading(true);
    try {
      const formattedFollowing: Member[] = [].map((f: any) => ({
        id: f.userId,
        name: f.name,
        username: f.username,
        avatar: f.profilePic || "https://via.placeholder.com/45",
      }));
      setFollowingData(formattedFollowing);
    } catch (err) {
      console.error("Error fetching following:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "Members") {
      fetchMembers();
    } else {
      fetchFollowing();
    }
  }, [activeTab]);

  const renderItem = ({ item }: { item: Member }) => (
    <View style={styles.memberRow}>
      <Image source={{ uri: item.avatar }} style={styles.avatar} />
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.username}>{item.username}</Text>
      </View>
      <TouchableOpacity style={styles.messageButton}>
        <Text style={styles.messageText}>Message</Text>
      </TouchableOpacity>
    </View>
  );

  const dataToShow = activeTab === "Members" ? membersData : followingData;

  return (
    <ScreenWrapper gradient>
      <View style={styles.container}>
        <LinearGradient
          colors={["#FFF7D2", "rgba(86, 55, 158, 0.34)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity>
            <Feather name="more-vertical" size={22} color="#000" />
          </TouchableOpacity>
        </LinearGradient>

        <View style={styles.tabContainer}>
          {["Members", "Following"].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={styles.tab}
              onPress={() => setActiveTab(tab as "Members" | "Following")}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab}
              </Text>
              {activeTab === tab && <View style={styles.activeTabLine} />}
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <Text style={{ textAlign: "center", marginTop: 20 }}>Loading...</Text>
        ) : dataToShow.length === 0 ? (
          <Text style={{ textAlign: "center", marginTop: 20, fontSize: 16, color: "#666" }}>
            No data available
          </Text>
        ) : (
          <FlatList
            data={dataToShow}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </ScreenWrapper>
  );
};

export default ProfileSearch;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  headerTitle: { fontSize: 18, fontWeight: "600" },
  tabContainer: { flexDirection: "row", marginBottom: 10 },
  tab: { flex: 1, alignItems: "center", paddingVertical: 8 },
  tabText: { fontSize: 16, color: "#666" },
  activeTabText: { color: "#000", fontWeight: "600" },
  activeTabLine: {
    marginTop: 4,
    height: 2,
    width: "70%",
    backgroundColor: "#7B4DFF",
  },
  backBtn: { padding: 4 },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  avatar: { width: 45, height: 45, borderRadius: 22, marginRight: 12 },
  name: { fontSize: 15, fontWeight: "600" },
  username: { fontSize: 13, color: "#666" },
  messageButton: {
    borderWidth: 1,
    borderColor: "#ccc",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  messageText: { fontSize: 14, color: "#000" },
});
