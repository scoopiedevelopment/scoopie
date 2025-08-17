import React, { useState } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

const toggleBtnProfiles = () => {
      const [activeButton, setActiveButton] = useState<'edit' | 'share'>('edit');
  return (
     <View style={styles.actionRow}>
              <TouchableOpacity
                style={[
                  styles.btn,
                  activeButton === 'edit' ? styles.btnActive : styles.btnInactive,
                ]}
                onPress={() => setActiveButton('edit')}
              >
                <Text
                  style={[
                    styles.btnText,
                    activeButton === 'edit' ? styles.btnTextActive : styles.btnTextInactive,
                  ]}
                >
                  Edit Profile
                </Text>
              </TouchableOpacity>
    
              <TouchableOpacity
                style={[
                  styles.btn,
                  activeButton === 'share' ? styles.btnActive : styles.btnInactive,
                ]}
                onPress={() => setActiveButton('share')}
              >
                <Text
                  style={[
                    styles.btnText,
                    activeButton === 'share' ? styles.btnTextActive : styles.btnTextInactive,
                  ]}
                >
                  Share Profile
                </Text>
              </TouchableOpacity>
            </View>
  )
}

export default toggleBtnProfiles


const styles=StyleSheet.create({
      actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 20,
  },
  btn: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  btnActive: {
    backgroundColor: '#7B4DFF',
    borderColor: '#7B4DFF',
  },
  btnInactive: {
    backgroundColor: 'transparent',
    borderColor: '#7B4DFF',
  },
  btnText: {
    fontSize: 14,
    fontWeight: '500',
  },
  btnTextActive: { color: '#fff' },
  btnTextInactive: { color: '#7B4DFF' },
})