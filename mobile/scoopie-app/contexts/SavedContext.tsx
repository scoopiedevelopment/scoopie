import React, { createContext, useContext, useState, useCallback } from 'react';
import { getSavedItems, toggleSavePost, toggleSaveClip } from '../api/savedService';

interface SavedContextType {
  savedItems: any[];
  refreshSavedItems: () => Promise<void>;
  toggleSavePostItem: (postId: string) => Promise<boolean>;
  toggleSaveClipItem: (clipId: string) => Promise<boolean>;
  isPostSaved: (postId: string) => boolean;
  isClipSaved: (clipId: string) => boolean;
  loading: boolean;
}

const SavedContext = createContext<SavedContextType | undefined>(undefined);

export const SavedProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [savedItems, setSavedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshSavedItems = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getSavedItems(1);
      if (response.success) {
        setSavedItems(response.data.saved);
      }
    } catch (error) {
      console.error('Error refreshing saved items:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load saved items on initial mount
  React.useEffect(() => {
    refreshSavedItems();
  }, [refreshSavedItems]);

  const toggleSavePostItem = useCallback(async (postId: string): Promise<boolean> => {
    try {
      const response = await toggleSavePost(postId);
      if (response.success) {
        // Refresh saved items to reflect the change
        await refreshSavedItems();
        return response.data.saved;
      }
      return false;
    } catch (error) {
      console.error('Error toggling save post:', error);
      throw error;
    }
  }, [refreshSavedItems]);

  const toggleSaveClipItem = useCallback(async (clipId: string): Promise<boolean> => {
    try {
      const response = await toggleSaveClip(clipId);
      if (response.success) {
        // Refresh saved items to reflect the change
        await refreshSavedItems();
        return response.data.saved;
      }
      return false;
    } catch (error) {
      console.error('Error toggling save clip:', error);
      throw error;
    }
  }, [refreshSavedItems]);

  const isPostSaved = useCallback((postId: string): boolean => {
    return savedItems?.some(item => item.post?.id === postId) || false;
  }, [savedItems]);

  const isClipSaved = useCallback((clipId: string): boolean => {
    return savedItems?.some(item => item.clip?.id === clipId) || false;
  }, [savedItems]);

  const value: SavedContextType = {
    savedItems,
    refreshSavedItems,
    toggleSavePostItem,
    toggleSaveClipItem,
    isPostSaved,
    isClipSaved,
    loading,
  };

  return (
    <SavedContext.Provider value={value}>
      {children}
    </SavedContext.Provider>
  );
};

export const useSaved = () => {
  const context = useContext(SavedContext);
  if (context === undefined) {
    throw new Error('useSaved must be used within a SavedProvider');
  }
  return context;
};