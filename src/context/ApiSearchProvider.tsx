'use client'

import { createContext, useContext } from 'react'
import { SearchState, useApiWithSearch } from '@/hooks/useApiWithSearch'
import { E621Post } from '@/lib/api/e621/types'

// Define the shape of the context
interface ApiSearchContextType extends SearchState {
  handleSearch: (query: string, page?: number) => Promise<void>
  selectPost: (post: E621Post | null) => void
  updateSettings: (settings: Partial<SearchState['settings']>) => void
  loadNextPage: () => void
  setPage: (page: number) => void
  clearError: () => void
}

// Create the context with a default undefined value
export const ApiSearchContext = createContext<ApiSearchContextType | undefined>(undefined)

// Custom hook to use the search context
export function useApiSearch() {
  const context = useContext(ApiSearchContext);
  
  if (context === undefined) {
    throw new Error('useApiSearch must be used within a ApiSearchProvider');
  }
  
  return context;
}

// Provider component
export function ApiSearchProvider({ children }: { children: React.ReactNode }) {
  const search = useApiWithSearch()
  
  console.log('[ApiSearchProvider] Initializing with search hook');
  
  return (
    <ApiSearchContext.Provider value={search}>
      {children}
    </ApiSearchContext.Provider>
  )
}