'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useApiSearch } from '@/context/ApiSearchProvider'
import { useSearchParams, useRouter } from 'next/navigation'
import { getImageUrl } from '@/lib/api/e621/utils'
import PostDetailModal from '@/components/PostDetailModal'
import { E621Post } from '@/lib/api/e621/types'
import Pagination from '@/components/ui/pagination'
import RatingFilter from '@/components/RatingFilter'
import PostCard from '@/components/PostCard'
import { useDownloadManager } from '@/lib/download-manager'
import PostGridWithSelection from '@/components/download/PostGridWithSelection'
import SelectionPanel from '@/components/download/SelectionPanel'
import TagSuggestions from '@/components/TagSuggestions'
import { useDebounce } from '@/hooks/useDebounce'
import { useApi } from '@/hooks/useApi'

export default function SearchPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [searchInput, setSearchInput] = useState('')
  const [selectedPost, setSelectedPost] = useState<E621Post | null>(null)
  const [tagSuggestions, setTagSuggestions] = useState<any[]>([])
  const [isTagLoading, setIsTagLoading] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  
  // Refs to get current values in async callbacks
  const currentStateRef = useRef({ posts: null as E621Post[] | null, loading: false, currentPage: 1 })
  
  // Get API client for tag searching
  const e621api = useApi('e621') as any
  const debouncedSearchInput = useDebounce(searchInput, 300)
  
  const { 
    posts, 
    loading, 
    error, 
    handleSearch, 
    selectPost: apiSelectPost,
    searchQuery,
    currentPage,
    totalPages,
    setPage
  } = useApiSearch()
  
  // Update state ref and debug log
  useEffect(() => {
    currentStateRef.current = { posts, loading, currentPage };
    console.log(`[SearchPage] State update: ${posts?.length} posts, page ${currentPage}/${totalPages}, loading: ${loading}, query: "${searchQuery}"`)
    
    // Log current URL parameters
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      console.log('[SearchPage] Current URL params:', {
        tags: urlParams.get('tags'),
        page: urlParams.get('page')
      });
    }
  }, [posts, loading, currentPage, totalPages, searchQuery])

  // Fetch tag suggestions when user types
  useEffect(() => {
    if (debouncedSearchInput.length > 2 && e621api) {
      const fetchTags = async () => {
        setIsTagLoading(true)
        try {
          console.log('[SearchPage] Searching tags for:', debouncedSearchInput)
          const tags = await e621api.searchTags(debouncedSearchInput)
          console.log('[SearchPage] Tag search results:', tags ? tags.length : 0)
          
          if (Array.isArray(tags)) {
            setTagSuggestions(tags)
          } else {
            console.error('[SearchPage] Invalid tag search result:', tags)
            setTagSuggestions([])
          }
        } catch (error) {
          console.error('[SearchPage] Failed to fetch tags:', error)
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

  
  // Handle search form submission
  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchInput.trim()) {
      // Clear suggestions on submit
      setTagSuggestions([])
      // Use window.location for full page navigation to update URL
      // Always reset to page 1 when submitting a new search
      window.location.href = `/search?tags=${encodeURIComponent(searchInput.trim())}&page=1`
    }
  }
  
  // Handle tag selection from autocomplete
  const handleTagSelect = (tag: string) => {
    setSearchInput(tag)
    setTagSuggestions([])
    // Navigate to search with selected tag
    window.location.href = `/search?tags=${encodeURIComponent(tag)}&page=1`
  }
  
  // Effect to handle URL-based searches and post selection
  useEffect(() => {
    const tags = searchParams?.get('tags')
    const pageParam = searchParams?.get('page')
    const postParam = searchParams?.get('post')
    const expandParam = searchParams?.get('expand')
    const page = pageParam ? parseInt(pageParam, 10) : 1
    
    if (tags) {
      console.log(`[SearchPage] Found tags in URL: ${tags}, page: ${page}, post: ${postParam}, expand: ${expandParam}`)
      setSearchInput(tags)
      
      // Always make a new API request when URL parameters change
      // This will replace the posts with the new page's posts
      handleSearch(tags, page)
    }
  }, [searchParams, handleSearch])

  // Effect to handle post selection after search results are loaded
  useEffect(() => {
    const postParam = searchParams?.get('post')
    const expandParam = searchParams?.get('expand')
    const selectIndexParam = searchParams?.get('selectIndex')
    
    // Only proceed if we have posts loaded and we're not currently loading
    if (posts && posts.length > 0 && !loading) {
      let targetPost = null;
      
      // Priority 1: Select by index (for homepage navigation)
      if (selectIndexParam) {
        const globalIndex = parseInt(selectIndexParam);
        const localIndex = globalIndex % posts.length; // Map global index to current page posts
        targetPost = posts[localIndex];
        console.log(`[SearchPage] Auto-selecting post by index: global=${globalIndex}, local=${localIndex}, post=${targetPost?.id}`);
      }
      // Priority 2: Select by post ID
      else if (postParam) {
        targetPost = posts.find(post => post.id.toString() === postParam);
        console.log(`[SearchPage] Auto-selecting post from URL: ${postParam}, expand mode: ${expandParam}`);
        console.log(`[SearchPage] Searching for post ${postParam} in ${posts.length} posts: ${posts.map(p => p.id).join(', ')}`);
      }
      
      if (targetPost) {
        console.log(`[SearchPage] Target post found:`, {
          id: targetPost.id,
          file_url: targetPost.file?.url,
          preview_url: targetPost.preview?.url
        });
        // Force a complete state refresh by clearing first, then setting
        setSelectedPost(null);
        setTimeout(() => {
          setSelectedPost(targetPost);
        }, 100); // Longer delay to ensure clean state transition
      } else if (postParam || selectIndexParam) {
        console.log(`[SearchPage] Target post not found in current results`);
        
        // If we have expand=true but the specific post wasn't found, 
        // select the first post to keep the modal open
        if (expandParam === 'true' && posts && posts.length > 0) {
          console.log(`[SearchPage] Expand mode active, selecting first post as fallback: ${posts[0].id}`);
          setSelectedPost(null);
          setTimeout(() => {
            setSelectedPost(posts[0]);
          }, 100);
        } else {
          // Clear any existing selected post since the target wasn't found
          setSelectedPost(null);
        }
      }
      
      // Clean up the URL parameters after a longer delay to ensure modal opens
      setTimeout(() => {
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('post');
        newUrl.searchParams.delete('expand');
        newUrl.searchParams.delete('selectIndex');
        window.history.replaceState({}, '', newUrl.toString());
      }, 500); // Increased delay to allow modal to fully initialize
    } else if ((postParam || selectIndexParam) && loading) {
      // If we have selection parameters but we're still loading, clear selected post
      // to prevent showing the old post while loading
      console.log(`[SearchPage] Search loading, clearing selected post temporarily`);
      setSelectedPost(null);
    }
  }, [posts, searchParams, loading])
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Search</h1>
      
      <form onSubmit={submitSearch} className="mb-8">
        <div className="flex gap-2 relative">
          <div className="flex-1 relative">
            <input
              ref={searchInputRef}
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Enter search tags..."
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
              onKeyDown={(e) => {
                // Clear suggestions on Enter if no suggestion is selected
                if (e.key === 'Enter') {
                  setTagSuggestions([]);
                }
              }}
            />
            <TagSuggestions 
              suggestions={tagSuggestions}
              onSelect={handleTagSelect}
              loading={isTagLoading}
              onClickOutside={() => setTagSuggestions([])}
              inputRef={searchInputRef}
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
            disabled={loading}
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
        
        <div className="mt-2 flex flex-wrap items-center justify-between">
          <p className="text-sm text-gray-400">
            Examples: "female canine rating:safe", "wolf -male", "feline order:score"
          </p>
          
          {/* Rating Filter Component */}
          <div className="mt-2 ml-auto">
            <RatingFilter />
          </div>
        </div>
      </form>
      
      {/* Show error if there is one */}
      {error && (
        <div className="bg-red-900/30 border border-red-800/50 rounded-lg p-4 mb-8">
          <h3 className="font-medium text-red-200 mb-1">Error</h3>
          <p className="text-red-300">{error}</p>
          <button 
            onClick={() => handleSearch(searchQuery || 'rating:safe')}
            className="mt-3 px-4 py-1.5 bg-red-800/50 hover:bg-red-800 text-white text-sm rounded"
          >
            Retry Search
          </button>
        </div>
      )}
      
      {/* Show loading state */}
      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="group relative aspect-square overflow-hidden rounded-xl bg-muted/30 border border-border/50 shadow-sm">
              <div className="animate-pulse bg-muted/50 h-full w-full"></div>
            </div>
          ))}
        </div>
      )}
      
      {/* Show results if we have them and aren't loading */}
      {!loading && posts && posts.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-medium">{posts.length} Results</h2>
            <span className="text-sm text-gray-400">
              {searchQuery ? `Search: "${searchQuery}"` : ''}
            </span>
          </div>
          
          <PostGridWithSelection posts={posts}>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {posts.map((post) => (
                <PostCard 
                  key={post.id} 
                  post={post} 
                  onClick={(post) => {
                    console.log(`[SearchPage] Post ${post.id} clicked, opening modal`);
                    setSelectedPost(post);
                    apiSelectPost(post); // Also update the API state
                  }}
                />
              ))}
            </div>
          </PostGridWithSelection>
          
          {/* Pagination */}
          {posts.length > 0 && (
            <>
              <div className="mt-4 mb-2 flex justify-between items-center">
                <div className="text-sm text-gray-400">
                  Page {currentPage} of {totalPages || '?'}
                </div>
                <div className="text-sm text-gray-400">
                  Showing posts {(currentPage-1) * 50 + 1} to {Math.min(currentPage * 50, (currentPage-1) * 50 + posts.length)}
                </div>
              </div>
              
              <Pagination 
                currentPage={currentPage} 
                totalPages={totalPages || 0} 
                onPageChange={(page) => {
                  console.log(`[SearchPage] Navigating to page ${page}`);
                  
                  // Always update the URL to reflect the page change
                  const newUrl = `/search?tags=${encodeURIComponent(searchQuery)}&page=${page}&_ts=${Date.now()}`;
                  
                  // Use window.location to force a full page reload with the new page number
                  // This ensures we get a complete refresh of posts for the new page
                  window.location.href = newUrl;
                }}
              />
            </>
          )}
        </div>
      )}
      
      {/* Post Detail Modal */}
      <PostDetailModal 
        key={selectedPost?.id || 'no-post'} // Force remount when post changes
        post={selectedPost} 
        onClose={() => {
          console.log('[SearchPage] Closing post detail modal');
          setSelectedPost(null);
        }}
        onNavigate={(post) => {
          console.log('[SearchPage] Navigating to post:', post.id);
          setSelectedPost(post);
        }}
        posts={posts || []}
        currentIndex={selectedPost && posts ? posts.findIndex(p => p.id === selectedPost.id) : undefined}
        currentPage={currentPage}
        totalPages={totalPages}
        searchQuery={searchQuery}
        onPageChange={async (newPage: number) => {
          console.log(`[SearchPage] Modal requesting page change from ${currentPage} to ${newPage}`);
          const isNextPage = newPage > currentPage;
          
          // Store navigation intent before page change
          const navigationIntent = { isNext: isNextPage, newPage, oldPage: currentPage };
          console.log(`[SearchPage] Navigation intent:`, navigationIntent);
          
          // Perform the search for the new page
          await handleSearch(searchQuery, newPage);
          
          // Wait for the search to complete and posts to be available
          const waitForPageLoad = (attempts = 0) => {
            if (attempts > 40) { // Max 2 seconds
              console.warn('[SearchPage] Timeout waiting for page change');
              return;
            }
            
            setTimeout(() => {
              const currentState = currentStateRef.current;
              console.log(`[SearchPage] Checking page load completion, attempt ${attempts + 1}`);
              console.log(`[SearchPage] Current state - loading: ${currentState.loading}, currentPage: ${currentState.currentPage}, posts: ${currentState.posts?.length || 0}`);
              
              // Check if we're on the target page with posts loaded
              if (!currentState.loading && currentState.currentPage === newPage && currentState.posts && currentState.posts.length > 0) {
                console.log(`[SearchPage] Page ${newPage} loaded successfully with ${currentState.posts.length} posts`);
                
                if (navigationIntent.isNext) {
                  // Going to next page - select first post
                  console.log('[SearchPage] Auto-selecting first post of next page:', currentState.posts[0].id);
                  setSelectedPost(currentState.posts[0]);
                } else {
                  // Going to previous page - select last post
                  console.log('[SearchPage] Auto-selecting last post of previous page:', currentState.posts[currentState.posts.length - 1].id);
                  setSelectedPost(currentState.posts[currentState.posts.length - 1]);
                }
              } else {
                // Still loading or page not ready, try again
                waitForPageLoad(attempts + 1);
              }
            }, 50);
          };
          
          waitForPageLoad();
        }}
      />
      
      {/* Selection Panel for mass downloads */}
      {posts && posts.length > 0 && <SelectionPanel posts={posts} />}
      
      {/* Show no results message */}
      {!loading && (!posts || posts.length === 0) && searchQuery && (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-gray-800 mb-4">
            <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-medium mb-2">No results found</h2>
          <p className="text-gray-400 mb-8">
            Try adjusting your search terms or using different filters.
          </p>
          
          <div className="max-w-md mx-auto">
            <h3 className="text-sm font-medium text-gray-300 mb-2">Search tips:</h3>
            <ul className="text-sm text-gray-400 space-y-2">
              <li>• Use <code className="bg-gray-800 px-1 rounded">rating:s</code> for safe content</li>
              <li>• Add a minus sign to exclude tags: <code className="bg-gray-800 px-1 rounded">-male</code></li>
              <li>• Try broader terms or fewer restrictions</li>
              <li>• Use <code className="bg-gray-800 px-1 rounded">order:score</code> to sort by popularity</li>
              <li>• Simple examples: <code className="bg-gray-800 px-1 rounded">fox</code>, <code className="bg-gray-800 px-1 rounded">canine</code></li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}