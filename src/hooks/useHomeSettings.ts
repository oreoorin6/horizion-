'use client'

import { useState, useEffect, useCallback } from 'react'

export interface HomeSettings {
  tagSections: TagSection[]
  layout: 'grid' | 'list'
  showRecentSearches: boolean
}

export interface TagSection {
  id: string
  title: string
  tags: string[]
  enabled: boolean
  color?: string
}

const defaultSections: TagSection[] = [
  // Start with empty sections so users can customize from scratch
  // They'll be guided to add their own through the UI
]

const defaultSettings: HomeSettings = {
  tagSections: defaultSections,
  layout: 'grid',
  showRecentSearches: true
}

function loadHomeSettings(): HomeSettings {
  if (typeof window === 'undefined') return defaultSettings
  
  try {
    const stored = localStorage.getItem('e621-home-settings')
    return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings
  } catch {
    return defaultSettings
  }
}

function saveHomeSettings(settings: HomeSettings) {
  if (typeof window === 'undefined') return
  localStorage.setItem('e621-home-settings', JSON.stringify(settings))
}

export function useHomeSettings() {
  const [settings, setSettings] = useState<HomeSettings>(defaultSettings)

  useEffect(() => {
    setSettings(loadHomeSettings())
  }, [])

  const updateSettings = useCallback((newSettings: Partial<HomeSettings>) => {
    setSettings(currentSettings => {
      const updated = { ...currentSettings, ...newSettings }
      saveHomeSettings(updated)
      return updated
    })
  }, [])

  const addTagSection = useCallback((section: Omit<TagSection, 'id'>) => {
    setSettings(currentSettings => {
      const newSection: TagSection = {
        ...section,
        id: Date.now().toString()
      }
      const updated = {
        ...currentSettings,
        tagSections: [...currentSettings.tagSections, newSection]
      }
      console.log(`[useHomeSettings] Adding new tag section "${newSection.title}" with ${newSection.tags.length} tags`)
      console.log(`[useHomeSettings] Total sections now: ${updated.tagSections.length}`)
      saveHomeSettings(updated)
      return updated
    })
  }, [])

  const updateTagSection = useCallback((id: string, updates: Partial<TagSection>) => {
    setSettings(currentSettings => {
      const updated = {
        ...currentSettings,
        tagSections: currentSettings.tagSections.map(section =>
          section.id === id ? { ...section, ...updates } : section
        )
      }
      saveHomeSettings(updated)
      return updated
    })
  }, [])

  const removeTagSection = useCallback((id: string) => {
    setSettings(currentSettings => {
      const updated = {
        ...currentSettings,
        tagSections: currentSettings.tagSections.filter(section => section.id !== id)
      }
      saveHomeSettings(updated)
      return updated
    })
  }, [])

  const reorderTagSections = useCallback((fromIndex: number, toIndex: number) => {
    setSettings(currentSettings => {
      const sections = [...currentSettings.tagSections]
      const [moved] = sections.splice(fromIndex, 1)
      sections.splice(toIndex, 0, moved)
      
      const updated = { ...currentSettings, tagSections: sections }
      saveHomeSettings(updated)
      return updated
    })
  }, [])

  return {
    settings,
    updateSettings,
    addTagSection,
    updateTagSection,
    removeTagSection,
    reorderTagSections
  }
}