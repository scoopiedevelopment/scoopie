/**
 * Utility functions for video detection and handling
 */

/**
 * Check if a URL is a video based on file extension
 * @param url - The URL to check
 * @returns boolean indicating if the URL is a video
 */
export const isVideoUrl = (url: string): boolean => {
  if (!url) return false;
  
  // Remove query parameters for extension check
  const cleanUrl = url.split('?')[0];
  const videoExtensions = ['.mp4', '.mov', '.mkv', '.webm', '.avi', '.m4v', '.3gp'];
  
  return videoExtensions.some(ext => cleanUrl.toLowerCase().endsWith(ext)) ||
         // Check for video MIME types in URL
         url.includes('video/') ||
         // Check for common video hosting patterns
         url.includes('video') && (url.includes('mp4') || url.includes('mov')) ||
         // Check for ImageKit video patterns (even if extension is .jpg)
         url.includes('imagekit.io') && url.includes('video') ||
         // Fallback: if URL contains 'video' in filename, treat as video
         url.toLowerCase().includes('video');
};

/**
 * Get media type from URL
 * @param url - The URL to check
 * @returns 'video' | 'image'
 */
export const getMediaType = (url: string): 'video' | 'image' => {
  return isVideoUrl(url) ? 'video' : 'image';
};
