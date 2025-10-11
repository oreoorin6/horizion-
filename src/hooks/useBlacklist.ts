'use client'

import { useState, useEffect, useCallback } from 'react'

export interface BlacklistEntry {
  id: string
  tags: string[]
  name?: string
  enabled: boolean
}

export interface BlacklistSettings {
  entries: BlacklistEntry[]
  mode: 'cover' | 'hide' // 'cover' shows black box, 'hide' removes completely
  showBlockedTags: boolean // Show which tags triggered the blacklist
}

const DEFAULT_BLACKLIST_SETTINGS: BlacklistSettings = {
  entries: [
    {
      id: '1',
      tags: ['gore'],
      name: 'Gore content',
      enabled: true
    },
    {
      id: '2', 
      tags: ['scat'],
      name: 'Scat content',
      enabled: true
    },
    {
      id: '3',
      tags: ['watersports'],
      name: 'Watersports content', 
      enabled: true
    },
    {
      id: '4',
      tags: ['young', '-rating:s'],
      name: 'Young characters (non-safe)',
      enabled: true
    },
    {
      id: '5',
      tags: ['loli'],
      name: 'Loli content',
      enabled: true
    },
    {
      id: '6',
      tags: ['shota'], 
      name: 'Shota content',
      enabled: true
    }
  ],
  mode: 'cover',
  showBlockedTags: true
}

export function useBlacklist() {
  const [settings, setSettings] = useState<BlacklistSettings>(DEFAULT_BLACKLIST_SETTINGS)
  const [isLoading, setIsLoading] = useState(true)

  // Load blacklist from localStorage
  const loadBlacklist = useCallback(() => {
    if (typeof window === 'undefined') return DEFAULT_BLACKLIST_SETTINGS
    
    try {
      const stored = localStorage.getItem('e621-blacklist')
      if (!stored) return DEFAULT_BLACKLIST_SETTINGS
      
      const parsed = JSON.parse(stored)
      
      // Ensure all required fields exist and merge with defaults
      return {
        ...DEFAULT_BLACKLIST_SETTINGS,
        ...parsed,
        entries: parsed.entries?.map((entry: any) => ({
          id: entry.id || Math.random().toString(36).substr(2, 9),
          tags: Array.isArray(entry.tags) ? entry.tags : [],
          name: entry.name || '',
          enabled: typeof entry.enabled === 'boolean' ? entry.enabled : true
        })) || DEFAULT_BLACKLIST_SETTINGS.entries
      }
    } catch (error) {
      console.error('Failed to load blacklist, using defaults:', error)
      return DEFAULT_BLACKLIST_SETTINGS
    }
  }, [])

  // Save blacklist to localStorage
  const saveBlacklist = useCallback((newSettings: BlacklistSettings) => {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.setItem('e621-blacklist', JSON.stringify(newSettings))
    } catch (error) {
      console.error('Failed to save blacklist:', error)
    }
  }, [])

  // Initialize blacklist on mount
  useEffect(() => {
    const loadedSettings = loadBlacklist()
    setSettings(loadedSettings)
    setIsLoading(false)
  }, [loadBlacklist])

  // Update settings and save
  const updateSettings = useCallback((newSettings: BlacklistSettings) => {
    setSettings(newSettings)
    saveBlacklist(newSettings)
  }, [saveBlacklist])

  // Add new blacklist entry
  const addEntry = useCallback((tags: string[], name?: string) => {
    const newEntry: BlacklistEntry = {
      id: Math.random().toString(36).substr(2, 9),
      tags: tags.filter(tag => tag.trim()),
      name: name || tags.join(' + '),
      enabled: true
    }
    
    const newSettings = {
      ...settings,
      entries: [...settings.entries, newEntry]
    }
    
    updateSettings(newSettings)
    return newEntry.id
  }, [settings, updateSettings])

  // Update existing entry
  const updateEntry = useCallback((id: string, updates: Partial<BlacklistEntry>) => {
    const newSettings = {
      ...settings,
      entries: settings.entries.map(entry => 
        entry.id === id ? { ...entry, ...updates } : entry
      )
    }
    updateSettings(newSettings)
  }, [settings, updateSettings])

  // Remove entry
  const removeEntry = useCallback((id: string) => {
    const newSettings = {
      ...settings,
      entries: settings.entries.filter(entry => entry.id !== id)
    }
    updateSettings(newSettings)
  }, [settings, updateSettings])

  // Toggle entry enabled state
  const toggleEntry = useCallback((id: string) => {
    const entry = settings.entries.find(e => e.id === id)
    if (entry) {
      updateEntry(id, { enabled: !entry.enabled })
    }
  }, [settings.entries, updateEntry])

  // Check if post should be blacklisted
  const isPostBlacklisted = useCallback((postTags: string[], rating?: string) => {
    if (!postTags) return { blocked: false, matchedEntries: [] }
    
    const lowerPostTags = postTags.map(tag => tag.toLowerCase())
    const matchedEntries: BlacklistEntry[] = []
    
    for (const entry of settings.entries) {
      if (!entry.enabled) continue
      
      let allTagsMatch = true
      const entryTags = entry.tags.map(tag => tag.toLowerCase())
      
      for (const tag of entryTags) {
        if (tag.startsWith('-')) {
          // Negative tag - should NOT be present
          const negativeTag = tag.substring(1)
          if (negativeTag.startsWith('rating:') && rating) {
            const ratingValue = negativeTag.substring(7)
            if (rating.toLowerCase() === ratingValue) {
              allTagsMatch = false
              break
            }
          } else if (lowerPostTags.includes(negativeTag)) {
            allTagsMatch = false
            break
          }
        } else {
          // Positive tag - should be present
          if (tag.startsWith('rating:') && rating) {
            const ratingValue = tag.substring(7)
            if (rating.toLowerCase() !== ratingValue) {
              allTagsMatch = false
              break
            }
          } else if (!lowerPostTags.includes(tag)) {
            allTagsMatch = false
            break
          }
        }
      }
      
      if (allTagsMatch) {
        matchedEntries.push(entry)
      }
    }
    
    return {
      blocked: matchedEntries.length > 0,
      matchedEntries
    }
  }, [settings.entries])

  // Generate search modifier for API calls (complete hiding)
  const getSearchModifiers = useCallback(() => {
    if (settings.mode !== 'hide') return []
    
    const modifiers: string[] = []
    
    for (const entry of settings.entries) {
      if (!entry.enabled) continue
      
      // Convert blacklist entry to negative search terms
      const negativeTerms = entry.tags.map(tag => {
        if (tag.startsWith('-')) {
          // Double negative becomes positive
          return tag.substring(1)
        } else {
          // Positive becomes negative
          return `-${tag}`
        }
      })
      
      modifiers.push(...negativeTerms)
    }
    
    return modifiers
  }, [settings.entries, settings.mode])

  return {
    settings,
    isLoading,
    updateSettings,
    addEntry,
    updateEntry,
    removeEntry,
    toggleEntry,
    isPostBlacklisted,
    getSearchModifiers
  }
}