// FurAffinity API Types
// Based on https://github.com/recallfuture/furaffinity-api

export interface FAUser {
  id: string;
  name: string;
  profile_name: string;
  avatar?: string;
  banner?: string;
  stats?: {
    views: number;
    submissions: number;
    favorites: number;
    comments_earned: number;
    comments_made: number;
    watchers: number;
    watching: number;
  };
  profile?: {
    user_title?: string;
    artist_information?: string;
    contact_information?: string;
    species?: string;
    age?: string;
    gender?: string;
    location?: string;
    website?: string;
    favorite_artists?: string;
    favorite_pictures?: string;
    favorite_musicians?: string;
    favorite_writers?: string;
    favorite_games?: string;
    favorite_foods?: string;
    favorite_quote?: string;
  };
}

export interface FASubmission {
  id: string;
  title: string;
  author: string;
  author_icon?: string;
  description?: string;
  keywords?: string[];
  rating: 'general' | 'mature' | 'adult';
  type: 'image' | 'text' | 'audio' | 'flash';
  species?: string;
  gender?: string;
  theme?: string;
  size?: string;
  
  // URLs for different sizes
  download?: string;
  full?: string;
  thumbnail?: string;
  
  // Stats
  views?: number;
  comments?: number;
  favorites?: number;
  
  // Dates
  posted?: string;
  posted_at?: Date;
  
  // Additional metadata
  category?: string;
  folder?: string;
  
  // File information
  file_url?: string;
  preview_url?: string;
  thumbnail_url?: string;
  file_size?: number;
  resolution?: string;
}

export interface FAGalleryFolder {
  name: string;
  group_id?: string;
}

export interface FASearchParams {
  q?: string;              // Search query
  page?: number;           // Page number (1-indexed)
  perpage?: number;        // Results per page (max 72)
  order_by?: 'relevancy' | 'date' | 'popularity';
  order_direction?: 'asc' | 'desc';
  range?: 'day' | 'week' | 'month' | 'all';
  mode?: 'any' | 'all' | 'extended';
  rating?: ('general' | 'mature' | 'adult')[];
  type?: ('art' | 'flash' | 'photo' | 'music' | 'story' | 'poetry')[];
}

export interface FASearchResult {
  submissions: FASubmission[];
  total_results?: number;
  page: number;
  pages?: number;
  has_more?: boolean;
}

export interface FACredentials {
  cookie_a: string;
  cookie_b: string;
}

// Utility types for API responses
export interface FAApiResponse<T> {
  data?: T;
  error?: string;
  status?: number;
}

export interface FAUserGallery {
  submissions: FASubmission[];
  folders?: FAGalleryFolder[];
  page: number;
  has_more: boolean;
}

export interface FAUserProfile {
  user: FAUser;
  recent_submissions?: FASubmission[];
  watchers?: number;
  watching?: number;
}

// Authentication types
export interface FAAuthState {
  isAuthenticated: boolean;
  credentials: FACredentials | null;
  username?: string;
}

// Search state for hook
export interface FASearchState {
  submissions: FASubmission[];
  selectedSubmission: FASubmission | null;
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  searchQuery: string;
  hasMore: boolean;
}