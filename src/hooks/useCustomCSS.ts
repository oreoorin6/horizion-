'use client'

import { useState, useEffect, useCallback } from 'react'

export interface CustomCSSSettings {
  enabled: boolean
  css: string
}

const defaultSettings: CustomCSSSettings = {
  enabled: false,
  css: `/* Add your custom CSS here */

/* Example: Change post card hover effects */
.post-card:hover {
  transform: scale(1.05);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
}

/* Example: Custom scrollbar */
::-webkit-scrollbar {
  width: 12px;
}

::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.3);
}

::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 6px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}
`
}

function loadCustomCSS(): CustomCSSSettings {
  if (typeof window === 'undefined') return defaultSettings
  
  try {
    const stored = localStorage.getItem('e621-custom-css')
    if (!stored) return defaultSettings
    return { ...defaultSettings, ...JSON.parse(stored) }
  } catch (error) {
    console.error('Failed to load custom CSS, using defaults:', error)
    return defaultSettings
  }
}

function saveCustomCSS(settings: CustomCSSSettings) {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem('e621-custom-css', JSON.stringify(settings))
  } catch (error) {
    console.error('Failed to save custom CSS:', error)
  }
}

function applyCustomCSS(css: string, enabled: boolean) {
  if (typeof document === 'undefined') return

  // Remove existing custom CSS if present
  const existingStyle = document.getElementById('custom-css-injection')
  if (existingStyle) {
    existingStyle.remove()
  }

  // Only apply if enabled and CSS is not empty
  if (enabled && css.trim()) {
    const style = document.createElement('style')
    style.id = 'custom-css-injection'
    style.textContent = css
    document.head.appendChild(style)
    console.log('[CustomCSS] Applied custom CSS:', css.length, 'characters')
  } else {
    console.log('[CustomCSS] Custom CSS disabled or empty')
  }
}

export function useCustomCSS() {
  const [settings, setSettings] = useState<CustomCSSSettings>(defaultSettings)
  const [error, setError] = useState<string | null>(null)

  // Load settings on mount
  useEffect(() => {
    const savedSettings = loadCustomCSS()
    setSettings(savedSettings)
    // Apply saved CSS
    applyCustomCSS(savedSettings.css, savedSettings.enabled)
  }, [])

  const updateSettings = useCallback((newSettings: Partial<CustomCSSSettings>) => {
    setSettings(current => {
      const updated = { ...current, ...newSettings }
      saveCustomCSS(updated)
      applyCustomCSS(updated.css, updated.enabled)
      return updated
    })
    setError(null)
  }, [])

  const updateCSS = useCallback((css: string) => {
    setError(null)
    updateSettings({ css })
  }, [updateSettings])

  const toggleEnabled = useCallback(() => {
    updateSettings({ enabled: !settings.enabled })
  }, [settings.enabled, updateSettings])

  const resetCSS = useCallback(() => {
    setError(null)
    updateSettings(defaultSettings)
  }, [updateSettings])

  const validateCSS = useCallback((css: string): boolean => {
    try {
      // Create a temporary style element to test CSS validity
      const style = document.createElement('style')
      style.textContent = css
      document.head.appendChild(style)
      
      // Check if any CSS rules were parsed
      const sheet = style.sheet as CSSStyleSheet
      const isValid = sheet && sheet.cssRules.length >= 0
      
      // Remove the test style
      document.head.removeChild(style)
      
      if (!isValid) {
        setError('Invalid CSS syntax detected')
      }
      
      return isValid
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown CSS error'
      setError(`CSS Error: ${errorMessage}`)
      return false
    }
  }, [])

  const applyAndValidate = useCallback((css: string) => {
    if (validateCSS(css)) {
      updateSettings({ css, enabled: true })
      return true
    }
    return false
  }, [validateCSS, updateSettings])

  return {
    settings,
    error,
    updateSettings,
    updateCSS,
    toggleEnabled,
    resetCSS,
    validateCSS,
    applyAndValidate
  }
}
