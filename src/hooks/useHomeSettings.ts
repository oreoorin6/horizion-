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
  {
    id: 'popular',
    title: 'Popular Today',
    tags: ['order:score'],
    enabled: true,
    color: 'blue'
  },
  {
    id: 'recent',
    title: 'Recent Posts',
    tags: ['order:id'],
    enabled: true,
    color: 'green'
  },
  {
    id: 'favorites',
    title: 'Highly Favorited',
    tags: ['order:favcount'],
    enabled: true,
    color: 'purple'
  }
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
    const updated = { ...settings, ...newSettings }
    setSettings(updated)
    saveHomeSettings(updated)
  }, [settings])

  const addTagSection = useCallback((section: Omit<TagSection, 'id'>) => {
    const newSection: TagSection = {
      ...section,
      id: Date.now().toString()
    }
    const updated = {
      ...settings,
      tagSections: [...settings.tagSections, newSection]
    }
    setSettings(updated)
    saveHomeSettings(updated)
  }, [settings])

  const updateTagSection = useCallback((id: string, updates: Partial<TagSection>) => {
    const updated = {
      ...settings,
      tagSections: settings.tagSections.map(section =>
        section.id === id ? { ...section, ...updates } : section
      )
    }
    setSettings(updated)
    saveHomeSettings(updated)
  }, [settings])

  const removeTagSection = useCallback((id: string) => {
    const updated = {
      ...settings,
      tagSections: settings.tagSections.filter(section => section.id !== id)
    }
    setSettings(updated)
    saveHomeSettings(updated)
  }, [settings])

  const reorderTagSections = useCallback((fromIndex: number, toIndex: number) => {
    const sections = [...settings.tagSections]
    const [moved] = sections.splice(fromIndex, 1)
    sections.splice(toIndex, 0, moved)
    
    const updated = { ...settings, tagSections: sections }
    setSettings(updated)
    saveHomeSettings(updated)
  }, [settings])

  return {
    settings,
    updateSettings,
    addTagSection,
    updateTagSection,
    removeTagSection,
    reorderTagSections
  }
}