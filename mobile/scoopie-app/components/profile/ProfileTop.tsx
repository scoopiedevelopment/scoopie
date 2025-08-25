import { Profile } from '@/models/ProfileModel'
import { Feather, Ionicons } from '@expo/vector-icons'
import React from 'react'
import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import * as Linking from 'expo-linking';
import { router } from 'expo-router';

interface ProfileTop {
    email: string;
    profile: Profile;
}
interface ProfileTopProps {
    profileData: ProfileTop
}

const ProfileTop = ({ profileData }: ProfileTopProps) => {

    const calculateAge = (dateOfBirth: string): number => {
        if (!dateOfBirth) return 0;

        const dob = new Date(dateOfBirth);
        const today = new Date();

        let age = today.getFullYear() - dob.getFullYear();
        const monthDiff = today.getMonth() - dob.getMonth();
        const dayDiff = today.getDate() - dob.getDate();

        if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
            age--;
        }
        return age;
    };

    const handleGlobePress = (website: string) => {
        Linking.openURL(website);
    };

    const handleEmailPress = (email: string) => {
        Linking.openURL(`mailto:${email}`);
    };

    return (
        <View style={styles.statsProfileRow}>
            <View style={styles.statsCol}>
                <Pressable onPress={() => router.push('/profileSearch')}>
                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>{profileData?.profile?._count?.following}</Text>
                        <Text style={styles.statLabel}>Added</Text>
                    </View>
                </Pressable>
                <View style={styles.line} />
                <View style={styles.statBox}>
                    <Text style={styles.statValue}>{profileData?.profile?._count?.totalLikes}</Text>
                    <Text style={styles.statLabel}>Likes</Text>
                </View>
            </View>

            <View style={styles.profileSection}>
                {profileData?.profile?.profilePic ?
                    <Image
                        source={{ uri: profileData?.profile?.profilePic }}
                        style={styles.avatar}
                    /> : <Ionicons name="person-circle" size={100} color="#ccc" style={{
                        backgroundColor: '#eee', borderRadius: 50, marginTop: -50,
                        zIndex: 10,
                    }} />
                }

                {profileData?.profile?.username && (
                    <Text style={styles.username}>{profileData.profile.username}</Text>
                )}

                {profileData?.profile?.name && (
                    <Text style={styles.name}>{profileData.profile.name}</Text>
                )}

                {profileData?.profile?.dateofBirth && (
                    <Text style={styles.bio}>
                        {calculateAge(profileData.profile.dateofBirth)} {profileData.profile.bio}
                    </Text>
                )}

                <View style={styles.iconRow}>
                    <Ionicons name="location-outline" size={22} color="#555" />
                    <Pressable onPress={() => handleEmailPress(profileData.email)}>
                        <Ionicons name="mail-outline" size={22} color="#555" />
                    </Pressable>

                    <Feather name="phone" size={20} color="#555" />
                    <Pressable onPress={() => {
                        if (profileData?.profile?.website) {
                            handleGlobePress(profileData.profile.website);
                        }
                    }}>
                        <Ionicons name="globe-outline" size={22} color="#555" />
                    </Pressable>
                </View>
            </View>

            <View style={styles.statsCol}>
                <Pressable onPress={() => router.push('/profileSearch')}>
                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>{profileData?.profile?._count?.followers}</Text>
                        <Text style={styles.statLabel}>Members</Text>
                    </View>
                </Pressable>

                <View style={styles.line} />
                <View style={styles.statBox}>
                    <Text style={styles.statValue}>{profileData?.profile?._count?.totalViews}</Text>
                    <Text style={styles.statLabel}>Views</Text>
                </View>
            </View>
        </View>
    )
}

export default ProfileTop

const styles = StyleSheet.create({
    statsProfileRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'center',
    },
    profileSection: { alignItems: 'center', marginTop: 10, maxWidth: '50%' },
    username: { fontSize: 14, color: '#888' },
    name: { fontSize: 18, fontWeight: '700', color: '#000' },
    bio: { fontSize: 14, color: '#666', textAlign: 'center', marginTop: 4 },
    iconRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: 150,
        marginTop: 20,
    },
    statsCol: {
        justifyContent: 'center',
        alignItems: 'center',
        gap: 5,
    },
    statBox: { alignItems: 'center' },
    statValue: { fontSize: 16, fontWeight: '700', color: '#000' },
    statLabel: { fontSize: 12, color: '#777' },
    line: { backgroundColor: '#908F8F', height: 1, width: 70 },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
        borderColor: '#fff',
        marginHorizontal: 30,
        marginTop: -50,
        zIndex: 10,
        backgroundColor: '#eee'
    },
})