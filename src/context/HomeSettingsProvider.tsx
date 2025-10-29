'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'

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

const defaultSections: TagSection[] = []

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

interface HomeSettingsContextType {
  settings: HomeSettings
  updateSettings: (newSettings: Partial<HomeSettings>) => void
  addTagSection: (section: Omit<TagSection, 'id'>) => void
  updateTagSection: (id: string, updates: Partial<TagSection>) => void
  removeTagSection: (id: string) => void
  reorderTagSections: (fromIndex: number, toIndex: number) => void
}

const HomeSettingsContext = createContext<HomeSettingsContextType | undefined>(undefined)

export function HomeSettingsProvider({ children }: { children: ReactNode }) {
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
      console.log(`[HomeSettingsProvider] Adding new tag section "${newSection.title}" with ${newSection.tags.length} tags`)
      console.log(`[HomeSettingsProvider] Total sections now: ${updated.tagSections.length}`)
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

  return (
    <HomeSettingsContext.Provider
      value={{
        settings,
        updateSettings,
        addTagSection,
        updateTagSection,
        removeTagSection,
        reorderTagSections
      }}
    >
      {children}
    </HomeSettingsContext.Provider>
  )
}

export function useHomeSettings() {
  const context = useContext(HomeSettingsContext)
  if (context === undefined) {
    throw new Error('useHomeSettings must be used within a HomeSettingsProvider')
  }
  return context
}
