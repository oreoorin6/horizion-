'use client'

import { useState, useEffect, useCallback } from 'react'

export type ThemeColor = 'blue' | 'red' | 'green' | 'purple' | 'orange' | 'pink' | 'gray'

const themeColors = {
  blue: {
    primary: '221.2 83.2% 53.3%',
    primaryForeground: '210 40% 98%',
    accent: '210 40% 96%'
  },
  red: {
    primary: '0 72.2% 50.6%',
    primaryForeground: '0 85.7% 97.3%',
    accent: '0 40% 96%'
  },
  green: {
    primary: '142.1 76.2% 36.3%',
    primaryForeground: '355.7 100% 97.3%',
    accent: '142 40% 96%'
  },
  purple: {
    primary: '262.1 83.3% 57.8%',
    primaryForeground: '210 20% 98%',
    accent: '262 40% 96%'
  },
  orange: {
    primary: '24.6 95% 53.1%',
    primaryForeground: '60 9.1% 97.8%',
    accent: '24 40% 96%'
  },
  pink: {
    primary: '326.8 85.7% 60%',
    primaryForeground: '210 20% 98%',
    accent: '326 40% 96%'
  },
  gray: {
    primary: '220 14.3% 45.9%',
    primaryForeground: '210 20% 98%',
    accent: '220 40% 96%'
  }
}

function loadTheme(): ThemeColor {
  if (typeof window === 'undefined') return 'blue'
  
  try {
    const stored = localStorage.getItem('e621-theme')
    return (stored as ThemeColor) || 'blue'
  } catch {
    return 'blue'
  }
}

function saveTheme(theme: ThemeColor) {
  if (typeof window === 'undefined') return
  localStorage.setItem('e621-theme', theme)
}

function applyTheme(theme: ThemeColor) {
  if (typeof document === 'undefined') return

  const root = document.documentElement
  const colors = themeColors[theme]
  
  root.style.setProperty('--primary', colors.primary)
  root.style.setProperty('--primary-foreground', colors.primaryForeground)
  root.style.setProperty('--accent', colors.accent)
}

export function useTheme() {
  // Just use a default theme since we're using custom colors now
  useEffect(() => {
    // Apply default theme colors once on initial load
    applyTheme('red')
  }, [])

  // Return empty functions to maintain API compatibility
  return {
    theme: 'red' as ThemeColor,
    changeTheme: () => {},
    availableThemes: []
  }
}

// Background hook
export interface BackgroundSettings {
  type: 'none' | 'color' | 'image'
  value: string
  opacity: number
}

const defaultBackground: BackgroundSettings = {
  type: 'none',
  value: '',
  opacity: 20
}

function loadBackground(): BackgroundSettings {
  if (typeof window === 'undefined') return defaultBackground
  
  try {
    const stored = localStorage.getItem('e621-background')
    return stored ? { ...defaultBackground, ...JSON.parse(stored) } : defaultBackground
  } catch {
    return defaultBackground
  }
}

function saveBackground(bg: BackgroundSettings) {
  if (typeof window === 'undefined') return
  localStorage.setItem('e621-background', JSON.stringify(bg))
}

function applyBackground(bg: BackgroundSettings) {
  if (typeof document === 'undefined') return

  const body = document.body
  
  switch (bg.type) {
    case 'none':
      body.style.backgroundImage = ''
      body.style.backgroundColor = ''
      break
    case 'color':
      body.style.backgroundImage = ''
      body.style.backgroundColor = bg.value
      break
    case 'image':
      body.style.backgroundColor = ''
      body.style.backgroundImage = `url(${bg.value})`
      body.style.backgroundSize = 'cover'
      body.style.backgroundPosition = 'center'
      body.style.backgroundAttachment = 'fixed'
      break
  }

  // Apply opacity overlay
  if (bg.type !== 'none') {
    const overlay = document.querySelector('.bg-overlay') as HTMLElement
    if (overlay) {
      overlay.style.opacity = (bg.opacity / 100).toString()
    }
  }
}

export function useBackground() {
  const [background, setBackground] = useState<BackgroundSettings>(defaultBackground)

  useEffect(() => {
    const savedBg = loadBackground()
    setBackground(savedBg)
    applyBackground(savedBg)
  }, [])

  const updateBackground = useCallback((newBg: Partial<BackgroundSettings>) => {
    const updated = { ...background, ...newBg }
    setBackground(updated)
    saveBackground(updated)
    applyBackground(updated)
  }, [background])

  const clearBackground = useCallback(() => {
    const cleared = { ...defaultBackground }
    setBackground(cleared)
    saveBackground(cleared)
    applyBackground(cleared)
  }, [])

  return {
    background,
    updateBackground,
    clearBackground
  }
}