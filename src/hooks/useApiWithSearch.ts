'use client'

import { useCallback } from 'react'
import { useReducer, useEffect, useRef } from 'react'
import { E621Post, SearchParams } from '@/lib/api/e621/types'
import { e621api } from '@/lib/api/e621'

// State types
export interface SearchState {
  posts: E621Post[]
  selectedPost: E621Post | null
  loading: boolean
  error: string | null
  currentPage: number
  totalPages: number
  searchQuery: string
  settings: UserSettings
}

export interface UserSettings {
  postsPerPage: number
  defaultRatings: ("q" | "s" | "e")[]
  blacklist: string[]
  theme: string
  autoLoadImages: boolean
}

// Action types
type SearchAction =
  | { type: 'SEARCH_START'; query: string }
  | { type: 'PAGINATION_START' } // New action for pagination loading state
  | { type: 'SEARCH_SUCCESS'; posts: E621Post[]; page: number; totalPages?: number; append?: boolean }
  | { type: 'SEARCH_ERROR'; error: string }
  | { type: 'SELECT_POST'; post: E621Post | null }
  | { type: 'UPDATE_SETTINGS'; settings: Partial<UserSettings> }
  | { type: 'LOAD_NEXT_PAGE' }
  | { type: 'SET_PAGE'; page: number }

// Default settings
const defaultSettings: UserSettings = {
  postsPerPage: 50,
  defaultRatings: ['s', 'q', 'e'],
  blacklist: [],
  theme: 'blue',
  autoLoadImages: true
}

// Load settings from localStorage
function loadSettings(): UserSettings {
  if (typeof window === 'undefined') return defaultSettings
  
  try {
    const stored = localStorage.getItem('e621-settings')
    if (!stored) return defaultSettings
    return { ...defaultSettings, ...JSON.parse(stored) }
  } catch (error) {
    console.error('Failed to load settings, using defaults:', error)
    return defaultSettings
  }
}

// Save settings to localStorage
function saveSettings(settings: UserSettings) {
  if (typeof window === 'undefined') return
  localStorage.setItem('e621-settings', JSON.stringify(settings))
}

// Load last search from localStorage
function loadLastSearch(): { posts: E621Post[], searchQuery: string } | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const lastSearchQuery = localStorage.getItem('e621-last-search-query');
    const lastSearchResults = localStorage.getItem('e621-last-search-results');
    
    if (!lastSearchQuery || !lastSearchResults) return null;
    
    const { posts, timestamp } = JSON.parse(lastSearchResults);
    
    // Check if the search results are less than 30 minutes old
    if (Date.now() - timestamp > 30 * 60 * 1000) {
      return null;
    }
    
    return { posts, searchQuery: lastSearchQuery };
  } catch (error) {
    console.error('Failed to load last search:', error);
    return null;
  }
}

// Get last search results or empty state
const lastSearch = typeof window !== 'undefined' ? loadLastSearch() : null;

// Initial state
const initialState: SearchState = {
  posts: lastSearch?.posts || [],
  selectedPost: null,
  loading: false,
  error: null,
  currentPage: 1,
  totalPages: lastSearch?.posts ? Math.ceil(lastSearch.posts.length / loadSettings().postsPerPage) : 1,
  searchQuery: lastSearch?.searchQuery || '',
  settings: loadSettings()
}

