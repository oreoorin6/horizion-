'use client'

import { useState, useEffect, useCallback } from 'react'

export interface UIScaleSettings {
  scale: number; // 10-300 (percentage)
}

const defaultSettings: UIScaleSettings = {
  scale: 100
}

function loadUIScaleSettings(): UIScaleSettings {
  if (typeof window === 'undefined') return defaultSettings
  
  try {
    const stored = localStorage.getItem('e621-ui-scale')
    if (!stored) return defaultSettings
    return { ...defaultSettings, ...JSON.parse(stored) }
  } catch (error) {
    console.error('Failed to load UI scale settings, using defaults:', error)
    return defaultSettings
  }
}

function saveUIScaleSettings(settings: UIScaleSettings) {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem('e621-ui-scale', JSON.stringify(settings))
  } catch (error) {
    console.error('Failed to save UI scale settings:', error)
  }
}

function applyUIScale(scale: number) {
  if (typeof document === 'undefined') return

  const root = document.documentElement
  const scaleValue = scale / 100
  
  // Apply the scale to the root element
  root.style.setProperty('--ui-scale', scaleValue.toString())
  root.style.setProperty('zoom', scaleValue.toString())
  
  // Also set CSS zoom for better compatibility
  document.body.style.zoom = scaleValue.toString()
}

export function useUIScale() {
  const [settings, setSettings] = useState<UIScaleSettings>(defaultSettings)

  useEffect(() => {
    const savedSettings = loadUIScaleSettings()
    setSettings(savedSettings)
    applyUIScale(savedSettings.scale)
  }, [])

  const updateScale = useCallback((scale: number) => {
    // Clamp scale between 10 and 300
    const clampedScale = Math.max(10, Math.min(300, scale))
    const newSettings = { scale: clampedScale }
    
    setSettings(newSettings)
    saveUIScaleSettings(newSettings)
    applyUIScale(clampedScale)
  }, [])

  const resetScale = useCallback(() => {
    setSettings(defaultSettings)
    saveUIScaleSettings(defaultSettings)
    applyUIScale(defaultSettings.scale)
  }, [])

  return {
    settings,
    updateScale,
    resetScale
  }
}