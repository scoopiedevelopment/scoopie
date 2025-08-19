import apiClient from "./apiClient";
import { StoryResponse } from "@/models/StoryModel";

export const getStories = async (page: number) => {
  try {
    const response = await apiClient.get<StoryResponse>(`/v1/story/get?page=${page}`);
    return response.data;
  } catch (error: any) {
    console.error("Error fetching stories:", error?.response || error);
    throw error;
  }
};
