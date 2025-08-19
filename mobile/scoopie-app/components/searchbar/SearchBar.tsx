import React from "react";
import { View, TextInput, StyleSheet, TextInputProps } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface Props extends TextInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onSubmitEditing?: () => void;
}

export default function SearchBar({ 
  value, 
  onChangeText, 
  placeholder, 
  onSubmitEditing,
  ...props 
}: Props) {
  return (
    <View style={styles.container}>
      <Ionicons name="search" size={20} color="gray" style={styles.icon} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder || "Search"}
        placeholderTextColor="#aaa"
        onSubmitEditing={onSubmitEditing}
        returnKeyType="search"
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f2f2f2",
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  icon: { marginRight: 6 },
  input: { 
    flex: 1, 
    height: 40, 
    fontSize: 16,
    paddingVertical: 8,
  },
});