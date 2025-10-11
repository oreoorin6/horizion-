'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useBlacklist } from '@/hooks/useBlacklist'
import { useSavedTags } from '@/hooks/useSavedTags'

interface TagContextMenuProps {
  tag: string
  position: { x: number; y: number }
  onClose: () => void
  onAction?: (action: string) => void
}

export default function TagContextMenu({ tag, position, onClose, onAction }: TagContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const { settings: blacklistSettings, addEntry, removeEntry } = useBlacklist()
  const { savedTags, addTag, removeTag } = useSavedTags()
  
  // Check if tag is already blacklisted or saved
  const isBlacklisted = blacklistSettings.entries.some(entry => 
    entry.tags.includes(tag) || entry.name === tag
  )
  const isSaved = savedTags.some(savedTag => savedTag.name === tag)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  // Adjust position to keep menu on screen
  const adjustedPosition = {
    x: Math.min(position.x, window.innerWidth - 220), // Menu width ~200px + padding
    y: Math.min(position.y, window.innerHeight - 300) // Menu height ~250px + padding
  }

  const handleAction = (action: string) => {
    switch (action) {
      case 'search':
        window.location.href = `/search?tags=${encodeURIComponent(tag)}`
        break
        
      case 'search-exclude':
        window.location.href = `/search?tags=${encodeURIComponent(`-${tag}`)}`
        break
        
      case 'blacklist-add':
        addEntry([tag], tag)
        break
        
      case 'blacklist-remove':
        // Find the entry that contains this tag and remove it
        const entryToRemove = blacklistSettings.entries.find(entry => 
          entry.tags.includes(tag) || entry.name === tag
        )
        if (entryToRemove) {
          removeEntry(entryToRemove.id)
        }
        break
        
      case 'save-add':
        addTag(tag)
        break
        
      case 'save-remove':
        // Find the saved tag and remove it
        const savedTagToRemove = savedTags.find(savedTag => savedTag.name === tag)
        if (savedTagToRemove) {
          removeTag(savedTagToRemove.id)
        }
        break
        
      case 'copy':
        navigator.clipboard.writeText(tag).then(() => {
          console.log(`Copied tag "${tag}" to clipboard`)
        })
        break
    }
    
    onAction?.(action)
    onClose()
  }

  return (
    <div
      ref={menuRef}
      className="fixed bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-[60] min-w-[200px]"
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y
      }}
    >
      {/* Header with tag name */}
      <div className="px-3 py-2 border-b border-gray-700 bg-gray-800 rounded-t-lg">
        <div className="font-medium text-sm text-white truncate">
          {tag.replace(/_/g, ' ')}
        </div>
        <div className="text-xs text-gray-400">
          Tag Actions
        </div>
      </div>

      {/* Actions list */}
      <div className="py-1">
        {/* Search actions */}
        <button
          onClick={() => handleAction('search')}
          className="w-full px-3 py-2 text-left text-sm text-white hover:bg-gray-800 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Search for this tag
        </button>
        
        <button
          onClick={() => handleAction('search-exclude')}
          className="w-full px-3 py-2 text-left text-sm text-white hover:bg-gray-800 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
          </svg>
          Search excluding this tag
        </button>

        <div className="border-t border-gray-700 my-1"></div>

        {/* Blacklist actions */}
        {!isBlacklisted ? (
          <button
            onClick={() => handleAction('blacklist-add')}
            className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-gray-800 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
            </svg>
            Add to blacklist
          </button>
        ) : (
          <button
            onClick={() => handleAction('blacklist-remove')}
            className="w-full px-3 py-2 text-left text-sm text-green-400 hover:bg-gray-800 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Remove from blacklist
          </button>
        )}

        {/* Saved tags actions */}
        {!isSaved ? (
          <button
            onClick={() => handleAction('save-add')}
            className="w-full px-3 py-2 text-left text-sm text-blue-400 hover:bg-gray-800 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            Save tag
          </button>
        ) : (
          <button
            onClick={() => handleAction('save-remove')}
            className="w-full px-3 py-2 text-left text-sm text-yellow-400 hover:bg-gray-800 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            Remove saved tag
          </button>
        )}

        <div className="border-t border-gray-700 my-1"></div>

        {/* Utility actions */}
        <button
          onClick={() => handleAction('copy')}
          className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Copy tag name
        </button>
      </div>
    </div>
  )
}