'use client'

import { useReducer, useCallback, useEffect, useRef } from 'react'
import { useApi } from './useApi';
import { faapi } from '@/lib/api/furaffinity';
import { FASubmission, FASearchParams, FACredentials } from '@/lib/api/furaffinity/types';
import { IFAApiClient } from '@/lib/api/IApiClient';

// State types
export interface FASearchState {
  submissions: FASubmission[]
  selectedSubmission: FASubmission | null
  loading: boolean
  error: string | null
  currentPage: number
  totalPages: number
  searchQuery: string
  hasMore: boolean
  settings: FAUserSettings
}

export interface FAUserSettings {
  submissionsPerPage: number
  defaultRatings: ("general" | "mature" | "adult")[]
  searchMode: 'any' | 'all' | 'extended'
  orderBy: 'relevancy' | 'date' | 'popularity'
  orderDirection: 'asc' | 'desc'
  autoLoadImages: boolean
}

// Action types
type FASearchAction =
  | { type: 'SEARCH_START'; query: string }
  | { type: 'SEARCH_SUCCESS'; submissions: FASubmission[]; page: number; hasMore: boolean }
  | { type: 'SEARCH_ERROR'; error: string }
  | { type: 'SELECT_SUBMISSION'; submission: FASubmission | null }
  | { type: 'UPDATE_SETTINGS'; settings: Partial<FAUserSettings> }
  | { type: 'LOAD_NEXT_PAGE' }
  | { type: 'SET_PAGE'; page: number }

// Default settings
const defaultSettings: FAUserSettings = {
  submissionsPerPage: 72, // FA default max
  defaultRatings: ['general', 'mature', 'adult'],
  searchMode: 'any',
  orderBy: 'relevancy',
  orderDirection: 'desc',
  autoLoadImages: true
}

// Load settings from localStorage
function loadFASettings(): FAUserSettings {
  if (typeof window === 'undefined') return defaultSettings
  
  try {
    const stored = localStorage.getItem('fa-settings')
    if (!stored) return defaultSettings
    return { ...defaultSettings, ...JSON.parse(stored) }
  } catch (error) {
    console.error('Failed to load FA settings, using defaults:', error)
    return defaultSettings
  }
}

// Save settings to localStorage
function saveFASettings(settings: FAUserSettings) {
  if (typeof window === 'undefined') return
  localStorage.setItem('fa-settings', JSON.stringify(settings))
}

// Load last search from localStorage
function loadLastFASearch(): { submissions: FASubmission[], searchQuery: string } | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const lastSearchQuery = localStorage.getItem('fa-last-search-query');
    const lastSearchResults = localStorage.getItem('fa-last-search-results');
    
    if (!lastSearchQuery || !lastSearchResults) return null;
    
    const { submissions, timestamp } = JSON.parse(lastSearchResults);
    
    // Check if the search results are less than 30 minutes old
    if (Date.now() - timestamp > 30 * 60 * 1000) {
      return null;
    }
    
    return { submissions, searchQuery: lastSearchQuery };
  } catch (error) {
    console.error('Failed to load last FA search:', error);
    return null;
  }
}

// Get last search results or empty state
const lastFASearch = loadLastFASearch();

// Initial state
const initialState: FASearchState = {
  submissions: lastFASearch?.submissions || [],
  selectedSubmission: null,
  loading: false,
  error: null,
  currentPage: 1,
  totalPages: lastFASearch?.submissions ? Math.ceil(lastFASearch.submissions.length / loadFASettings().submissionsPerPage) : 1,
  searchQuery: lastFASearch?.searchQuery || '',
  hasMore: false,
  settings: loadFASettings()
}

