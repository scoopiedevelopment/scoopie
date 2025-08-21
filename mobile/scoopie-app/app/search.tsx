import React, { useState, useEffect } from "react";
import { Ionicons } from '@expo/vector-icons';
import { Video } from "expo-av";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";  // ✅ Added
import apiClient from "../api/apiClient";

const TABS = ["Top", "Accounts", "Posts", "Clips"];

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("Top");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [loggedInUserId, setLoggedInUserId] = useState<string | null>(null);

  // ✅ login user ki id lana
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const res = await apiClient.get("/v1/profile/get-profile");
        if (res.data?.data?.profile?.userId) {
          const id = res.data.data.profile.userId;
          setLoggedInUserId(id);
          loadRecentSearches(id);
        }
      } catch (err) {
        console.error("Profile fetch error:", err);
      }
    };
    fetchUserProfile();
  }, []);

  // ✅ Recent history load
  const loadRecentSearches = async (userId: string) => {
    try {
      const key = `recentSearches_${userId}`;
      const stored = await AsyncStorage.getItem(key);
      setRecentSearches(stored ? JSON.parse(stored) : []);
    } catch (e) {
      console.log("Error loading recents:", e);
    }
  };

  // ✅ Recent search save (only string)
  const saveRecentSearch = async (searchText: string) => {
    if (!loggedInUserId) return;
    try {
      const key = `recentSearches_${loggedInUserId}`;
      let stored = await AsyncStorage.getItem(key);
      let searches: string[] = stored ? JSON.parse(stored) : [];

      searches = searches.filter((name) => name !== searchText);
      searches.unshift(searchText);
      if (searches.length > 10) searches = searches.slice(0, 10);

      await AsyncStorage.setItem(key, JSON.stringify(searches));
      setRecentSearches(searches);
    } catch (e) {
      console.log("Error saving recent search:", e);
    }
  };

  const deleteRecentSearch = async (name: string) => {
    if (!loggedInUserId) return;
    try {
      const key = `recentSearches_${loggedInUserId}`;
      const stored = await AsyncStorage.getItem(key);
      let searches: string[] = stored ? JSON.parse(stored) : [];
      searches = searches.filter(item => item !== name);
      await AsyncStorage.setItem(key, JSON.stringify(searches));
      setRecentSearches(searches);
    } catch (err) {
      console.log("Error deleting recent search:", err);
    }
  };

  // ✅ Fetch search results
  const fetchResults = async (tab: string, searchQuery: string) => {
    if (!searchQuery) return;
    try {
      setLoading(true);
      setHasSearched(true);
      const endpoint = tab.toLowerCase();
      const response = await apiClient.get(
        `/v1/search/${endpoint}/${searchQuery}`
      );
      setResults(response.data);
      saveRecentSearch(searchQuery);
    } catch (err) {
      console.error("API Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Accounts render
  const renderAccounts = (accounts: any[]) => (
    <FlatList
      key={"ACCOUNTS"}
      data={accounts}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.accountCard}>
          <Image
            source={{
              uri: item.profilePic || "https://via.placeholder.com/40",
            }}
            style={styles.profilePic}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.username}>{item.username}</Text>
            <Text style={styles.followers}>
              {item._count?.followers || 0} followers
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={async () => {
              try {
                const response = await apiClient.post(
                  `/v1/connection/follow/${item.userId}`
                );
                if (response.status === 200) {
                  console.log(`User ${item.id} followed successfully`);
                }
              } catch (err) {
                console.error("Follow API error:", err);
              }
            }}
          >
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      )}
    />
  );

  // ✅ Pictures render
  const renderPictures = (pictures: any[]) => (
    <FlatList
      key={"PICTURES"}
      data={pictures}
      numColumns={3}
      keyExtractor={(item, index) => index.toString()}
      renderItem={({ item }) => (
        <Image
          source={{ uri: item.url || "https://via.placeholder.com/100" }}
          style={styles.picture}
        />
      )}
    />
  );
  const clearAllRecentSearches = async () => {
    if (!loggedInUserId) return;
    try {
      const key = `recentSearches_${loggedInUserId}`;
      await AsyncStorage.removeItem(key);
      setRecentSearches([]);
    } catch (err) {
      console.log("Error clearing all recents:", err);
    }
  };


  const renderClips = (clips: any[]) => (
    <FlatList
      key={"CLIPS"}
      data={clips}
      numColumns={1}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={styles.clipCard}>
          <Video
            source={{ uri: item.video }}
            style={styles.clipVideo}
            useNativeControls
            resizeMode="cover"
          />
          <Text style={styles.clipText}>{item.views} views</Text>
        </View>
      )}
    />
  );

  // ✅ Render content based on tab
  const renderContent = () => {
    if (!results) return null;

    if (selectedTab === "Top") {
      return (
        <View>
          {results.data.map((section: any, index: number) => {
            if (section.type === "Accounts" && section.accounts?.length) {
              return (
                <View key={index}>
                  <Text style={styles.sectionTitle}>Accounts</Text>
                  {renderAccounts(section.accounts)}
                </View>
              );
            }
            if (section.type === "clips" && section.clips?.length) {
              return (
                <View key={index}>
                  <Text style={styles.sectionTitle}>Clips</Text>
                  {renderClips(section.clips)}
                </View>
              );
            }
            return null;
          })}
        </View>
      );
    }

    if (selectedTab === "Accounts") {
      return renderAccounts(results?.data || []);
    }
    if (selectedTab === "Posts") {
      const mediaArray = results.data.flatMap((item: any) => item.media || []);
      return renderPictures(mediaArray);
    }
    if (selectedTab === "Clips") {
      return renderClips(results?.data || []);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchBar}>
        <TextInput
          placeholder="Search"
          value={query}
          onChangeText={setQuery}
          style={styles.input}
        />
        <TouchableOpacity
          style={styles.searchButton}
          onPress={() => fetchResults(selectedTab, query)}
        >
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      {!hasSearched ? (
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10 }}>
            <Text style={styles.sectionTitle}>Recent</Text>
            <TouchableOpacity onPress={clearAllRecentSearches}>
              <Text style={{ color: '#8C5EFF', fontSize: 13, fontWeight: '600' }}>Clear All</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={recentSearches}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingVertical: 10,
                  paddingHorizontal: 10,
                }}
              >
                <TouchableOpacity
                  style={{ flexDirection: "row", alignItems: "center" }}
                  onPress={() => {
                    setQuery(item);
                    fetchResults("Top", item);
                  }}
                >
                  <Text style={styles.username}>{item}</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => deleteRecentSearch(item)}>
                  <Ionicons name="close" size={22} color="#000" />
                </TouchableOpacity>
              </View>
            )}
          />
        </View>
      ) : (
        <>

          <View style={styles.tabs}>
            {TABS.map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => {
                  setSelectedTab(tab);
                  fetchResults(tab, query);
                }}
                style={[styles.tab, selectedTab === tab && styles.activeTab]}
              >
                <Text
                  style={[
                    styles.tabText,
                    selectedTab === tab && styles.activeTabText,
                  ]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#8A2BE2" />
          ) : (
            renderContent()
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12, backgroundColor: "#fff" },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",


    marginBottom: 12,

  },
  input: {
    flex: 1, height: 40, fontSize: 16, borderWidth: 1, borderColor: "#ddd",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchButton: {
    marginLeft: 8,
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: "#8A2BE2",
    borderRadius: 20,
  },
  searchButtonText: { color: "#fff", fontWeight: "bold" },
  tabs: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  tab: {
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: { borderBottomColor: "#8A2BE2" },
  tabText: { fontSize: 15, color: "#666" },
  activeTabText: { color: "#8A2BE2", fontWeight: "bold" },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    marginVertical: 8,
    color: "#333",
  },
  accountCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  profilePic: {
    width: 45,
    height: 45,
    borderRadius: 22,
    marginRight: 12,
    backgroundColor: '#eee'
  },
  username: { fontSize: 15, fontWeight: "600", color: "#000" },
  followers: { fontSize: 13, color: "#888" },
  addButton: {
    backgroundColor: "#8A2BE2",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  addButtonText: { color: "#fff", fontWeight: "bold", fontSize: 13 },
  picture: {
    width: 100,
    height: 100,
    margin: 5,
    borderRadius: 10,
    backgroundColor: "#f0f0f0",
  },
  clipCard: {
    width: "100%",
    height: 200,
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    marginVertical: 6,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  clipVideo: { width: "100%", height: "100%" },
  clipText: {
    position: "absolute",
    bottom: 10,
    left: 10,
    color: "#fff",
    fontWeight: "bold",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 6,
    borderRadius: 4,
    fontSize: 13,
  },
});