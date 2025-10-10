'use client';

import { useEffect, useState } from 'react'
import { X, Star, ExternalLink, RefreshCw } from 'lucide-react'
import { E621Post } from '@/lib/api/e621/types'
import { getImageUrl } from '@/lib/api/e621/utils'
import { createPortal } from 'react-dom'
import { refreshImage } from '@/lib/utils'
import PostDownloadButton from './download/PostDownloadButton'

interface PostDetailModalProps {
  post: E621Post | null
  onClose: () => void
}

// Define type for tag categories
type TagCategory = 'artist' | 'character' | 'species' | 'general' | 'meta' | 'copyright' | 'invalid' | 'lore'

export default function PostDetailModal({ post, onClose }: PostDetailModalProps) {
  const [portalElement, setPortalElement] = useState<HTMLElement | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  
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
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    
    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])
  
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
  
  // Don't render anything if there's no post or portal element
  if (!post || !portalElement) return null
  
  const imageUrl = getImageUrl(post, 'sample') || getImageUrl(post, 'preview')
  const originalUrl = getImageUrl(post, 'full')
  
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
              className="px-2 py-1 bg-gray-800 text-xs rounded-md hover:bg-gray-700 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation()
                window.location.href = `/search?tags=${encodeURIComponent(tag)}`
              }}
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
          {/* Image section */}
          <div className="md:w-2/3 flex-shrink-0 p-4 flex items-center justify-center" style={{ backgroundColor: 'hsla(var(--background), 95%)' }}>
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={`Post ${post.id}`}
                className="max-w-full max-h-[70vh] object-contain"
              />
            ) : (
              <div className="h-96 w-full flex items-center justify-center bg-gray-800">
                <p className="text-gray-400">Image not available</p>
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
                <p className="text-sm whitespace-pre-wrap">{post.description}</p>
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
                    <li key={i} className="truncate">
                      <a href={source} target="_blank" rel="noopener noreferrer" className="hover:underline">
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
    </div>,
    portalElement
  )
}