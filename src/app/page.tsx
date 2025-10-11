'use client'

import React, { useState, useEffect, Suspense } from 'react'
import AppHeader from '@/components/AppHeader'
import AuthWrapper from '@/components/AuthWrapper'
import SettingsModal from '@/components/SettingsModal'
import ErrorBoundary from '@/components/ErrorBoundary'
import HomepageSettings from '@/components/HomepageSettings'
import TagSectionDisplay from '@/components/TagSectionDisplay'
import { useHomeSettings } from '@/hooks/useHomeSettings'
import { useSearchParams } from 'next/navigation'
import PostDetailModal from '@/components/PostDetailModal'
import { E621Post } from '@/lib/api/e621/types'

function HomePageContent() {
  const [showSettings, setShowSettings] = useState(false)
  const [showHomepageSettings, setShowHomepageSettings] = useState(false)
  const [selectedPost, setSelectedPost] = useState<E621Post | null>(null)
  const [currentSectionPosts, setCurrentSectionPosts] = useState<E621Post[]>([])
  const [currentPostIndex, setCurrentPostIndex] = useState<number | undefined>(undefined)
  const [currentSearchTags, setCurrentSearchTags] = useState<string>('')
  const { settings } = useHomeSettings()
  const searchParams = useSearchParams()

  // Handle URL search params by redirecting to search page
  useEffect(() => {
    const tags = searchParams?.get('tags')
    if (tags) {
      console.log(`[HomePage] Redirecting to search page for tags: ${tags}`)
      window.location.href = `/search?tags=${encodeURIComponent(tags)}`
    }
  }, [searchParams])

  const renderContent = () => {
    // Check if user has custom tag sections configured
    const hasCustomSections = settings.tagSections.length > 0
    
    // Show custom homepage if configured
    if (hasCustomSections) {
      return (
        <>
          <HomepageSettings 
            isVisible={showHomepageSettings}
            onToggle={() => setShowHomepageSettings(!showHomepageSettings)}
          />
          
          <div className="space-y-8">
            {settings.tagSections
              .filter(section => section.enabled)
              .map((section) => (
                <TagSectionDisplay
                  key={section.id}
                  section={section}
                  onPostClick={(post, sectionPosts, postIndex, searchTags) => {
                    setSelectedPost(post)
                    setCurrentSectionPosts(sectionPosts)
                    setCurrentPostIndex(postIndex)
                    setCurrentSearchTags(searchTags)
                  }}
                />
              ))}
          </div>
        </>
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
          
          <div className="mb-8">
            <button
              onClick={() => setShowHomepageSettings(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-medium transition-colors"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Customize Your Homepage
            </button>
            <p className="text-sm text-muted-foreground mt-2">
              Add tag sections to create your personalized content feed
            </p>
          </div>
          
          <HomepageSettings 
            isVisible={showHomepageSettings}
            onToggle={() => setShowHomepageSettings(!showHomepageSettings)}
          />
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
      
      {/* Post Detail Modal */}
      <PostDetailModal 
        key={selectedPost?.id || 'no-post'} // Force remount when post changes
        post={selectedPost} 
        onClose={() => {
          console.log('[HomePage] Closing post detail modal');
          setSelectedPost(null);
          setCurrentSectionPosts([]);
          setCurrentPostIndex(undefined);
          setCurrentSearchTags('');
        }}
        onNavigate={(post) => {
          console.log('[HomePage] Navigating to post:', post.id);
          setSelectedPost(post);
          // Update the index when navigating within the same section
          const newIndex = currentSectionPosts.findIndex(p => p.id === post.id);
          if (newIndex >= 0) {
            setCurrentPostIndex(newIndex);
          }
        }}
        posts={currentSectionPosts}
        currentIndex={currentPostIndex}
        currentPage={1} // Homepage sections show first page results  
        totalPages={2} // Indicate more results available
        searchQuery={currentSearchTags}
        onPageChange={async (newPage: number) => {
          console.log(`[HomePage] Modal requesting page change to ${newPage} for tags: ${currentSearchTags}`);
          
          if (!selectedPost || currentPostIndex === undefined) {
            // No post selected, redirect to search
            const searchUrl = `/search?tags=${encodeURIComponent(currentSearchTags)}&expand=true`;
            window.location.href = searchUrl;
            return;
          }
          
          try {
            // Import the API client dynamically
            const { e621api } = await import('@/lib/api/e621');
            
            if (newPage > 1) {
              // Going forward - try to find the next post in the full search results
              console.log(`[HomePage] Finding next post after ${selectedPost.id} for tags: ${currentSearchTags}`);
              
              // Search for more posts with the same tags to find the next one
              const searchResult = await e621api.searchPosts({
                tags: currentSearchTags,
                limit: 50, // Get more posts to find the next one
                page: 1
              });
              
              if (searchResult && searchResult.posts) {
                // Find current post in the full results
                const currentPostIndexInFullResults = searchResult.posts.findIndex(p => p.id === selectedPost.id);
                
                if (currentPostIndexInFullResults >= 0 && currentPostIndexInFullResults < searchResult.posts.length - 1) {
                  // Found next post in the full results
                  const nextPost = searchResult.posts[currentPostIndexInFullResults + 1];
                  console.log(`[HomePage] Found next post in search results: ${nextPost.id}`);
                  setSelectedPost(nextPost);
                  
                  // Update the section posts to include the extended results
                  setCurrentSectionPosts(searchResult.posts);
                  setCurrentPostIndex(currentPostIndexInFullResults + 1);
                  return;
                } else {
                  // Need to search the next page
                  const nextPageResult = await e621api.searchPosts({
                    tags: currentSearchTags,
                    limit: 50,
                    page: 2
                  });
                  
                  if (nextPageResult && nextPageResult.posts && nextPageResult.posts.length > 0) {
                    const nextPost = nextPageResult.posts[0];
                    console.log(`[HomePage] Found next post in page 2: ${nextPost.id}`);
                    setSelectedPost(nextPost);
                    setCurrentSectionPosts([...searchResult.posts, ...nextPageResult.posts]);
                    setCurrentPostIndex(searchResult.posts.length);
                    return;
                  }
                }
              }
            } else {
              // Going backward - similar logic but in reverse
              console.log(`[HomePage] Finding previous post before ${selectedPost.id} for tags: ${currentSearchTags}`);
              
              const searchResult = await e621api.searchPosts({
                tags: currentSearchTags,
                limit: 50,
                page: 1
              });
              
              if (searchResult && searchResult.posts) {
                const currentPostIndexInFullResults = searchResult.posts.findIndex(p => p.id === selectedPost.id);
                
                if (currentPostIndexInFullResults > 0) {
                  const prevPost = searchResult.posts[currentPostIndexInFullResults - 1];
                  console.log(`[HomePage] Found previous post in search results: ${prevPost.id}`);
                  setSelectedPost(prevPost);
                  setCurrentSectionPosts(searchResult.posts);
                  setCurrentPostIndex(currentPostIndexInFullResults - 1);
                  return;
                }
              }
            }
            
            // If we couldn't find the next/previous post, redirect to search as fallback
            console.log(`[HomePage] Could not find next/previous post, redirecting to search`);
            const searchUrl = `/search?tags=${encodeURIComponent(currentSearchTags)}&post=${selectedPost.id}&expand=true`;
            window.location.href = searchUrl;
            
          } catch (error) {
            console.error(`[HomePage] Error finding next/previous post:`, error);
            // Fallback: redirect to search page
            const searchUrl = `/search?tags=${encodeURIComponent(currentSearchTags)}&post=${selectedPost.id}&expand=true`;
            window.location.href = searchUrl;
          }
        }}
      />
      </div>
    </AuthWrapper>
  )
}

export default function HomePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomePageContent />
    </Suspense>
  )
}