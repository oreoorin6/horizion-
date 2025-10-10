'use client'

import { createContext, useContext, useEffect, useRef } from 'react'
import { E621SearchState, useE621Search } from '@/hooks/useE621Search'
import { E621Post } from '@/lib/api/e621/types'

// Define the shape of the context
interface E621SearchContextType extends E621SearchState {
  handleSearch: (query: string, page?: number) => Promise<void>
  selectPost: (post: E621Post | null) => void
  updateSettings: (settings: Partial<E621SearchState['settings']>) => void
  loadNextPage: () => void
  setPage: (page: number) => void
  clearError: () => void
}

// Create the context with a default undefined value
export const SearchContext = createContext<E621SearchContextType | undefined>(undefined)

// Custom hook to use the search context
export function useSearch() {
  const context = useContext(SearchContext);
  
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  
  return context;
}
