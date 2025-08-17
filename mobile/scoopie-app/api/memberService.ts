import apiClient from "./apiClient";
import { FollowersResponse } from "../models/MemberModel";

export const getFollowers = async (page: number) => {
  try {
    const response = await apiClient.get<FollowersResponse>(`/v1/connection/followers?page=${page}`);
    return response.data;
  } catch (error: any) {
    console.error("Error fetching followers:", error?.response || error);
    throw error;
  }
};