// Reducer
function faSearchReducer(state: FASearchState, action: FASearchAction): FASearchState {
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
      console.log(`[FASearchReducer] SEARCH_SUCCESS action with ${action.submissions ? action.submissions.length : 'unknown'} submissions`);
      
      // Store the search results in localStorage for persistence
      if (typeof window !== 'undefined' && action.submissions && action.submissions.length > 0) {
        try {
          localStorage.setItem('fa-last-search-query', state.searchQuery);
          localStorage.setItem('fa-last-search-results', JSON.stringify({
            submissions: action.submissions,
            timestamp: Date.now()
          }));
          console.log('[FASearchReducer] Saved FA search results to localStorage');
        } catch (e) {
          console.error('[FASearchReducer] Failed to store FA search results:', e);
        }
      }
      
      const newTotalPages = action.submissions && action.submissions.length > 0 ? 
        Math.ceil(action.submissions.length / state.settings.submissionsPerPage) : 0;
      
      console.log(`[FASearchReducer] Updating state: ${action.submissions ? action.submissions.length : 0} submissions, page ${action.page}, totalPages ${newTotalPages}`);
      
      return {
        ...state,
        loading: false,
        submissions: action.submissions || [],
        currentPage: action.page,
        totalPages: newTotalPages,
        hasMore: action.hasMore
      }

    case 'SEARCH_ERROR':
      return {
        ...state,
        loading: false,
        error: action.error,
        submissions: []
      }

    case 'SELECT_SUBMISSION':
      return {
        ...state,
        selectedSubmission: action.submission
      }

    case 'UPDATE_SETTINGS':
      const newSettings = { ...state.settings, ...action.settings }
      saveFASettings(newSettings)
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
export function useFASearch() {
  const [state, dispatch] = useReducer(faSearchReducer, initialState)
  console.log('Getting faapi from useFASearch hook');
  
  const faapi = useApi<IFAApiClient>('furaffinity');
  console.log('faapi obtained:', faapi ? 'FA API client found' : 'FA API client not found');

  // Load settings on mount
  useEffect(() => {
    const settings = loadFASettings()
    dispatch({ type: 'UPDATE_SETTINGS', settings })
  }, [])

  // Reference to track the current search to prevent duplicate requests
  const searchRequestRef = useRef<{query: string, page: number} | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Implementation with debouncing and duplicate request prevention
  const handleSearch = useCallback(async (query: string, page = 1) => {
    if (!query.trim()) {
      console.log('FA search query is empty, skipping search');
      return;
    }
    
    if (!faapi) {
      console.error('FA API client not available');
      dispatch({ 
        type: 'SEARCH_ERROR', 
        error: 'FA API client not available. Please try again.' 
      });
      return;
    }
    
    // Clear any pending search timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Check if this is a duplicate of the current search request
    if (searchRequestRef.current?.query === query && searchRequestRef.current?.page === page) {
      console.log(`Skipping duplicate FA search request for: ${query} (page ${page})`);
      return;
    }
    
    // Set a timeout to debounce the search request (300ms)
    searchTimeoutRef.current = setTimeout(async () => {
      console.log(`Executing FA search request for: "${query}" (page ${page})`);
      
      // Track the current search request
      searchRequestRef.current = { query, page };
      
      dispatch({ type: 'SEARCH_START', query });

      try {
        const searchParams: FASearchParams = {
          q: query,
          page,
          perpage: state.settings.submissionsPerPage,
          order_by: state.settings.orderBy,
          order_direction: state.settings.orderDirection,
          mode: state.settings.searchMode,
          rating: state.settings.defaultRatings
        };

        console.log('FA Search parameters:', JSON.stringify(searchParams));
        
        const result = await faapi.searchSubmissions(searchParams);
        
        if (!result || !result.submissions) {
          console.error('Invalid FA search result structure:', result);
          dispatch({ 
            type: 'SEARCH_ERROR', 
            error: 'Invalid response from FA server. Please try again.' 
          });
          return;
        }
        
        console.log(`Received ${result.submissions.length} submissions from FA API`);
        
        // Validate submissions data
        const validSubmissions = result.submissions.filter((submission: FASubmission) => submission && submission.id);
        if (validSubmissions.length < result.submissions.length) {
          console.warn(`Filtered out ${result.submissions.length - validSubmissions.length} invalid FA submissions`);
        }
        
        dispatch({ 
          type: 'SEARCH_SUCCESS', 
          submissions: validSubmissions, 
          page,
          hasMore: result.has_more || false
        });
      } catch (error) {
        console.error('FA Search error:', error);
        dispatch({ 
          type: 'SEARCH_ERROR', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }, 300);
  }, [state.settings.submissionsPerPage, state.settings.orderBy, state.settings.orderDirection, state.settings.searchMode, state.settings.defaultRatings, faapi]);

  const selectSubmission = useCallback((submission: FASubmission | null) => {
    dispatch({ type: 'SELECT_SUBMISSION', submission })
  }, [])

  const updateSettings = useCallback((settings: Partial<FAUserSettings>) => {
    dispatch({ type: 'UPDATE_SETTINGS', settings })
  }, [])

  const loadNextPage = useCallback(() => {
    if (state.hasMore) {
      const nextPage = state.currentPage + 1;
      handleSearch(state.searchQuery, nextPage);
    }
  }, [state.currentPage, state.hasMore, state.searchQuery, handleSearch])

  const setPage = useCallback((page: number) => {
    dispatch({ type: 'SET_PAGE', page })
  }, [])

  const clearError = useCallback(() => {
    dispatch({ type: 'SEARCH_ERROR', error: '' })
  }, [])

  return {
    ...state,
    handleSearch,
    selectSubmission,
    updateSettings,
    loadNextPage,
    setPage,
    clearError
  }
}