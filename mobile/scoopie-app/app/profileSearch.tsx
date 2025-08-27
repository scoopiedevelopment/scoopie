import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from 'expo-router';
import ScreenWrapper from '@/components/common/ScreenWrapper';
import { getFollowers, getFollowing } from '@/api/memberService';
import SearchBar from '@/components/searchbar/SearchBar';
import SettingsModal from '@/components/common/SettingsModal';

interface Member {
  id: string;
  name: string;
  username: string;
  avatar: string;
}

const ProfileSearch = () => {
  const [activeTab, setActiveTab] = useState<'Members' | 'Following'>('Members');


  const [membersData, setMembersData] = useState<Member[]>([]);
  const [membersPage, setMembersPage] = useState(1);
  const [membersHasNext, setMembersHasNext] = useState(true);

  const [followingData, setFollowingData] = useState<Member[]>([]);
  const [followingPage, setFollowingPage] = useState(1);
  const [followingHasNext, setFollowingHasNext] = useState(true);

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [settingsVisible, setSettingsVisible] = useState(false);

  const navigation = useNavigation();


  const fetchMembers = useCallback(
    async (page: number = 1, search: string = '', append: boolean = false) => {
      if (loading || loadingMore) return;
      page === 1 ? setLoading(true) : setLoadingMore(true);

      try {
        const data = await getFollowers(page, 10, search);
        const formatted: Member[] = data.data.followers.map((f: any) => ({
          id: f.follower.userId,
          name: f.follower.name,
          username: f.follower.username,
          avatar: f.follower.profilePic || 'https://via.placeholder.com/45?text=👤',
        }));

        setMembersData(append ? [...membersData, ...formatted] : formatted);
        setMembersPage(data.data.pagination.currentPage); 
        setMembersHasNext(data.data.pagination.hasNext); 
      } catch (err) {
        console.error('Error fetching members:', err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [membersData, loading, loadingMore]
  );

 
  const fetchFollowing = useCallback(
    async (page: number = 1, search: string = '', append: boolean = false) => {
      if (loading || loadingMore) return;
      page === 1 ? setLoading(true) : setLoadingMore(true);

      try {
        const data = await getFollowing(page, 10, search);
        const formatted: Member[] = data.data.following.map((f: any) => ({
          id: f.following.userId,
          name: f.following.name,
          username: f.following.username,
          avatar: f.following.profilePic || 'https://via.placeholder.com/45?text=👤',
        }));

        setFollowingData(append ? [...followingData, ...formatted] : formatted);
        setFollowingPage(data.data.pagination.currentPage);
        setFollowingHasNext(data.data.pagination.hasNext);
      } catch (err) {
        console.error('Error fetching following:', err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [followingData, loading, loadingMore]
  );


  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === 'Members') {
        fetchMembers(1, searchQuery, false);
      } else {
        fetchFollowing(1, searchQuery, false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, activeTab]);

  const handleSearchSubmit = () => {
    if (activeTab === 'Members') {
      fetchMembers(1, searchQuery, false);
    } else {
      fetchFollowing(1, searchQuery, false);
    }
  };

  const handleLoadMore = () => {
    if (activeTab === 'Members' && membersHasNext) {
      fetchMembers(membersPage + 1, searchQuery, true);
    } else if (activeTab === 'Following' && followingHasNext) {
      fetchFollowing(followingPage + 1, searchQuery, true);
    }
  };

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

  const dataToShow = activeTab === 'Members' ? membersData : followingData;

  return (
    <ScreenWrapper gradient>
      <View style={styles.container}>
  
        <LinearGradient
          colors={['#FFF7D2', 'rgba(86, 55, 158, 0.34)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity onPress={() => setSettingsVisible(true)}>
            <Feather name="more-vertical" size={22} color="#000" />
          </TouchableOpacity>
        </LinearGradient>

        <View style={styles.searchContainer}>
          <SearchBar
            placeholder="Search profiles..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearchSubmit}
          />
        </View>

       
        <View style={styles.tabContainer}>
          {['Members', 'Following'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={styles.tab}
              onPress={() => setActiveTab(tab as 'Members' | 'Following')}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab}
              </Text>
              {activeTab === tab && <View style={styles.activeTabLine} />}
            </TouchableOpacity>
          ))}
        </View>

        {/* List */}
        {loading && dataToShow.length === 0 ? (
          <ActivityIndicator size="large" style={{ marginTop: 20 }} />
        ) : dataToShow.length === 0 ? (
          <Text
            style={{
              textAlign: 'center',
              marginTop: 20,
              fontSize: 16,
              color: '#666',
            }}
          >
            No {activeTab.toLowerCase()} found
          </Text>
        ) : (
          <FlatList
            data={dataToShow}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              loadingMore ? <ActivityIndicator style={{ marginVertical: 20 }} /> : null
            }
          />
        )}
      </View>
      
      <SettingsModal 
        visible={settingsVisible} 
        onClose={() => setSettingsVisible(false)} 
      />
    </ScreenWrapper>
  );
};

export default ProfileSearch;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  searchContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  tabContainer: { flexDirection: 'row', marginBottom: 10 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  tabText: { fontSize: 16, color: '#666' },
  activeTabText: { color: '#000', fontWeight: '600' },
  activeTabLine: {
    marginTop: 4,
    height: 2,
    width: '70%',
    backgroundColor: '#7B4DFF',
  },
  backBtn: { padding: 4 },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  avatar: { width: 45, height: 45, borderRadius: 22, marginRight: 12 },
  name: { fontSize: 15, fontWeight: '600' },
  username: { fontSize: 13, color: '#666' },
  messageButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  messageText: { fontSize: 14, color: '#000' },
});