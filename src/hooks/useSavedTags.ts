'use client'

import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'e621-horizon-saved-tags'

export interface SavedTag {
  name: string
  id: string
}

function getInitialTags(): SavedTag[] {
  if (typeof window === 'undefined') {
    return []
  }
  try {
    const item = window.localStorage.getItem(STORAGE_KEY)
    return item ? JSON.parse(item) : []
  } catch (error) {
    console.error('Error reading saved tags from localStorage', error)
    return []
  }
}

export function useSavedTags() {
  const [savedTags, setSavedTags] = useState<SavedTag[]>(getInitialTags)

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(savedTags))
    } catch (error) {
      console.error('Error saving tags to localStorage', error)
    }
  }, [savedTags])

  const addTag = useCallback((name: string) => {
    if (!name.trim()) return
    const newTag: SavedTag = { name: name.trim().replace(/\s+/g, '_'), id: crypto.randomUUID() }
    setSavedTags(prevTags => {
      if (prevTags.some(tag => tag.name.toLowerCase() === newTag.name.toLowerCase())) {
        return prevTags
      }
      return [...prevTags, newTag]
    })
  }, [])

  const removeTag = useCallback((id: string) => {
    setSavedTags(prevTags => prevTags.filter(tag => tag.id !== id))
  }, [])

  return { savedTags, addTag, removeTag }
}
