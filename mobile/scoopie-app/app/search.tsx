import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Image,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import ScreenWrapper from "@/components/common/ScreenWrapper";
// import axios from "axios"; // ✅ Added Axios

interface Account {
  id: string;
  username: string;
  profilePic: string | null;
  members: string;
}

// ✅ Dummy data for now
const dummyResults: Account[] = [
  {
    id: "1",
    username: "friends_official",
    profilePic:
      "https://upload.wikimedia.org/wikipedia/commons/b/bc/Friends_logo.svg",
    members: "200M members",
  },
  {
    id: "2",
    username: "friends_fanclub",
    profilePic:
      "https://upload.wikimedia.org/wikipedia/en/d/d6/Friends_season_one_cast.jpg",
    members: "20K members",
  },
];

const SearchScreen = () => {
  const [searchText, setSearchText] = useState("");
  const [userId, setUserId] = useState("user123");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [showRecent, setShowRecent] = useState(true);

  // Load recent searches
  useEffect(() => {
    const initializeData = async () => {
      const allData = await SecureStore.getItemAsync("searchHistory");
      let parsedData = allData ? JSON.parse(allData) : {};

      if (!parsedData[userId]) {
        parsedData[userId] = ["friends", "cats", "dogs"];
        await SecureStore.setItemAsync(
          "searchHistory",
          JSON.stringify(parsedData)
        );
      }
      setRecentSearches(parsedData[userId]);
    };
    initializeData();
  }, [userId]);

  const saveSearches = async (searches: string[]) => {
    const allData = await SecureStore.getItemAsync("searchHistory");
    let parsedData = allData ? JSON.parse(allData) : {};
    parsedData[userId] = searches;
    await SecureStore.setItemAsync("searchHistory", JSON.stringify(parsedData));
  };

  const handleClearRecent = async (item: string) => {
    const updatedSearches = recentSearches.filter((search) => search !== item);
    setRecentSearches(updatedSearches);
    await saveSearches(updatedSearches);
  };

  const handleClearAll = async () => {
    const allData = await SecureStore.getItemAsync("searchHistory");
    let parsedData = allData ? JSON.parse(allData) : {};
    parsedData[userId] = [];
    await SecureStore.setItemAsync("searchHistory", JSON.stringify(parsedData));
    setRecentSearches([]);
  };

  const fetchAccounts = async (query: string) => {
    if (!query) return;
    setLoading(true);
    setShowRecent(false);

    try {
      // 🔴 Real API request (commented for now)
      /*
      const token = "YOUR_TOKEN_HERE";
      const url = https://scoopie.manishdashsharma.site/api/v1/search/accounts/${encodeURIComponent(query)};
      const response = await axios.get(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: Bearer ${token},
        },
      });
      setSearchResults(response.data.data || []);
      */

      // ✅ Using dummy data for now
      setTimeout(() => {
        setSearchResults(dummyResults);
        setLoading(false);
      }, 500);

      // Save to recent searches if not duplicate
      if (!recentSearches.includes(query)) {
        const updated = [query, ...recentSearches].slice(0, 10);
        setRecentSearches(updated);
        saveSearches(updated);
      }
    } catch (error) {
      console.error("Error fetching accounts:", error);
      setLoading(false);
    }
  };

  const handleSelectRecent = (term: string) => {
    setSearchText(term);
    fetchAccounts(term);
  };

  const handleSearchInput = (text: string) => {
    setSearchText(text);
    setShowRecent(true);
  };

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        {/* Search Bar */}
        <TextInput
          style={styles.searchBar}
          placeholder="Search"
          value={searchText}
          onChangeText={handleSearchInput}
          onSubmitEditing={() => fetchAccounts(searchText)}
        />

        {/* Recent Searches */}
        {showRecent && searchText.trim() !== "" && (
          <>
            <View style={styles.recentHeader}>
              <Text style={styles.sectionTitle}>Recent</Text>
              {recentSearches.length > 0 && (
                <TouchableOpacity onPress={handleClearAll}>
                  <Text style={styles.clearAll}>Clear All</Text>
                </TouchableOpacity>
              )}
            </View>

            <FlatList
              data={recentSearches.filter((item) =>
                item.toLowerCase().includes(searchText.toLowerCase())
              )}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.recentItem}
                  onPress={() => handleSelectRecent(item)}
                >
                  <Text style={styles.recentText}>{item}</Text>
                  <TouchableOpacity onPress={() => handleClearRecent(item)}>
                    <Text style={styles.clearBtn}>×</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              )}
            />
          </>
        )}

        {/* Search Results */}
        {!showRecent && (
          <>
            {loading && <ActivityIndicator size="small" color="gray" />}
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id}
              ListHeaderComponent={() => (
                <Text style={styles.sectionTitle}>Accounts</Text>
              )}
              renderItem={({ item }) => (
                <View style={styles.resultRow}>
                  <Image
                    source={{ uri: item.profilePic || "" }}
                    style={styles.avatar}
                  />
                  <View style={styles.info}>
                    <Text style={styles.username}>{item.username}</Text>
                    <Text style={styles.members}>{item.members}</Text>
                  </View>
                  <TouchableOpacity style={styles.addBtn}>
                    <Text style={styles.addText}>Add</Text>
                  </TouchableOpacity>
                </View>
              )}
            />
          </>
        )}
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  searchBar: {
    height: 40,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 16, fontWeight: "bold", marginVertical: 8 },
  recentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 8,
  },
  clearAll: { color: "blue" },
  recentItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderColor: "#ccc",
  },
  recentText: { fontSize: 14 },
  clearBtn: { color: "red", fontWeight: "bold", fontSize: 18 },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderColor: "#ccc",
  },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  info: { flex: 1 },
  username: { fontSize: 14, fontWeight: "600" },
  members: { fontSize: 12, color: "gray" },
  addBtn: {
    backgroundColor: "#9b59b6",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  addText: { color: "#fff", fontWeight: "bold" },
});

export default SearchScreen;