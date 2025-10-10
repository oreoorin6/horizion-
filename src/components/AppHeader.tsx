'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, Settings, Home, LogOut } from 'lucide-react'
import { useSearch } from '@/context/SearchContext'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useApi } from '@/hooks/useApi'
import { IApiClient } from '@/lib/api/IApiClient'
import TagSuggestions from './TagSuggestions'
import { useDebounce } from '../hooks/useDebounce';
import { useDownloadManager } from '../lib/download-manager';

interface AppHeaderProps {
  onSettingsClick: () => void
}

export default function AppHeader({ onSettingsClick }: AppHeaderProps) {
  const [searchInput, setSearchInput] = useState('')
  const [tagSuggestions, setTagSuggestions] = useState<any[]>([])
  const [isTagLoading, setIsTagLoading] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const { loading } = useSearch()
  const { logout, credentials } = useAuth()
  const router = useRouter()
  const e621api = useApi('e621') as any
  const debouncedSearchInput = useDebounce(searchInput, 300)
  const { state } = useDownloadManager()

  useEffect(() => {
    if (debouncedSearchInput.length > 2 && e621api) {
      const fetchTags = async () => {
        setIsTagLoading(true)
        try {
          console.log('[AppHeader] Searching tags for:', debouncedSearchInput)
          const tags = await e621api.searchTags(debouncedSearchInput)
          console.log('[AppHeader] Tag search results:', tags ? tags.length : 0)
          
          if (Array.isArray(tags)) {
            setTagSuggestions(tags)
          } else {
            console.error('[AppHeader] Invalid tag search result:', tags)
            setTagSuggestions([])
          }
        } catch (error) {
          console.error('[AppHeader] Failed to fetch tags:', error)
          setTagSuggestions([])
        } finally {
          setIsTagLoading(false)
        }
      }
      fetchTags()
    } else {
      setTagSuggestions([])
    }
  }, [debouncedSearchInput, e621api])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchInput.trim()) {
      // Use hard navigation instead of router.push to ensure full page reload
      window.location.href = `/search?tags=${encodeURIComponent(searchInput.trim())}`
    }
  }

  const handleTagSelect = (tag: string) => {
    setSearchInput(tag)
    setTagSuggestions([])
    // Use hard navigation instead of router.push to ensure full page reload
    window.location.href = `/search?tags=${encodeURIComponent(tag)}`
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-lg supports-[backdrop-filter]:bg-background/80 shadow-sm">
      <div className="container flex h-16 items-center px-6">
        <div className="mr-8 flex items-center">
          <a className="flex items-center space-x-3 hover:opacity-80 transition-opacity" href="/">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
              <Home className="h-5 w-5 text-primary" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              E621 Horizon
            </span>
          </a>
        </div>
        
        <div className="flex flex-1 items-center justify-between space-x-6">
          <div className="w-full max-w-lg flex-1">
            <form onSubmit={handleSubmit} className="relative">
              <Search className="absolute left-4 top-3 h-5 w-5 text-muted-foreground" />
              <input
                ref={searchInputRef}
                placeholder="Search tags, artists, characters..."
                className="flex h-11 w-full rounded-xl border border-input bg-background/50 pl-12 pr-4 py-3 text-sm font-medium shadow-sm transition-all duration-200 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 hover:border-primary/50 hover:bg-background/70"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                disabled={loading}
                onKeyDown={(e) => {
                  // Clear suggestions on Enter if no suggestion is selected
                  if (e.key === 'Enter') {
                    setTagSuggestions([]);
                  }
                }}
              />
              {loading && (
                <div className="absolute right-4 top-3 h-5 w-5">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                </div>
              )}
              <TagSuggestions 
                suggestions={tagSuggestions}
                onSelect={handleTagSelect}
                loading={isTagLoading}
                onClickOutside={() => setTagSuggestions([])}
                inputRef={searchInputRef}
              />
            </form>
          </div>
          
          <nav className="flex items-center space-x-3">
            <Link href="/tags" className="hidden sm:inline-flex items-center justify-center whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground border border-input bg-background/50 shadow-sm hover:border-accent">
              Saved Tags
            </Link>

            {credentials && (
              <div className="hidden sm:flex items-center space-x-2 px-3 py-2 rounded-lg bg-muted/50 border border-muted">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span className="text-sm font-medium text-foreground">
                  {credentials.username}
                </span>
              </div>
            )}
            
            <button
              onClick={onSettingsClick}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground border border-input bg-background/50 shadow-sm hover:border-accent h-10 w-10"
            >
              <Settings className="h-5 w-5" />
              <span className="sr-only">Settings</span>
            </button>
            
            <button
              onClick={logout}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive disabled:pointer-events-none disabled:opacity-50 hover:bg-destructive/10 hover:text-destructive border border-input bg-background/50 shadow-sm hover:border-destructive/50 h-10 w-10"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
              <span className="sr-only">Logout</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  )
}