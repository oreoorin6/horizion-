'use client'

import { useState, useEffect } from 'react'
import { useApi } from '@/hooks/useApi'
import { IApiClient } from '@/lib/api/IApiClient'
import { E621Post } from '@/lib/api/e621/types'
import { getImageUrl } from '@/lib/api/e621/utils'
import { TagSection } from '@/hooks/useHomeSettings'
import { useBlacklist } from '@/hooks/useBlacklist'
import { BlacklistedPostCover } from '@/components/BlacklistedPostCover'

interface TagSectionDisplayProps {
  section: TagSection
  onPostClick: (post: E621Post, sectionPosts: E621Post[], postIndex: number, searchTags: string) => void
}

export default function TagSectionDisplay({ section, onPostClick }: TagSectionDisplayProps) {
  const [posts, setPosts] = useState<E621Post[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [revealedPosts, setRevealedPosts] = useState<Set<number>>(new Set())
  const e621api = useApi('e621') as any
  const { settings: blacklistSettings, isPostBlacklisted } = useBlacklist()

  useEffect(() => {
    if (!section.enabled || !e621api) return

    const fetchPosts = async () => {
      setLoading(true)
      setError(null)
      
      try {
        console.log(`[TagSection] Fetching posts for section "${section.title}" with tags:`, section.tags)
        
        // Join tags for search
        const tagString = section.tags.join(' ')
        const result = await e621api.searchPosts({
          tags: tagString,
          limit: 12 // Show fewer posts per section for better layout
        })
        
        if (result && Array.isArray(result.posts)) {
          let filteredPosts = result.posts
          
          // Apply blacklist filtering
          if (blacklistSettings.mode === 'hide') {
            // In hide mode, completely remove blacklisted posts
            filteredPosts = result.posts.filter((post: E621Post) => {
              // Combine all tag categories for blacklist checking
              const allTags = [
                ...(post.tags?.general || []),
                ...(post.tags?.species || []),
                ...(post.tags?.character || []),
                ...(post.tags?.copyright || []),
                ...(post.tags?.artist || []),
                ...(post.tags?.lore || []),
                ...(post.tags?.meta || [])
              ]
              const blacklistResult = isPostBlacklisted(allTags, post.rating)
              if (blacklistResult.blocked) {
                console.log(`[TagSection] Blocking post ${post.id} in "${section.title}" due to blacklist:`, blacklistResult.matchedEntries.map(e => e.name))
              }
              return !blacklistResult.blocked
            })
            console.log(`[TagSection] Filtered ${result.posts.length - filteredPosts.length} blacklisted posts from "${section.title}" (${filteredPosts.length} remaining)`)
          } else {
            console.log(`[TagSection] Blacklist mode is "${blacklistSettings.mode}", showing ${result.posts.length} posts with covers for "${section.title}"`)
          }
          // In cover mode, we keep all posts but will show covers for blacklisted ones
          
          setPosts(filteredPosts)
          console.log(`[TagSection] Loaded ${filteredPosts.length} posts for "${section.title}"`)
        } else {
          console.warn(`[TagSection] Invalid result for "${section.title}":`, result)
          setPosts([])
        }
      } catch (err) {
        console.error(`[TagSection] Error loading posts for "${section.title}":`, err)
        setError(err instanceof Error ? err.message : 'Failed to load posts')
        setPosts([])
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [section, e621api, blacklistSettings, isPostBlacklisted])

  // Handle revealing a blacklisted post
  const handleRevealPost = (postId: number) => {
    setRevealedPosts(prev => new Set([...prev, postId]))
  }

  if (!section.enabled) return null

  return (
    <section className="mb-8">
      <h2 className="text-2xl font-bold text-foreground mb-4 capitalize">
        {section.title}
      </h2>
      
      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-square bg-muted/30 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-destructive">
          <p>Failed to load {section.title}: {error}</p>
        </div>
      )}

      {!loading && !error && posts.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No posts found for "{section.title}"
        </div>
      )}

      {!loading && !error && posts.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {posts.map((post) => {
            const imageUrl = getImageUrl(post, 'preview')
            const blacklistRevealed = revealedPosts.has(post.id)
            
            // Combine all tag categories for blacklist checking
            const allTags = [
              ...(post.tags?.general || []),
              ...(post.tags?.species || []),
              ...(post.tags?.character || []),
              ...(post.tags?.copyright || []),
              ...(post.tags?.artist || []),
              ...(post.tags?.lore || []),
              ...(post.tags?.meta || [])
            ]
            const blacklistResult = isPostBlacklisted(allTags, post.rating)
            
            // In cover mode, show blacklist cover if post is blacklisted and not revealed
            if (blacklistSettings.mode === 'cover' && blacklistResult.blocked && !blacklistRevealed) {
              return (
                <div
                  key={post.id}
                  className="aspect-square overflow-hidden rounded-xl"
                >
                  <BlacklistedPostCover
                    post={post}
                    matchedEntries={blacklistResult.matchedEntries}
                    showBlockedTags={blacklistSettings.showBlockedTags}
                    onReveal={() => handleRevealPost(post.id)}
                    className="aspect-square cursor-pointer"
                  />
                </div>
              )
            }
            
            return (
              <div
                key={post.id}
                className="group relative aspect-square overflow-hidden rounded-xl bg-muted/30 border border-border/50 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:scale-[1.02]"
                onClick={() => {
                  const postIndex = posts.findIndex(p => p.id === post.id);
                  const searchTags = section.tags.join(' ');
                  onPostClick(post, posts, postIndex, searchTags);
                }}
              >
                <img
                  src={imageUrl || '/placeholder.svg'}
                  alt={`Post ${post.id}`}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                  onError={(e) => {
                    console.warn(`Failed to load image for post ${post.id}`)
                    const img = e.currentTarget
                    img.src = '/placeholder.svg'
                  }}
                />
                
                {/* Score indicator */}
                <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm rounded-md px-2 py-1 text-xs text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {post.score?.total || 'N/A'}
                </div>
                
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}