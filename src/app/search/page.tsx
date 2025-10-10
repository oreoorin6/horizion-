'use client'

import { useState, useEffect } from 'react'
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

export default function SearchPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [searchInput, setSearchInput] = useState('')
  const [selectedPost, setSelectedPost] = useState<E621Post | null>(null)
  
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
  
  // Debug log to ensure we're getting proper state
  useEffect(() => {
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
  
  // Handle search form submission
  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchInput.trim()) {
      // Use window.location for full page navigation to update URL
      // Always reset to page 1 when submitting a new search
      window.location.href = `/search?tags=${encodeURIComponent(searchInput.trim())}&page=1`
    }
  }
  
  // Effect to handle URL-based searches
  useEffect(() => {
    const tags = searchParams?.get('tags')
    const pageParam = searchParams?.get('page')
    const page = pageParam ? parseInt(pageParam, 10) : 1
    
    if (tags) {
      console.log(`[SearchPage] Found tags in URL: ${tags}, page: ${page}`)
      setSearchInput(tags)
      
      // Always make a new API request when URL parameters change
      // This will replace the posts with the new page's posts
      handleSearch(tags, page)
    }
  }, [searchParams, handleSearch])
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Search</h1>
      
      <form onSubmit={submitSearch} className="mb-8">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Enter search tags..."
            className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
          />
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
                totalPages={posts.length > 0 ? Math.max(20, totalPages) : 0} 
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
        post={selectedPost} 
        onClose={() => {
          console.log('[SearchPage] Closing post detail modal');
          setSelectedPost(null);
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