// // Filter service for camera effects
// export interface Filter {
//   id: string;
//   name: string;
//   preview: string | null;
//   cssFilter?: string;
//   opacity?: number;
// }

// export const CAMERA_FILTERS: Filter[] = [
//   {
//     id: 'normal',
//     name: 'Normal',
//     preview: null,
//   },
//   {
//     id: 'vintage',
//     name: 'Vintage',
//     preview: null,
//     cssFilter: 'sepia(0.5) contrast(1.2) brightness(1.1)',
//     opacity: 0.8,
//   },
//   {
//     id: 'blackwhite',
//     name: 'Black & White',
//     preview: null,
//     cssFilter: 'grayscale(100%)',
//     opacity: 1,
//   },
//   {
//     id: 'sepia',
//     name: 'Sepia',
//     preview: null,
//     cssFilter: 'sepia(100%)',
//     opacity: 1,
//   },
//   {
//     id: 'dramatic',
//     name: 'Dramatic',
//     preview: null,
//     cssFilter: 'contrast(1.5) brightness(0.8) saturate(1.3)',
//     opacity: 0.9,
//   },
//   {
//     id: 'warm',
//     name: 'Warm',
//     preview: null,
//     cssFilter: 'hue-rotate(20deg) saturate(1.2) brightness(1.1)',
//     opacity: 0.8,
//   },
//   {
//     id: 'cool',
//     name: 'Cool',
//     preview: null,
//     cssFilter: 'hue-rotate(-20deg) saturate(1.1) brightness(1.05)',
//     opacity: 0.8,
//   },
//   {
//     id: 'dramatic_warm',
//     name: 'Dramatic Warm',
//     preview: null,
//     cssFilter: 'contrast(1.4) brightness(0.9) saturate(1.4) hue-rotate(15deg)',
//     opacity: 0.85,
//   },
//   {
//     id: 'soft',
//     name: 'Soft',
//     preview: null,
//     cssFilter: 'blur(0.5px) brightness(1.1) contrast(0.9)',
//     opacity: 0.7,
//   },
// ];

// export const getFilterById = (id: string): Filter | undefined => {
//   return CAMERA_FILTERS.find(filter => filter.id === id);
// };

// export const applyFilterToImage = (imageUri: string, filter: Filter): string => {
//   // This would typically involve image processing
//   // For now, we'll return the original URI
//   // In a real implementation, you'd use libraries like react-native-image-filter
//   return imageUri;
// };

// export const getFilterPreviewColor = (filterId: string): string => {
//   const colorMap: { [key: string]: string } = {
//     normal: '#ffffff',
//     vintage: '#8B4513',
//     blackwhite: '#808080',
//     sepia: '#D2B48C',
//     dramatic: '#2C2C2C',
//     warm: '#FF6B35',
//     cool: '#4A90E2',
//     dramatic_warm: '#B8860B',
//     soft: '#F0F8FF',
//   };
  
//   return colorMap[filterId] || '#ffffff';
// };


// Filter service for camera effects
export interface Filter {
  id: string;
  name: string;
  preview: string | null;
  cssFilter?: string;
  opacity?: number;
}

export const CAMERA_FILTERS: ReadonlyArray<Filter> = [
  {
    id: "normal",
    name: "Normal",
    preview: null,
  },
  {
    id: "vintage",
    name: "Vintage",
    preview: null,
    cssFilter: "sepia(0.5) contrast(1.2) brightness(1.1)",
    opacity: 0.8,
  },
  {
    id: "blackwhite",
    name: "Black & White",
    preview: null,
    cssFilter: "grayscale(100%)",
    opacity: 1,
  },
  {
    id: "sepia",
    name: "Sepia",
    preview: null,
    cssFilter: "sepia(100%)",
    opacity: 1,
  },
  {
    id: "dramatic",
    name: "Dramatic",
    preview: null,
    cssFilter: "contrast(1.5) brightness(0.8) saturate(1.3)",
    opacity: 0.9,
  },
  {
    id: "warm",
    name: "Warm",
    preview: null,
    cssFilter: "hue-rotate(20deg) saturate(1.2) brightness(1.1)",
    opacity: 0.8,
  },
  {
    id: "cool",
    name: "Cool",
    preview: null,
    cssFilter: "hue-rotate(-20deg) saturate(1.1) brightness(1.05)",
    opacity: 0.8,
  },
  {
    id: "dramatic_warm",
    name: "Dramatic Warm",
    preview: null,
    cssFilter:
      "contrast(1.4) brightness(0.9) saturate(1.4) hue-rotate(15deg)",
    opacity: 0.85,
  },
  {
    id: "soft",
    name: "Soft",
    preview: null,
    cssFilter: "blur(0.5px) brightness(1.1) contrast(0.9)",
    opacity: 0.7,
  },
];

export const getFilterById = (id: string): Filter | undefined =>
  CAMERA_FILTERS.find((filter) => filter.id === id);

export const applyFilterToImage = (imageUri: string, _filter: Filter): string => {
  // NOTE: In Expo/React Native, cssFilter is not directly supported.
  // For now, just return the original URI.
  // Later you can integrate something like "gl-react" or "react-native-image-filter-kit".
  return imageUri;
};

const FILTER_COLORS: Record<string, string> = {
  normal: "#ffffff",
  vintage: "#8B4513",
  blackwhite: "#808080",
  sepia: "#D2B48C",
  dramatic: "#2C2C2C",
  warm: "#FF6B35",
  cool: "#4A90E2",
  dramatic_warm: "#B8860B",
  soft: "#F0F8FF",
};

export const getFilterPreviewColor = (filterId: string): string =>
  FILTER_COLORS[filterId] ?? "#ffffff";