// Reducer
function searchReducer(state: SearchState, action: SearchAction): SearchState {
  switch (action.type) {
    case 'SEARCH_START':
      return {
        ...state,
        loading: true,
        error: null,
        searchQuery: action.query,
        currentPage: 1,
        posts: [] // Clear existing posts for a new search
      }
      
    case 'PAGINATION_START':
      return {
        ...state,
        loading: true,
        error: null
      }

    case 'SEARCH_SUCCESS':
      console.log(`[SearchReducer] SEARCH_SUCCESS action with ${action.posts ? action.posts.length : 'unknown'} posts`);
      
      // Always replace existing posts with new ones for pagination - don't append
      const updatedPosts = action.posts || [];
      
      // Store the search results in localStorage for persistence
      if (typeof window !== 'undefined' && updatedPosts.length > 0) {
        try {
          localStorage.setItem('e621-last-search-query', state.searchQuery);
          localStorage.setItem('e621-last-search-results', JSON.stringify({
            posts: updatedPosts.slice(0, 100), // Store only first 100 to avoid storage limits
            timestamp: Date.now()
          }));
          console.log('[SearchReducer] Saved search results to localStorage');
        } catch (e) {
          console.error('[SearchReducer] Failed to store search results:', e);
        }
      }
      
      // Use totalPages from API response (which already accounts for e621's pagination)
      // Don't recalculate based on postsPerPage - the API knows how many pages exist
      const newTotalPages = action.totalPages !== undefined ? action.totalPages : 1;
      
      console.log(`[SearchReducer] Updating state: ${updatedPosts.length} posts, page ${action.page}, totalPages ${newTotalPages} (from API: ${action.totalPages})`);
      
      return {
        ...state,
        loading: false,
        posts: updatedPosts,
        currentPage: action.page,
        totalPages: newTotalPages
      }

    case 'SEARCH_ERROR':
      return {
        ...state,
        loading: false,
        error: action.error,
        posts: []
      }

    case 'SELECT_POST':
      return {
        ...state,
        selectedPost: action.post
      }

    case 'UPDATE_SETTINGS':
      const newSettings = { ...state.settings, ...action.settings }
      saveSettings(newSettings)
      return {
        ...state,
        settings: newSettings
      }

    case 'LOAD_NEXT_PAGE':
      return {
        ...state,
        currentPage: Math.min(state.currentPage + 1, state.totalPages)
      }

    case 'SET_PAGE':
      return {
        ...state,
        currentPage: Math.max(1, Math.min(action.page, state.totalPages))
      }

    default:
      return state
  }
}

