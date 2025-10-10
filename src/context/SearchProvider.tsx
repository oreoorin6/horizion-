'use client'

import { SearchContext } from './SearchContext'
import { useE621Search } from '@/hooks/useE621Search'

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const search = useE621Search()
  return <SearchContext.Provider value={search}>{children}</SearchContext.Provider>
}
