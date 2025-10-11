'use client';

import { useEffect, useState, useRef } from 'react'
import { X, Star, ExternalLink, RefreshCw, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'
import { E621Post, E621Comment } from '@/lib/api/e621/types'
import { getImageUrl } from '@/lib/api/e621/utils'
import { createPortal } from 'react-dom'
import { refreshImage } from '@/lib/utils'
import PostDownloadButton from './download/PostDownloadButton'
import { useApi } from '@/hooks/useApi'
import { IE621ApiClient } from '@/lib/api/IApiClient'
import { useBlacklist } from '@/hooks/useBlacklist'
import { BlacklistedPostCover } from './BlacklistedPostCover'
import TagContextMenu from './TagContextMenu'

interface PostDetailModalProps {
  post: E621Post | null
  onClose: () => void
  onNavigate?: (post: E621Post) => void
  posts?: E621Post[] // Array of current search results
  currentIndex?: number // Index of current post in the search results
  // Page navigation props
  currentPage?: number
  totalPages?: number
  searchQuery?: string
  onPageChange?: (page: number) => void
}

// Define type for tag categories
type TagCategory = 'artist' | 'character' | 'species' | 'general' | 'meta' | 'copyright' | 'invalid' | 'lore'

export default function PostDetailModal({ post, onClose, onNavigate, posts, currentIndex, currentPage, totalPages, searchQuery, onPageChange }: PostDetailModalProps) {
  const [portalElement, setPortalElement] = useState<HTMLElement | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [loadingNext, setLoadingNext] = useState(false)
  const [loadingPrev, setLoadingPrev] = useState(false)
  const [hasNext, setHasNext] = useState<boolean | null>(null)
  const [hasPrev, setHasPrev] = useState<boolean | null>(null)
  const [loadingNextPage, setLoadingNextPage] = useState(false)
  const [loadingPrevPage, setLoadingPrevPage] = useState(false)
  
  // Zoom functionality state
  const [zoomLevel, setZoomLevel] = useState(1)
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 })
  const [isZoomedView, setIsZoomedView] = useState(false)
  
  // Fullscreen zoom overlay state
  const [isFullscreenZoom, setIsFullscreenZoom] = useState(false)
  const [fullscreenZoom, setFullscreenZoom] = useState(1)
  const [fullscreenPan, setFullscreenPan] = useState({ x: 0, y: 0 })
  const [fullscreenPanning, setFullscreenPanning] = useState(false)
  const [fullscreenLastPan, setFullscreenLastPan] = useState({ x: 0, y: 0 })
  
  // Blacklist functionality
  const { settings: blacklistSettings, isPostBlacklisted } = useBlacklist()
  const [revealBlacklisted, setRevealBlacklisted] = useState(false)
  
  const imageContainerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const fullscreenRef = useRef<HTMLDivElement>(null)
  const e621api = useApi<IE621ApiClient>('e621')
  
  // Comment state
  const [comments, setComments] = useState<E621Comment[]>([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [commentsError, setCommentsError] = useState<string | null>(null)
  
  // Tag context menu state
  const [tagContextMenu, setTagContextMenu] = useState<{
    tag: string
    position: { x: number; y: number }
  } | null>(null)
  
  // Setup portal element - this hook runs consistently regardless of post value
  useEffect(() => {
    let element = document.getElementById('modal-root')
    if (!element) {
      element = document.createElement('div')
      element.id = 'modal-root'
      document.body.appendChild(element)
    }
    setPortalElement(element)
    
    // Add escape key event listener
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isFullscreenZoom) onClose()
    }
    document.addEventListener('keydown', handleEscape)
    
    return () => {
      document.removeEventListener('keydown', handleEscape)
      // Ensure body scroll is restored on unmount
      document.body.style.overflow = ''
    }
  }, [onClose, isFullscreenZoom])
  
  // Apply the secondary color from theme when post is displayed
  useEffect(() => {
    if (portalElement && post) {
      // Log that we're using the secondary color for this post
      console.log('Modal opened for post:', post.id, 'using secondary color');
      
      // This ensures we're using the latest theme color values
      const modalElements = document.querySelectorAll('.post-detail-modal-element');
      modalElements.forEach(el => {
        if (el instanceof HTMLElement) {
          // Force a style recalculation to ensure the latest secondary color is used
          el.style.backgroundColor = '';
          el.style.backgroundColor = 'hsl(var(--secondary))';
        }
      });
    }
  }, [portalElement, post])

  // Reset blacklist reveal state when post changes  
  useEffect(() => {
    setRevealBlacklisted(false)
  }, [post?.id])

  // Check for adjacent posts when modal opens
  useEffect(() => {
    if (!post) return;

    if (posts && typeof currentIndex === 'number') {
      // Use search results for navigation with page boundaries
      const canGoNext = currentIndex < posts.length - 1 || 
                       (Boolean(currentPage && totalPages && currentPage < totalPages));
      const canGoPrev = currentIndex > 0 || 
                       (Boolean(currentPage && currentPage > 1));
      
      setHasNext(canGoNext);
      setHasPrev(canGoPrev);
    } else if (e621api) {
      // Fallback to API-based navigation if no search context
      const checkAdjacentPosts = async () => {
        try {
          const [nextPost, prevPost] = await Promise.all([
            e621api.getAdjacentPost(post.id, 'next'),
            e621api.getAdjacentPost(post.id, 'prev')
          ]);
          
          setHasNext(nextPost !== null);
          setHasPrev(prevPost !== null);
        } catch (error) {
          console.error('Error checking adjacent posts:', error);
          setHasNext(false);
          setHasPrev(false);
        }
      };

      checkAdjacentPosts();
    } else {
      setHasNext(false);
      setHasPrev(false);
    }
  }, [post, posts, currentIndex, currentPage, totalPages, e621api])

  // Load comments when post changes
  useEffect(() => {
    if (!post || !e621api) {
      setComments([]);
      return;
    }

    const loadComments = async () => {
      if (post.comment_count === 0) {
        setComments([]);
        return;
      }

      setLoadingComments(true);
      setCommentsError(null);

      try {
        console.log(`[PostModal] Loading comments for post ${post.id}`);
        const commentResults = await (e621api as any).getComments({ 
          post_id: post.id,
          limit: 50,
          order: 'id' 
        });
        
        console.log(`[PostModal] Raw comment results for post ${post.id}:`, commentResults);
        console.log(`[PostModal] Comment results type:`, typeof commentResults);
        console.log(`[PostModal] Comment results keys:`, commentResults ? Object.keys(commentResults) : 'null');
        
        // API client now always returns an array (empty array for no comments)
        if (Array.isArray(commentResults)) {
          setComments(commentResults);
          console.log(`[PostModal] Successfully loaded ${commentResults.length} comments for post ${post.id}`);
        } else {
          console.warn(`[PostModal] Unexpected comment results format for post ${post.id}:`, typeof commentResults, commentResults);
          setComments([]);
        }
      } catch (error) {
        console.error(`[PostModal] Failed to load comments for post ${post.id}:`, error);
        if (error instanceof Error) {
          console.error(`[PostModal] Error details:`, error.message, error.stack);
        }
        setCommentsError('Failed to load comments');
        setComments([]);
      } finally {
        setLoadingComments(false);
      }
    };

    loadComments();
  }, [post, e621api]);

  // Navigation functions
  const navigateToNext = async () => {
    if (!post || !onNavigate || loadingNext || loadingNextPage) return;
    
    console.log(`[Modal] Navigate next - currentIndex: ${currentIndex}, posts length: ${posts?.length}, currentPage: ${currentPage}/${totalPages}`);
    
    if (posts && typeof currentIndex === 'number') {
      if (currentIndex < posts.length - 1) {
        // Navigate to next post in current page
        const nextPost = posts[currentIndex + 1];
        console.log(`[Modal] Navigating to next post in current page: ${nextPost.id}`);
        if (nextPost) {
          onNavigate(nextPost);
        }
      } else if (onPageChange && currentPage && totalPages && currentPage < totalPages) {
        // At end of current page, load next page
        console.log(`[Modal] At end of page ${currentPage} (index ${currentIndex}), loading page ${currentPage + 1}`);
        setLoadingNextPage(true);
        try {
          await onPageChange(currentPage + 1);
          // The new page will load, and we'll navigate to the first post of the new page
          // This will be handled by the parent component
        } catch (error) {
          console.error('Error loading next page:', error);
        } finally {
          setLoadingNextPage(false);
        }
      } else {
        console.log(`[Modal] Cannot navigate next - at boundary without page change capability`);
      }
    } else if (e621api) {
      // Fallback to API-based navigation
      console.log(`[Modal] Using API navigation for next post`);
      setLoadingNext(true);
      try {
        const nextPost = await e621api.getAdjacentPost(post.id, 'next');
        if (nextPost) {
          onNavigate(nextPost);
        }
      } catch (error) {
        console.error('Error navigating to next post:', error);
      } finally {
        setLoadingNext(false);
      }
    }
  };

  const navigateToPrev = async () => {
    if (!post || !onNavigate || loadingPrev || loadingPrevPage) return;
    
    console.log(`[Modal] Navigate previous - currentIndex: ${currentIndex}, posts length: ${posts?.length}, currentPage: ${currentPage}`);
    
    if (posts && typeof currentIndex === 'number') {
      if (currentIndex > 0) {
        // Navigate to previous post in current page
        const prevPost = posts[currentIndex - 1];
        console.log(`[Modal] Navigating to previous post in current page: ${prevPost.id}`);
        if (prevPost) {
          onNavigate(prevPost);
        }
      } else if (onPageChange && currentPage && currentPage > 1) {
        // At beginning of current page, load previous page
        console.log(`[Modal] At beginning of page ${currentPage} (index ${currentIndex}), loading page ${currentPage - 1}`);
        setLoadingPrevPage(true);
        try {
          await onPageChange(currentPage - 1);
          // The new page will load, and we'll navigate to the last post of the previous page
          // This will be handled by the parent component
        } catch (error) {
          console.error('Error loading previous page:', error);
        } finally {
          setLoadingPrevPage(false);
        }
      } else {
        console.log(`[Modal] Cannot navigate previous - at boundary without page change capability`);
      }
    } else if (e621api) {
      // Fallback to API-based navigation
      console.log(`[Modal] Using API navigation for previous post`);
      setLoadingPrev(true);
      try {
        const prevPost = await e621api.getAdjacentPost(post.id, 'prev');
        if (prevPost) {
          onNavigate(prevPost);
        }
      } catch (error) {
        console.error('Error navigating to previous post:', error);
      } finally {
        setLoadingPrev(false);
      }
    }
  };

  // Reset zoom when post changes
  useEffect(() => {
    if (post) {
      setZoomLevel(1);
      setPanPosition({ x: 0, y: 0 });
      setIsZoomedView(false);
      setIsFullscreenZoom(false);
      setFullscreenZoom(1);
      setFullscreenPan({ x: 0, y: 0 });
    }
  }, [post?.id]);

  // Zoom functions
  const zoomIn = () => {
    setZoomLevel(prev => Math.min(prev * 1.5, 10));
    setIsZoomedView(true);
  };

  const zoomOut = () => {
    const newZoom = Math.max(zoomLevel / 1.5, 0.1);
    setZoomLevel(newZoom);
    if (newZoom <= 1) {
      setIsZoomedView(false);
      setPanPosition({ x: 0, y: 0 });
    }
  };

  const resetZoom = () => {
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
    setIsZoomedView(false);
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.min(Math.max(zoomLevel * delta, 0.1), 10);
      setZoomLevel(newZoom);
      
      if (newZoom > 1) {
        setIsZoomedView(true);
      } else {
        setIsZoomedView(false);
        setPanPosition({ x: 0, y: 0 });
      }
    }
  };

  // Mouse panning
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel > 1) {
      setIsPanning(true);
      setLastPanPoint({ x: e.clientX, y: e.clientY });
      e.preventDefault();
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning && zoomLevel > 1) {
      const deltaX = e.clientX - lastPanPoint.x;
      const deltaY = e.clientY - lastPanPoint.y;
      
      setPanPosition(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
      
      setLastPanPoint({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Fullscreen zoom functions
  const openFullscreenZoom = () => {
    setIsFullscreenZoom(true);
    setFullscreenZoom(1);
    setFullscreenPan({ x: 0, y: 0 });
    // Prevent body scroll when fullscreen is open
    document.body.style.overflow = 'hidden';
  };

  const closeFullscreenZoom = () => {
    setIsFullscreenZoom(false);
    setFullscreenZoom(1);
    setFullscreenPan({ x: 0, y: 0 });
    // Restore body scroll
    document.body.style.overflow = '';
  };

  const fullscreenZoomIn = () => {
    setFullscreenZoom(prev => Math.min(prev * 1.5, 20)); // Higher max zoom for fullscreen
  };

  const fullscreenZoomOut = () => {
    setFullscreenZoom(prev => Math.max(prev / 1.5, 0.1));
  };

  const resetFullscreenZoom = () => {
    setFullscreenZoom(1);
    setFullscreenPan({ x: 0, y: 0 });
  };

  // Fullscreen mouse wheel zoom
  const handleFullscreenWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.min(Math.max(fullscreenZoom * delta, 0.1), 20);
    setFullscreenZoom(newZoom);
  };

  // Fullscreen mouse panning
  const handleFullscreenMouseDown = (e: React.MouseEvent) => {
    if (fullscreenZoom > 1) {
      setFullscreenPanning(true);
      setFullscreenLastPan({ x: e.clientX, y: e.clientY });
      e.preventDefault();
    }
  };

  const handleFullscreenMouseMove = (e: React.MouseEvent) => {
    if (fullscreenPanning && fullscreenZoom > 1) {
      const deltaX = e.clientX - fullscreenLastPan.x;
      const deltaY = e.clientY - fullscreenLastPan.y;
      
      setFullscreenPan(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
      
      setFullscreenLastPan({ x: e.clientX, y: e.clientY });
    }
  };

  const handleFullscreenMouseUp = () => {
    setFullscreenPanning(false);
  };

  // Add keyboard navigation and zoom controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isFullscreenZoom) {
        // Fullscreen zoom controls
        if (e.key === 'Escape') {
          e.preventDefault();
          closeFullscreenZoom();
        } else if (e.key === '+' || e.key === '=') {
          e.preventDefault();
          fullscreenZoomIn();
        } else if (e.key === '-') {
          e.preventDefault();
          fullscreenZoomOut();
        } else if (e.key === '0') {
          e.preventDefault();
          resetFullscreenZoom();
        }
      } else {
        // Regular modal controls
        if (e.key === 'ArrowLeft' && hasPrev && onNavigate && !isZoomedView) {
          e.preventDefault();
          navigateToPrev();
        } else if (e.key === 'ArrowRight' && hasNext && onNavigate && !isZoomedView) {
          e.preventDefault();
          navigateToNext();
        } else if (e.key === '+' || e.key === '=') {
          e.preventDefault();
          zoomIn();
        } else if (e.key === '-') {
          e.preventDefault();
          zoomOut();
        } else if (e.key === '0') {
          e.preventDefault();
          resetZoom();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseup', handleFullscreenMouseUp);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseup', handleFullscreenMouseUp);
    };
  }, [hasPrev, hasNext, onNavigate, isZoomedView, zoomLevel, isFullscreenZoom, fullscreenZoom])
  
  // Don't render anything if there's no post or portal element
  if (!post || !portalElement) return null
  
  const imageUrl = getImageUrl(post, 'sample') || getImageUrl(post, 'preview')
  const originalUrl = getImageUrl(post, 'full')
  
  // Check if post is blacklisted
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
  const isBlacklisted = blacklistResult.blocked && blacklistSettings.mode === 'cover'
  
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
    } catch (e) {
      return dateString
    }
  }
  
  const renderTagSection = (tagType: TagCategory) => {
    if (!post.tags || !post.tags[tagType] || !post.tags[tagType].length) return null
    
    return (
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-400 mb-2">{tagType.charAt(0).toUpperCase() + tagType.slice(1)}</h3>
        <div className="flex flex-wrap gap-2">
          {post.tags[tagType].map((tag) => (
            <span 
              key={tag} 
              className="px-2 py-1 bg-gray-800 text-xs rounded-md hover:bg-gray-700 cursor-pointer transition-colors"
              onClick={(e) => {
                e.stopPropagation()
                const rect = e.currentTarget.getBoundingClientRect()
                setTagContextMenu({
                  tag,
                  position: {
                    x: rect.left,
                    y: rect.bottom + 5
                  }
                })
              }}
              title="Click to see tag actions"
            >
              {tag.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
      </div>
    )
  }
  
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div 
        className="absolute inset-0 -z-10"
        onClick={onClose}
      />
      
      <div className="post-detail-modal-content post-detail-modal-element rounded-xl shadow-lg w-full max-w-6xl max-h-[90vh] flex flex-col" style={{ backgroundColor: 'hsl(var(--secondary))' }}>
        <div className="flex items-center justify-between p-4 border-b border-gray-800 post-detail-modal-element" style={{ backgroundColor: 'hsla(var(--secondary), 90%)' }}>
          <h2 className="text-lg font-semibold">Post #{post.id}</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-black/20 rounded-full transition-colors"
          >
            <X size={20} />
            <span className="sr-only">Close</span>
          </button>
        </div>
        
        <div className="flex-1 overflow-auto flex flex-col md:flex-row">
          {/* Image section with navigation and zoom */}
          <div className="md:w-2/3 flex-shrink-0 relative flex items-center justify-center" style={{ backgroundColor: 'hsla(var(--background), 95%)' }}>
            {/* Previous post button - hidden when zoomed */}
            {onNavigate && !isZoomedView && (
              <button
                onClick={navigateToPrev}
                disabled={!hasPrev || loadingPrev || loadingPrevPage}
                className={`absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full transition-all duration-200 ${
                  hasPrev && !loadingPrev && !loadingPrevPage
                    ? 'bg-black/50 hover:bg-black/70 text-white'
                    : 'bg-gray-800/30 text-gray-500 cursor-not-allowed'
                }`}
                title={posts && posts.length > 0 ? 
                  (loadingPrevPage ? "Loading previous page..." : "Previous in search results (←)") : 
                  "Previous post (←)"}
              >
                {loadingPrev || loadingPrevPage ? (
                  <RefreshCw size={24} className="animate-spin" />
                ) : (
                  <ChevronLeft size={24} />
                )}
              </button>
            )}

            {/* Zoom controls - top right of image area - only show if not blacklisted or revealed */}
            {(!isBlacklisted || revealBlacklisted) && (
            <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
              <button
                onClick={zoomIn}
                className="p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-all duration-200"
                title="Zoom in (+)"
              >
                <ZoomIn size={20} />
              </button>
              <button
                onClick={zoomOut}
                className="p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-all duration-200"
                title="Zoom out (-)"
              >
                <ZoomOut size={20} />
              </button>
              <button
                onClick={resetZoom}
                className="p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-all duration-200"
                title="Reset zoom (0)"
              >
                <RotateCcw size={20} />
              </button>
            </div>
            )}

            {/* Image container with zoom and pan */}
            <div 
              ref={imageContainerRef}
              className="p-4 flex items-center justify-center w-full h-full overflow-hidden"
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              style={{ cursor: zoomLevel > 1 ? (isPanning ? 'grabbing' : 'grab') : 'pointer' }}
            >
              {isBlacklisted && !revealBlacklisted ? (
                <BlacklistedPostCover
                  post={post}
                  matchedEntries={blacklistResult.matchedEntries}
                  showBlockedTags={blacklistSettings.showBlockedTags}
                  onReveal={() => setRevealBlacklisted(true)}
                  className="h-96 w-full max-w-2xl"
                />
              ) : imageUrl ? (
                <img
                  ref={imageRef}
                  src={imageUrl}
                  alt={`Post ${post.id}`}
                  className="select-none transition-transform duration-200"
                  style={{
                    transform: `scale(${zoomLevel}) translate(${panPosition.x / zoomLevel}px, ${panPosition.y / zoomLevel}px)`,
                    maxWidth: zoomLevel === 1 ? '100%' : 'none',
                    maxHeight: zoomLevel === 1 ? '70vh' : 'none',
                    objectFit: 'contain'
                  }}
                  draggable={false}
                  onClick={(e) => {
                    if (zoomLevel === 1 && !isPanning) {
                      e.stopPropagation();
                      openFullscreenZoom();
                    }
                  }}
                  title={zoomLevel === 1 ? "Click to open fullscreen zoom" : ""}
                />
              ) : (
                <div className="h-96 w-full flex items-center justify-center bg-gray-800">
                  <p className="text-gray-400">Image not available</p>
                </div>
              )}
            </div>

            {/* Next post button - hidden when zoomed */}
            {onNavigate && !isZoomedView && (
              <button
                onClick={navigateToNext}
                disabled={!hasNext || loadingNext || loadingNextPage}
                className={`absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full transition-all duration-200 ${
                  hasNext && !loadingNext && !loadingNextPage
                    ? 'bg-black/50 hover:bg-black/70 text-white'
                    : 'bg-gray-800/30 text-gray-500 cursor-not-allowed'
                }`}
                title={posts && posts.length > 0 ? 
                  (loadingNextPage ? "Loading next page..." : "Next in search results (→)") : 
                  "Next post (→)"}
              >
                {loadingNext || loadingNextPage ? (
                  <RefreshCw size={24} className="animate-spin" />
                ) : (
                  <ChevronRight size={24} />
                )}
              </button>
            )}

            {/* Zoom level indicator and navigation info */}
            {zoomLevel !== 1 && (
              <div className="absolute bottom-4 left-4 z-20 px-3 py-1 rounded-full bg-black/70 text-white text-sm">
                {Math.round(zoomLevel * 100)}%
              </div>
            )}
            
            {/* Navigation type indicator */}
            {posts && posts.length > 0 && typeof currentIndex === 'number' && (
              <div className="absolute bottom-4 right-4 z-20 px-3 py-1 rounded-full bg-black/50 text-white text-xs">
                {currentIndex + 1} of {posts.length}
                {currentPage && totalPages && (
                  <div className="text-xs opacity-75">
                    Page {currentPage} of {totalPages}
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Info section */}
          <div className="md:w-1/3 flex-shrink-0 p-4 overflow-y-auto post-detail-modal-element" style={{ backgroundColor: 'hsla(var(--secondary), 70%)' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className={`h-3 w-3 rounded-full ${
                  post.rating === 's' ? 'bg-green-500' : 
                  post.rating === 'q' ? 'bg-yellow-500' : 
                  'bg-red-500'
                }`} />
                <span className="text-sm">
                  {post.rating === 's' ? 'Safe' : 
                   post.rating === 'q' ? 'Questionable' : 
                   'Explicit'}
                </span>
              </div>
              
              <div className="flex items-center space-x-4">
                <button 
                  className={`text-gray-400 hover:text-white transition-all duration-200 ${refreshing ? 'animate-spin' : ''}`}
                  onClick={() => {
                    if (refreshing || !imageUrl) return;
                    setRefreshing(true);
                    refreshImage(imageUrl).finally(() => {
                      setTimeout(() => setRefreshing(false), 500);
                    });
                  }}
                  title="Refresh image"
                >
                  <RefreshCw size={18} />
                </button>
                <PostDownloadButton post={post} compact={true} />
                <button className="text-gray-400 hover:text-yellow-400" title="Add to favorites">
                  <Star size={18} />
                </button>
                <a 
                  href={`https://e621.net/posts/${post.id}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-blue-400"
                  title="View on e621"
                >
                  <ExternalLink size={18} />
                </a>
              </div>
            </div>
            
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>Score: {post.score?.total || 0}</span>
                <span>{post.fav_count} favorites</span>
              </div>
              <div className="text-sm text-gray-400">
                <p>Uploaded: {post.created_at ? formatDate(post.created_at) : 'Unknown'}</p>
              </div>
            </div>
            
            {post.description && (
              <div className="mb-4 p-3 bg-gray-800/50 rounded-lg">
                <p className="text-sm whitespace-pre-wrap break-words overflow-wrap-anywhere">{post.description}</p>
              </div>
            )}

            {/* Comments Section */}
            {post.comment_count > 0 && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-400">
                    Comments ({post.comment_count})
                  </h3>
                  {loadingComments && (
                    <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />
                  )}
                </div>
                
                {commentsError && (
                  <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg mb-3">
                    <p className="text-sm text-red-400">{commentsError}</p>
                  </div>
                )}
                
                {!loadingComments && comments.length === 0 && !commentsError && (
                  <div className="p-3 bg-gray-800/30 rounded-lg">
                    <p className="text-sm text-gray-500">No comments found</p>
                  </div>
                )}
                
                {comments.length > 0 && (
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {comments.map((comment) => (
                      <div 
                        key={comment.id} 
                        className={`p-3 rounded-lg border-l-2 ${
                          comment.is_sticky 
                            ? 'bg-yellow-900/20 border-yellow-500/50' 
                            : comment.score >= 5
                            ? 'bg-green-900/20 border-green-500/50'
                            : comment.score <= -5
                            ? 'bg-red-900/20 border-red-500/50'
                            : 'bg-gray-800/30 border-gray-600/50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-blue-400">
                              {comment.creator_name}
                            </span>
                            {comment.is_sticky && (
                              <span className="text-xs bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded">
                                Sticky
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <span className={`${
                              comment.score > 0 ? 'text-green-400' :
                              comment.score < 0 ? 'text-red-400' : 'text-gray-400'
                            }`}>
                              {comment.score > 0 ? '+' : ''}{comment.score}
                            </span>
                            <span>
                              {new Date(comment.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="text-sm text-gray-300 whitespace-pre-wrap break-words overflow-wrap-anywhere">
                          {comment.body}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            <div className="border-t border-gray-800 my-4 pt-4">
              <h3 className="text-sm font-medium mb-3">Tags</h3>
              {renderTagSection('artist')}
              {renderTagSection('character')}
              {renderTagSection('species')}
              {renderTagSection('general')}
              {renderTagSection('meta')}
            </div>
            
            {post.sources && post.sources.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-400 mb-2">Sources</h3>
                <ul className="text-xs text-blue-400 space-y-1">
                  {post.sources.map((source, i) => (
                    <li key={i} className="break-all">
                      <a 
                        href={source} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="hover:underline block"
                        title={source}
                      >
                        {source}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tag Context Menu */}
      {tagContextMenu && (
        <TagContextMenu
          tag={tagContextMenu.tag}
          position={tagContextMenu.position}
          onClose={() => setTagContextMenu(null)}
          onAction={(action) => {
            console.log(`[PostDetailModal] Tag action: ${action} for tag: ${tagContextMenu.tag}`)
          }}
        />
      )}

      {/* Fullscreen Zoom Overlay */}
      {isFullscreenZoom && imageUrl && (!isBlacklisted || revealBlacklisted) && createPortal(
        <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
          {/* Close button */}
          <button
            onClick={closeFullscreenZoom}
            className="absolute top-4 right-4 z-[101] p-3 rounded-full bg-black/50 hover:bg-black/70 text-white transition-all duration-200"
            title="Close fullscreen (Esc)"
          >
            <X size={24} />
          </button>

          {/* Fullscreen zoom controls */}
          <div className="absolute top-4 left-4 z-[101] flex gap-2">
            <button
              onClick={fullscreenZoomIn}
              className="p-3 rounded-full bg-black/50 hover:bg-black/70 text-white transition-all duration-200"
              title="Zoom in (+)"
            >
              <ZoomIn size={24} />
            </button>
            <button
              onClick={fullscreenZoomOut}
              className="p-3 rounded-full bg-black/50 hover:bg-black/70 text-white transition-all duration-200"
              title="Zoom out (-)"
            >
              <ZoomOut size={24} />
            </button>
            <button
              onClick={resetFullscreenZoom}
              className="p-3 rounded-full bg-black/50 hover:bg-black/70 text-white transition-all duration-200"
              title="Reset zoom (0)"
            >
              <RotateCcw size={24} />
            </button>
          </div>

          {/* Fullscreen zoom level indicator */}
          <div className="absolute bottom-4 left-4 z-[101] px-4 py-2 rounded-full bg-black/70 text-white text-lg font-medium">
            {Math.round(fullscreenZoom * 100)}%
          </div>

          {/* Instructions */}
          <div className="absolute bottom-4 right-4 z-[101] px-4 py-2 rounded-lg bg-black/70 text-white text-sm">
            <div>Mouse wheel or +/- to zoom</div>
            <div>Click and drag to pan</div>
            <div>Press Esc to close</div>
          </div>

          {/* Fullscreen image container */}
          <div 
            ref={fullscreenRef}
            className="w-full h-full flex items-center justify-center overflow-hidden"
            onWheel={handleFullscreenWheel}
            onMouseDown={handleFullscreenMouseDown}
            onMouseMove={handleFullscreenMouseMove}
            style={{ 
              cursor: fullscreenZoom > 1 ? (fullscreenPanning ? 'grabbing' : 'grab') : 'default' 
            }}
          >
            <img
              src={imageUrl}
              alt={`Post ${post.id} - Fullscreen`}
              className="select-none transition-transform duration-200"
              style={{
                transform: `scale(${fullscreenZoom}) translate(${fullscreenPan.x / fullscreenZoom}px, ${fullscreenPan.y / fullscreenZoom}px)`,
                maxWidth: fullscreenZoom === 1 ? '100%' : 'none',
                maxHeight: fullscreenZoom === 1 ? '100%' : 'none',
                objectFit: 'contain'
              }}
              draggable={false}
            />
          </div>
        </div>,
        document.body
      )}
    </div>,
    portalElement
  )
}