// Hook implementation
export function useApiWithSearch() {
  const [state, dispatch] = useReducer(searchReducer, initialState)
  console.log('[useApiWithSearch] Hook initialized');

  // Reference to track the current search to prevent duplicate requests
  const searchRequestRef = useRef<{query: string, page: number} | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Implementation with debouncing and duplicate request prevention
  const handleSearch = useCallback(async (query: string, page = 1) => {
    if (!query.trim()) {
      console.log('[useApiWithSearch] Search query is empty, skipping search');
      return;
    }
    
    if (!e621api) {
      console.error('[useApiWithSearch] E621 API client not available');
      dispatch({ 
        type: 'SEARCH_ERROR', 
        error: 'API client not available. Please try again.' 
      });
      return;
    }
    
    // Clear any pending search timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Check if this is a duplicate of the current search request
    if (searchRequestRef.current?.query === query && searchRequestRef.current?.page === page) {
      console.log(`[useApiWithSearch] Skipping duplicate search request for: ${query} (page ${page})`);
      return;
    }
    
    // Set a timeout to debounce the search request (300ms)
    searchTimeoutRef.current = setTimeout(async () => {
      console.log(`[useApiWithSearch] Executing search request for: "${query}" (page ${page})`);
      
      // Track the current search request
      searchRequestRef.current = { query, page };
      
      // Always show loading state for any search or pagination change
      if (query !== state.searchQuery) {
        dispatch({ type: 'SEARCH_START', query });
      } else {
        dispatch({ type: 'PAGINATION_START' });
      }

      try {
        // IMPORTANT FIX: The E621 API requires specific tag format
        // Make sure tags are properly formatted for e621 API
        const formattedQuery = query
          .trim()
          .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        
        console.log('[useApiWithSearch] Formatted query:', formattedQuery);
        
        const searchParams: SearchParams = {
          tags: formattedQuery,
          limit: 100, // Increased limit for more results
          page,
        };

        // Only add ratings if they're specified in settings
        if (state.settings.defaultRatings && state.settings.defaultRatings.length > 0) {
          searchParams.rating = state.settings.defaultRatings;
        }
        
        // Add blacklist if available
        if (state.settings.blacklist && state.settings.blacklist.length > 0) {
          searchParams.blacklist = state.settings.blacklist;
        }

        console.log('[useApiWithSearch] Search parameters:', JSON.stringify(searchParams));
        
        // Test if the e621api is properly loaded
        console.log('[useApiWithSearch] API client type:', typeof e621api);
        console.log('[useApiWithSearch] API client methods:', 
          Object.getOwnPropertyNames(Object.getPrototypeOf(e621api)));
        
        // Make the API request
        const result = await e621api.searchPosts(searchParams);
        
        if (!result) {
          console.error('[useApiWithSearch] API returned null result');
          dispatch({ 
            type: 'SEARCH_ERROR', 
            error: 'No response from server. Please try again.' 
          });
          return;
        }
        
        if (!result.posts) {
          console.error('[useApiWithSearch] API response missing posts array:', result);
          dispatch({ 
            type: 'SEARCH_ERROR', 
            error: 'Invalid response format. Please try again.' 
          });
          return;
        }
        
        // Handle API error information if it exists
        if ((result as any).error) {
          console.error('[useApiWithSearch] API returned error:', (result as any).error);
          dispatch({ 
            type: 'SEARCH_ERROR', 
            error: (result as any).error || 'Error from API. Please try again.' 
          });
          return;
        }
        
        console.log(`[useApiWithSearch] Received ${result.posts.length} posts from API`);
        
        if (result.posts.length === 0) {
          console.log('[useApiWithSearch] No posts found for query:', query);
          // This is not an error, just an empty result
          dispatch({ type: 'SEARCH_SUCCESS', posts: [], page });
          return;
        }
        
        // Validate posts data
        const validPosts = result.posts.filter((post: any) => post && post.id);
        if (validPosts.length < result.posts.length) {
          console.warn(`[useApiWithSearch] Filtered out ${result.posts.length - validPosts.length} invalid posts`);
        }
        
        if (validPosts.length > 0) {
          console.log('[useApiWithSearch] First post sample:', {
            id: validPosts[0].id,
            file: validPosts[0].file ? {
              url: validPosts[0].file.url ? validPosts[0].file.url.substring(0, 50) + '...' : null,
              ext: validPosts[0].file.ext
            } : 'No file data',
            preview: validPosts[0].preview ? {
              url: validPosts[0].preview.url ? validPosts[0].preview.url.substring(0, 50) + '...' : null
            } : 'No preview data'
          });
        }
        
        // Always replace results for each page, don't append
        console.log(`[useApiWithSearch] Dispatching search success with page ${result.page || page}`);
        dispatch({ 
          type: 'SEARCH_SUCCESS', 
          posts: validPosts, 
          page: result.page || page,
          totalPages: result.totalPages || Math.ceil(validPosts.length / state.settings.postsPerPage)
        });
      } catch (error) {
        console.error('[useApiWithSearch] Search error:', error);
        dispatch({ 
          type: 'SEARCH_ERROR', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }, 300);
  }, [state.settings.postsPerPage, state.settings.defaultRatings, state.settings.blacklist]);

  const selectPost = useCallback((post: E621Post | null) => {
    dispatch({ type: 'SELECT_POST', post })
  }, [])

  const updateSettings = useCallback((settings: Partial<UserSettings>) => {
    dispatch({ type: 'UPDATE_SETTINGS', settings })
  }, [])

  const loadNextPage = useCallback(() => {
    if (state.currentPage < state.totalPages) {
      dispatch({ type: 'LOAD_NEXT_PAGE' })
    }
  }, [state.currentPage, state.totalPages])

  const setPage = useCallback((page: number) => {
    dispatch({ type: 'SET_PAGE', page })
  }, [])

  const clearError = useCallback(() => {
    dispatch({ type: 'SEARCH_ERROR', error: '' })
  }, [])

  // Debug logging
  useEffect(() => {
    console.log('[useApiWithSearch] State updated:', {
      postsCount: state.posts.length,
      loading: state.loading,
      error: state.error,
      query: state.searchQuery
    });
  }, [state.posts, state.loading, state.error, state.searchQuery]);

  return {
    ...state,
    handleSearch,
    selectPost,
    updateSettings,
    loadNextPage,
    setPage,
    clearError
  }
}