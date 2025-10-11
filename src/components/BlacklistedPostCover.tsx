'use client'

import { useState } from 'react'
import { EyeOff, Eye, AlertTriangle } from 'lucide-react'
import type { BlacklistEntry } from '@/hooks/useBlacklist'
import type { E621Post } from '@/lib/api/e621/types'

interface BlacklistedPostCoverProps {
  post: E621Post
  matchedEntries: BlacklistEntry[]
  showBlockedTags: boolean
  onReveal?: () => void
  className?: string
}

export function BlacklistedPostCover({ 
  post, 
  matchedEntries, 
  showBlockedTags, 
  onReveal,
  className = ''
}: BlacklistedPostCoverProps) {
  const [isRevealed, setIsRevealed] = useState(false)

  const handleReveal = () => {
    setIsRevealed(true)
    onReveal?.()
  }

  if (isRevealed) {
    return null // Let the original post show
  }

  const blockedTagsList = matchedEntries
    .flatMap(entry => entry.tags)
    .filter((tag, index, arr) => arr.indexOf(tag) === index) // Remove duplicates
    .slice(0, 5) // Limit to first 5 tags

  return (
    <div className={`relative bg-black border border-red-500/30 rounded-lg overflow-hidden ${className}`}>
      {/* Black cover with gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black"></div>
      
      {/* Warning pattern overlay */}
      <div className="absolute inset-0 opacity-5">
        <div 
          className="w-full h-full"
          style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 10px,
              rgba(255, 0, 0, 0.1) 10px,
              rgba(255, 0, 0, 0.1) 20px
            )`
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full min-h-[200px] flex flex-col items-center justify-center p-2 text-center">
        {/* Main blocked icon */}
        <div className="mb-1.5 relative flex-shrink-0">
          <EyeOff 
            size={28} 
            className="text-red-400 drop-shadow-lg" 
            strokeWidth={1.5}
          />
          <div className="absolute -top-0.5 -right-0.5 bg-red-500 rounded-full p-0.5">
            <AlertTriangle size={10} className="text-white" strokeWidth={2} />
          </div>
        </div>

        {/* Blocked message */}
        <h3 className="text-white font-semibold text-xs sm:text-sm mb-1 flex-shrink-0">
          Content Blocked
        </h3>
        
        <p className="text-gray-300 text-xs mb-1.5 max-w-full px-1 flex-shrink-0">
          Hidden by blacklist
        </p>

        {/* Show blocked tags if enabled */}
        {showBlockedTags && blockedTagsList.length > 0 && (
          <div className="mb-1.5 space-y-0.5 flex-shrink-0 max-w-full">
            <p className="text-gray-400 text-xs">Blocked:</p>
            <div className="flex flex-wrap gap-0.5 justify-center max-w-full">
              {blockedTagsList.slice(0, 2).map((tag, index) => (
                <span 
                  key={index}
                  className="bg-red-500/20 text-red-300 px-1 py-0.5 rounded text-xs border border-red-500/30 truncate max-w-16"
                  title={tag.startsWith('-') ? `not ${tag.substring(1)}` : tag}
                >
                  {tag.startsWith('-') ? `!${tag.substring(1)}` : tag}
                </span>
              ))}
              {blockedTagsList.length > 2 && (
                <span className="text-gray-400 text-xs">
                  +{blockedTagsList.length - 2}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Reveal button */}
        <button
          onClick={handleReveal}
          className="flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white px-2.5 py-1 rounded text-xs transition-colors backdrop-blur-sm border border-white/20 flex-shrink-0 mt-auto"
        >
          <Eye size={12} />
          <span>Show</span>
        </button>

        {/* Post info */}
        <div className="mt-0.5 text-xs text-gray-500 flex-shrink-0">
          #{post.id}
        </div>
      </div>

      {/* Subtle border glow */}
      <div className="absolute inset-0 rounded-lg border border-red-500/20 shadow-lg shadow-red-500/10 pointer-events-none"></div>
    </div>
  )
}