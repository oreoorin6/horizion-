'use client'

import { useState, useEffect, useCallback } from 'react'

export interface DeveloperSettings {
  debugConsoleEnabled: boolean
  showDebugLogs: boolean
  showApiLogs: boolean
  showErrorLogs: boolean
  showWarningLogs: boolean
  maxLogEntries: number
  persistLogs: boolean
  updateChecksEnabled: boolean
}

const defaultSettings: DeveloperSettings = {
  debugConsoleEnabled: false,
  showDebugLogs: true,
  showApiLogs: true,
  showErrorLogs: true,
  showWarningLogs: true,
  maxLogEntries: 1000,
  persistLogs: true,
  updateChecksEnabled: true
}

function loadDeveloperSettings(): DeveloperSettings {
  if (typeof window === 'undefined') return defaultSettings
  
  try {
    const stored = localStorage.getItem('e621-dev-settings')
    if (!stored) return defaultSettings
    return { ...defaultSettings, ...JSON.parse(stored) }
  } catch (error) {
    console.error('Failed to load developer settings, using defaults:', error)
    return defaultSettings
  }
}

function saveDeveloperSettings(settings: DeveloperSettings) {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem('e621-dev-settings', JSON.stringify(settings))
  } catch (error) {
    console.error('Failed to save developer settings:', error)
  }
}

export function useDeveloperSettings() {
  const [settings, setSettings] = useState<DeveloperSettings>(defaultSettings)

  useEffect(() => {
    const savedSettings = loadDeveloperSettings()
    setSettings(savedSettings)
  }, [])

  const updateSettings = useCallback((newSettings: Partial<DeveloperSettings>) => {
    const updatedSettings = { ...settings, ...newSettings }
    setSettings(updatedSettings)
    saveDeveloperSettings(updatedSettings)
  }, [settings])

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings)
    saveDeveloperSettings(defaultSettings)
  }, [])

  const toggleDebugConsole = useCallback(() => {
    updateSettings({ debugConsoleEnabled: !settings.debugConsoleEnabled })
  }, [settings.debugConsoleEnabled, updateSettings])

  return {
    settings,
    updateSettings,
    resetSettings,
    toggleDebugConsole
  }
}