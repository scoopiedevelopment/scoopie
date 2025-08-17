import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface TextCardProps {
    avatar: string;
    name: string;
    timeAgo: string;
    description: string;
    views: string | number;
    stars: string | number;
    comments: string | number;
    shares: string | number;
}

export default function TextCard({
    avatar,
    name,
    timeAgo,
    description,
    views,
    stars,
    comments,
    shares,
}: TextCardProps) {
    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <Image source={{ uri: avatar }} style={styles.avatar} />
                <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{name}</Text>
                    <Text style={styles.time}>{timeAgo}</Text>
                </View>
                <TouchableOpacity>
                    <Feather name="more-horizontal" size={20} color="#000" />
                </TouchableOpacity>
            </View>


            <Text style={styles.description}>{description}</Text>

            <View style={styles.footer}>
                <View style={styles.iconBox}>

                    <Image source={require('../../assets/icons/watchIcon.png')} style={styles.iconImage} />
                    <Text style={styles.iconText}>{views}</Text>
                </View>
                <View style={styles.iconBox}>
                    <Image source={require('../../assets/icons/starIcon.png')} style={styles.iconImage} />
                    <Text style={styles.iconText}>{stars}</Text>
                </View>
                <View style={styles.iconBox}>
                    <Image source={require('../../assets/icons/commentIcon.png')} style={styles.iconImage} />
                    <Text style={styles.iconText}>{comments}</Text>
                </View>
                <View style={styles.iconBox}>
                    <Image source={require('../../assets/icons/shareIcon.png')} style={styles.iconImage} />
                    <Text style={styles.iconText}>{shares}</Text>
                </View>
                <TouchableOpacity style={{ marginLeft: 'auto' }}>
                    <Image source={require('../../assets/icons/saveIcon.png')} style={styles.iconImage} />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        marginVertical: 8,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 8,
    },
    name: {
        fontWeight: 'bold',
        fontSize: 14,
        color: '#000',
    },
    time: {
        fontSize: 12,
        color: '#777',
    },
    iconImage: {
        width: 20,
        height: 20,
        resizeMode: 'contain',
        marginBottom: 4,
    },
    description: {
        fontSize: 14,
        color: '#333',
        marginBottom: 10,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconBox: {
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 20,
    },
    iconText: {
        marginLeft: 4,
        fontSize: 12,
        color: '#555',
    },
});
