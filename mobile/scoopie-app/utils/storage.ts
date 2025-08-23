import AsyncStorage from '@react-native-async-storage/async-storage';

export const saveUserData = async (userToken, dataType, data) => {
  try {
    await AsyncStorage.setItem(`${userToken}_${dataType}`, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save user data:", e);
  }
};

export const getUserData = async (userToken, dataType) => {
  try {
    const data = await AsyncStorage.getItem(`${userToken}_${dataType}`);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to load user data:", e);
    return [];
  }
};
