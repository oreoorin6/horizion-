'use client'

import { useReducer, useCallback, useEffect, useRef } from 'react'
import { useApi } from './useApi';
import { e621api } from '@/lib/api/e621';
import { E621Post, SearchParams } from '@/lib/api/e621/types';
import { IApiClient, IE621ApiClient } from '@/lib/api/IApiClient';
import { useBlacklist } from './useBlacklist';

// State types
export interface E621SearchState {
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
type E621SearchAction =
  | { type: 'SEARCH_START'; query: string }
  | { type: 'SEARCH_SUCCESS'; posts: E621Post[]; page: number }
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
const lastSearch = loadLastSearch();

// Initial state
const initialState: E621SearchState = {
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
function e621SearchReducer(state: E621SearchState, action: E621SearchAction): E621SearchState {
  switch (action.type) {
    case 'SEARCH_START':
      return {
        ...state,
        loading: true,
        error: null,
        searchQuery: action.query,
        currentPage: 1
      }

    case 'SEARCH_SUCCESS':
      console.log(`[SearchReducer] SEARCH_SUCCESS action with ${action.posts ? action.posts.length : 'unknown'} posts`);
      console.log('[SearchReducer] Posts data sample:', action.posts && action.posts.length > 0 ? 
        JSON.stringify(action.posts[0], null, 2).substring(0, 500) : 'No posts');
      
      // Store the search results in localStorage for persistence
      if (typeof window !== 'undefined' && action.posts && action.posts.length > 0) {
        try {
          localStorage.setItem('e621-last-search-query', state.searchQuery);
          localStorage.setItem('e621-last-search-results', JSON.stringify({
            posts: action.posts,
            timestamp: Date.now()
          }));
          console.log('[SearchReducer] Saved search results to localStorage');
        } catch (e) {
          console.error('[SearchReducer] Failed to store search results:', e);
        }
      }
      
      const newTotalPages = action.posts && action.posts.length > 0 ? 
        Math.ceil(action.posts.length / state.settings.postsPerPage) : 0;
      
      console.log(`[SearchReducer] Updating state: ${action.posts ? action.posts.length : 0} posts, page ${action.page}, totalPages ${newTotalPages}`);
      
      return {
        ...state,
        loading: false,
        posts: action.posts || [],
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

// Hook
export function useE621Search() {
  const [state, dispatch] = useReducer(e621SearchReducer, initialState)
  const { getSearchModifiers } = useBlacklist()
  console.log('Getting e621api from useE621Search hook');
  
  // Import the E621ApiClient type for proper typing
  const e621api = useApi<IE621ApiClient>('e621');
  console.log('e621api obtained:', e621api ? 'API client found' : 'API client not found');

  // Load settings on mount
  useEffect(() => {
    const settings = loadSettings()
    dispatch({ type: 'UPDATE_SETTINGS', settings })
  }, [])

  // Reference to track the current search to prevent duplicate requests
  const searchRequestRef = useRef<{query: string, page: number} | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Implementation with debouncing and duplicate request prevention
  const handleSearch = useCallback(async (query: string, page = 1) => {
    if (!query.trim()) {
      console.log('Search query is empty, skipping search');
      return;
    }
    
    if (!e621api) {
      console.error('E621 API client not available');
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
      console.log(`Skipping duplicate search request for: ${query} (page ${page})`);
      return;
    }
    
    // Set a timeout to debounce the search request (300ms)
    searchTimeoutRef.current = setTimeout(async () => {
      console.log(`Executing search request for: "${query}" (page ${page})`);
      
      // Track the current search request
      searchRequestRef.current = { query, page };
      
      dispatch({ type: 'SEARCH_START', query });

      try {
        // Get blacklist modifiers for "hide" mode
        const blacklistModifiers = getSearchModifiers();
        
        // Combine user query with blacklist modifiers
        const finalQuery = blacklistModifiers.length > 0 
          ? `${query} ${blacklistModifiers.join(' ')}`
          : query;
        
        const searchParams: SearchParams = {
          tags: finalQuery,
          limit: state.settings.postsPerPage,
          page,
          rating: state.settings.defaultRatings,
          blacklist: state.settings.blacklist
        };

        console.log('Search parameters:', JSON.stringify(searchParams));
        console.log('Applied blacklist modifiers:', blacklistModifiers);
        
        const result = await e621api.searchPosts(searchParams);
        
        if (!result || !result.posts) {
          console.error('Invalid search result structure:', result);
          dispatch({ 
            type: 'SEARCH_ERROR', 
            error: 'Invalid response from server. Please try again.' 
          });
          return;
        }
        
        console.log(`Received ${result.posts.length} posts from API`);
        
        // Validate posts data
        const validPosts = result.posts.filter((post: E621Post) => post && post.id);
        if (validPosts.length < result.posts.length) {
          console.warn(`Filtered out ${result.posts.length - validPosts.length} invalid posts`);
        }
        
        dispatch({ type: 'SEARCH_SUCCESS', posts: validPosts, page });
      } catch (error) {
        console.error('Search error:', error);
        dispatch({ 
          type: 'SEARCH_ERROR', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }, 300);
  }, [state.settings.postsPerPage, state.settings.defaultRatings, state.settings.blacklist, e621api]);

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