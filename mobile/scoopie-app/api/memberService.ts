import apiClient from "./apiClient";
import { FollowersResponse, FollowingResponse } from "../models/MemberModel";

export const getFollowers = async (page: number, limit: number, search: string) => {
  try {
    const response = await apiClient.get<FollowersResponse>(
      `/v1/connection/followers?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`
    );
    return response.data;
  } catch (error: any) {
    console.error("Error fetching followers:", error?.response || error);
    throw error;
  }
};

export const getFollowing = async (page: number, limit: number, search: string) => {
  try {
    const response = await apiClient.get<FollowingResponse>(
      `/v1/connection/following?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`
    );

    return response.data;
  } catch (error: any) {
    console.error("Error fetching followers:", error?.response || error);
    throw error;
  }
};