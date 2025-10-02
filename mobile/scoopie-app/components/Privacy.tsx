import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import SettingsHeader from './common/SettingsHeader';

export default function PrivacyScreen() {
  const router = useRouter();

  type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

  const sections: {
    title: string;
    items: { label: string; icon: IoniconName }[];
  }[] = [
    {
      title: 'Discoverability',
      items: [
        { label: 'Private Account', icon: 'eye-outline' }, // eye icon
        { label: 'Switch Account to Others', icon: 'checkbox-outline' }, // square with check mark
        { label: 'Sync Contacts & Friends', icon: 'swap-vertical-outline' }, // up & down arrows
        { label: 'Location Services', icon: 'location-outline' },
      ],
    },
    {
      title: 'Personalization',
      items: [
        { label: 'Ads Personalization', icon: 'megaphone-outline' },
        { label: 'Quick Upload', icon: 'cloud-upload-outline' },
        { label: 'Download Your Data', icon: 'download-outline' },
      ],
    },
    {
      title: 'Safety',
      items: [
        { label: 'Downloads', icon: 'download-outline' },
        { label: 'Comments', icon: 'chatbubble-outline' },
        { label: 'Mentions & Tags', icon: 'person-outline' }, // person icon
        { label: 'Added List', icon: 'list-outline' },
      ],
    },
  ];

  return (
    <View style={styles.container}>
      <SettingsHeader title="Privacy & Security" />

      {/* Scrollable content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {sections.map((section, idx) => (
          <View key={idx} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.items.map((item, index) => (
              <TouchableOpacity key={index} style={styles.optionRow}>
                <View style={styles.optionLeft}>
                  <Ionicons name={item.icon} size={20} color="#000000" style={styles.optionIcon} />
                  <Text style={styles.optionText}>{item.label}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#000000" />
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 18,
    marginBottom: 10,
    color: '#000000',
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E6E6E6',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIcon: {
    marginRight: 12,
  },
  optionText: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 17,
    color: '#0B0B0B',
  },
});