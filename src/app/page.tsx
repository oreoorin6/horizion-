'use client'

import React, { useState, useEffect, useRef } from 'react'
import AppHeader from '@/components/AppHeader'
import AuthWrapper from '@/components/AuthWrapper'
import SettingsModal from '@/components/SettingsModal'
import ErrorBoundary from '@/components/ErrorBoundary'
import DebugConsole from '@/components/DebugConsole'
import NetworkErrorBanner from '@/components/NetworkErrorBanner'
import ApiDebugTool from '@/components/ApiDebugTool'
import { PlaceholderSVG } from '@/components/ui/placeholder-image'
import { useSearch } from '@/context/SearchContext'
import { getImageUrl } from '@/lib/api/e621/utils';
import { useSearchParams } from 'next/navigation'
import PostDetailModal from '@/components/PostDetailModal'
import { E621Post } from '@/lib/api/e621/types'

export default function HomePage() {
  const [showSettings, setShowSettings] = useState(false)
  const [selectedPost, setSelectedPost] = useState<E621Post | null>(null)
  const { posts, loading, error, handleSearch, selectPost } = useSearch()
  const searchParams = useSearchParams()

  // Store search state to preserve results between renders
  const [persistentSearch, setPersistentSearch] = useState<{
    query: string | null;
    hasResults: boolean;
  }>({ query: null, hasResults: false });
  
  // We need to handle the initial search when the component mounts
  // and subsequent searches when the URL changes
  const prevTagsRef = useRef<string | null>(null);
  
  useEffect(() => {
    const tags = searchParams?.get('tags');
    
    // Only perform search if tags exist and are different from previous search
    if (tags && prevTagsRef.current !== tags) {
      console.log(`Page performing search for tags: ${tags}`);
      prevTagsRef.current = tags;
      
      // Redirect to the new search page for better results
      window.location.href = `/search?tags=${encodeURIComponent(tags)}`;
    }
  }, [searchParams])

  // Debug function to log search state
  const logSearchState = () => {
    console.log('[HomePage] Current search state:', {
      loading,
      error,
      postsCount: posts?.length || 0,
      postsValid: Boolean(posts && Array.isArray(posts)),
      persistentSearch,
      searchParams: searchParams ? Object.fromEntries(searchParams.entries()) : {}
    });
    
    // Test direct API access if no posts are found
    if (!posts || posts.length === 0) {
      console.log('[HomePage] Testing direct API access due to missing posts...');
      import('@/lib/api/e621').then(({ e621api }) => {
        if (e621api && typeof e621api.testDirectApiAccess === 'function') {
          e621api.testDirectApiAccess()
            .then(result => console.log('[HomePage] Direct API test result:', result))
            .catch(err => console.error('[HomePage] Direct API test failed:', err));
        } else {
          console.error('[HomePage] Could not access e621api or testDirectApiAccess method');
        }
      });
    }
  };

  // Call debug logging on mount and when search state changes
  useEffect(() => {
    logSearchState();
  }, [posts, loading, error, persistentSearch]);

  const renderContent = () => {
    // Always show loading state when loading
    if (loading) {
      console.log('[HomePage] Rendering loading state');
      return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="group relative aspect-square overflow-hidden rounded-xl bg-muted/30 border border-border/50 shadow-sm">
              <div className="animate-pulse bg-muted/50 h-full w-full"></div>
            </div>
          ))}
        </div>
      )
    }

    // Show error if there's an error
    if (error) {
      console.log('[HomePage] Rendering error state:', error);
      
      // Check if it's a network/CORS related error
      const isNetworkError = error.toLowerCase().includes('network') || 
                             error.toLowerCase().includes('cors') ||
                             error.toLowerCase().includes('connection');
      
      return (
        <div className="text-center py-8">
          {isNetworkError ? (
            <div className="max-w-2xl mx-auto">
              <NetworkErrorBanner 
                error={error} 
                onRetry={() => {
                  console.log('[HomePage] Retrying search after error...');
                  const tags = searchParams?.get('tags');
                  if (tags) {
                    handleSearch(tags);
                  } else {
                    // Try a simple test search if no search params
                    handleSearch("safe");
                  }
                }} 
              />
              
              {/* Add API debug tool to help diagnose issues */}
              <ApiDebugTool />
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-xl mx-auto">
              <h3 className="text-lg font-medium text-red-800 mb-2">Error</h3>
              <p className="text-red-700">{error}</p>
              <div className="mt-4">
                <button 
                  onClick={() => {
                    console.log('[HomePage] Debug button clicked');
                    logSearchState();
                  }}
                  className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-md text-sm"
                >
                  Log Debug Info
                </button>
              </div>
            </div>
          )}
        </div>
      );
    }

    // Show posts if we have them
    if (Array.isArray(posts) && posts.length > 0) {
      console.log(`[HomePage] Rendering ${posts.length} posts from search results`);
      // Log detailed post data for debugging
      if (posts[0]) {
        console.log('[HomePage] First post data structure:', {
          id: posts[0].id,
          file: posts[0].file ? {
            url: posts[0].file.url,
            ext: posts[0].file.ext
          } : 'missing file',
          preview: posts[0].preview ? {
            url: posts[0].preview.url
          } : 'missing preview'
        });
      }
      console.log('[HomePage] Posts array type:', Object.prototype.toString.call(posts));
      
      // Check if we have any valid posts with images
      const postsWithImages = posts.filter(post => 
        post && 
        post.id && 
        ((post.preview && post.preview.url) || 
         (post.file && post.file.url))
      );
      
      if (postsWithImages.length === 0) {
        console.warn('[HomePage] No posts with valid images found');
        return (
          <div className="text-center py-16">
            <p className="text-xl text-muted-foreground mb-4">Posts were found, but they don't contain valid images.</p>
            <button 
              onClick={() => {
                console.log('[HomePage] Debug button clicked');
                logSearchState();
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm"
            >
              Debug Search Results
            </button>
          </div>
        );
      }
      
      return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {posts.map(post => {
            // Ensure we have valid post data before rendering
            if (!post || !post.id) {
              console.warn('[HomePage] Invalid post data found in results:', post);
              return null;
            }
            
            // Get image URL safely
            const imageUrl = getImageUrl(post, 'preview');
            
            if (!imageUrl) {
              console.warn(`[HomePage] No preview URL for post ${post.id}`);
            }
            
            return (
              <div
                key={post.id}
                className="group relative aspect-square overflow-hidden rounded-xl bg-muted/30 border border-border/50 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:scale-[1.02]"
                onClick={() => {
                  console.log(`[HomePage] Post ${post.id} clicked, opening modal`);
                  setSelectedPost(post);
                  selectPost(post); // Also update the API state
                }}
              >
                {/* Refresh button that's always available when hovering */}
                <button 
                  className="absolute top-2 right-2 z-10 bg-green-600/80 backdrop-blur-sm rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-green-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log(`Manually refreshing post ${post.id}`);
                    
                    // Find the img element
                    const imgElement = e.currentTarget.parentElement?.querySelector('img');
                    if (imgElement && imageUrl) {
                      // Import the refresh function
                      import('@/lib/utils').then(({ refreshImage }) => {
                        refreshImage(imgElement, imageUrl, post.id);
                      });
                    }
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                  </svg>
                </button>
                
                <img
                  src={imageUrl || '/placeholder.svg'}
                  alt={`Post ${post.id}`}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                  onError={(e) => {
                    console.warn(`Failed to load image for post ${post.id}`);
                    // Log detailed post structure for debugging
                    console.log(`Post with failed image load:`, JSON.stringify({
                      id: post.id,
                      hasPreview: Boolean(post.preview),
                      previewUrl: post.preview?.url,
                      hasSample: post.sample?.has,
                      sampleUrl: post.sample?.url,
                      fileUrl: post.file?.url
                    }));
                    
                    // Replace with an error container with SVG placeholder and refresh button
                    const img = e.currentTarget;
                    const parent = img.parentElement;
                    if (parent) {
                      // Create error container
                      const errorContainer = document.createElement('div');
                      errorContainer.className = 'h-full w-full bg-gray-800 flex flex-col items-center justify-center error-container';
                      
                      // Add SVG placeholder
                      const svgContainer = document.createElement('div');
                      svgContainer.className = 'mb-2';
                      svgContainer.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 100 100">
                          <rect width="100" height="100" fill="#1f2937" />
                          <path d="M30,40 L70,40 L70,70 L30,70 Z" stroke="#4b5563" strokeWidth="2" fill="none" />
                          <text x="50" y="55" fontSize="12" fill="#9ca3af" textAnchor="middle">Image Error</text>
                        </svg>
                      `;
                      errorContainer.appendChild(svgContainer);
                      
                      // Add refresh button
                      const refreshBtn = document.createElement('button');
                      refreshBtn.className = 'px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded-md flex items-center';
                      refreshBtn.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
                        </svg>
                        Refresh
                      `;
                      
                      // Add click handler to refresh the image
                      refreshBtn.onclick = (event) => {
                        event.stopPropagation(); // Prevent opening the post details modal
                        
                        // Import the refresh function and use it
                        import('@/lib/utils').then(({ refreshImage }) => {
                          if (imageUrl) {
                            refreshImage(img, imageUrl, post.id);
                          }
                        });
                      };
                      
                      errorContainer.appendChild(refreshBtn);
                      
                      // Hide the image and add the error container
                      img.style.display = 'none';
                      parent.appendChild(errorContainer);
                    }
                  }}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />
                <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm rounded-md px-2 py-1 text-xs text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {post.score?.total || 'N/A'}
                </div>
              </div>
            );
          })}
        </div>
      )
    }
    
    // If we have a persistent search but no posts, show no results message
    if (persistentSearch.hasResults && persistentSearch.query) {
      console.log('[HomePage] Rendering no results state with persistent search:', persistentSearch);
      return (
        <div className="text-center py-16">
          <p className="text-xl text-muted-foreground mb-4">No posts found. Try adjusting your search terms or filters.</p>
          
          <details className="max-w-xl mx-auto bg-gray-800 rounded-lg p-4 text-left">
            <summary className="text-sm text-gray-400 cursor-pointer">Debug Information</summary>
            <div className="mt-4 text-xs font-mono text-gray-300 overflow-auto">
              <p>Search Query: {persistentSearch.query}</p>
              <p>Posts Array Length: {posts ? posts.length : 'null'}</p>
              <p>Has Error: {error ? 'Yes' : 'No'}</p>
              <p>Loading State: {loading ? 'Yes' : 'No'}</p>
              <p>URL Parameters: {searchParams ? JSON.stringify(Object.fromEntries(searchParams.entries())) : 'None'}</p>
              <button 
                onClick={() => {
                  console.log('[HomePage] Re-triggering search for:', persistentSearch.query);
                  if (persistentSearch.query) {
                    handleSearch(persistentSearch.query);
                  }
                }}
                className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-xs"
              >
                Retry Search
              </button>
            </div>
          </details>
        </div>
      )
    }

    return (
      <div className="text-center py-16 mb-8">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 mb-6">
            <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent mb-6">
            Welcome to E621 Horizon
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            A modern, feature-rich desktop browser for e621.net with advanced search capabilities and enhanced user experience.
          </p>
        </div>
      </div>
    )
  }

  return (
    <AuthWrapper>
      <div className="min-h-screen bg-background flex flex-col">
        <AppHeader onSettingsClick={() => setShowSettings(true)} />
      
      <main className="flex-1 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <ErrorBoundary>
            {renderContent()}
          </ErrorBoundary>
        </div>
      </main>

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
      />
      
      {/* Debug console */}
      <DebugConsole title="E621 Horizon Debug Console" />
      
      {/* Post Detail Modal */}
      <PostDetailModal 
        post={selectedPost} 
        onClose={() => {
          console.log('[HomePage] Closing post detail modal');
          setSelectedPost(null);
        }}
      />
      </div>
    </AuthWrapper>
  )
}