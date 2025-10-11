'use client'

import { useState, useEffect } from 'react'
import { X, User, Key, Palette, Settings as SettingsIcon, Download, Globe, Eye, EyeOff, Shield, Code } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useBackground } from '@/hooks/useTheme'
import { useE621Search } from '@/hooks/useE621Search'
import { useDownloadManager } from '../lib/download-manager'
import { useDeveloperSettings } from '@/hooks/useDeveloperSettings'
import { useUIScale } from '@/hooks/useUIScale'
import ColorPicker from '@/components/ui/color-picker'
import { BlacklistSettings } from '@/components/BlacklistSettings'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { credentials, logout } = useAuth()
  const { background, updateBackground, clearBackground } = useBackground()
  const { settings, updateSettings } = useE621Search()
  const { state: downloadState, updateSettings: updateDownloadSettings, toggleSelectionMode, toggleDownloadPanel } = useDownloadManager()
  const { settings: devSettings, updateSettings: updateDevSettings, resetSettings: resetDevSettings } = useDeveloperSettings()
  const { settings: uiScaleSettings, updateScale, resetScale } = useUIScale()
  
  const [activeTab, setActiveTab] = useState<'account' | 'preferences' | 'downloads' | 'blacklist' | 'apis' | 'developer'>('account')
  
  // Color palette state
  const [primaryColor, setPrimaryColor] = useState('#3b82f6') // Blue
  const [secondaryColor, setSecondaryColor] = useState('#8b5cf6') // Purple
  const [backgroundColor, setBackgroundColor] = useState('#1a1a1a') // Dark gray

  // API credentials state
  const [apiCredentials, setApiCredentials] = useState({
    furaffinity: { username: '', password: '', cookie: '' },
    inkbunny: { username: '', password: '' },
    deviantart: { clientId: '', clientSecret: '' },
    // Add more APIs as needed
  })
  const [showApiPasswords, setShowApiPasswords] = useState<Record<string, boolean>>({})

  // Helper function to convert hex to HSL
  const hexToHsl = (hex: string) => {
    // Remove the # if present
    hex = hex.replace('#', '')
    
    // Parse RGB values
    const r = parseInt(hex.substr(0, 2), 16) / 255
    const g = parseInt(hex.substr(2, 2), 16) / 255
    const b = parseInt(hex.substr(4, 2), 16) / 255
    
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h = 0, s = 0, l = (max + min) / 2
    
    if (max === min) {
      h = s = 0 // achromatic
    } else {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break
        case g: h = (b - r) / d + 2; break
        case b: h = (r - g) / d + 4; break
      }
      h /= 6
    }
    
    // Convert to degrees and percentages
    h = Math.round(h * 360)
    s = Math.round(s * 100)
    l = Math.round(l * 100)
    
    return `${h} ${s}% ${l}%`
  }

  // Color palette functions
  const applyCustomColors = () => {
    // Convert hex colors to HSL format for CSS variables
    const primaryHsl = hexToHsl(primaryColor)
    const secondaryHsl = hexToHsl(secondaryColor)
    const backgroundHsl = hexToHsl(backgroundColor)
    
    // Apply colors to CSS custom properties
    if (typeof document !== 'undefined') {
      const root = document.documentElement
      root.style.setProperty('--primary', primaryHsl)
      root.style.setProperty('--secondary', secondaryHsl)
      root.style.setProperty('--background', backgroundHsl)
    }
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('customColors', JSON.stringify({
        primary: primaryColor,
        secondary: secondaryColor,
        background: backgroundColor
      }))
    }
    
    console.log('Applied custom colors:', { 
      primaryColor: `${primaryColor} (${primaryHsl})`,
      secondaryColor: `${secondaryColor} (${secondaryHsl})`,
      backgroundColor: `${backgroundColor} (${backgroundHsl})`
    })
  }

  const resetToDefaults = () => {
    const defaultColors = {
      primary: '#3b82f6',
      secondary: '#8b5cf6',
      background: '#1a1a1a'
    }
    
    setPrimaryColor(defaultColors.primary)
    setSecondaryColor(defaultColors.secondary)
    setBackgroundColor(defaultColors.background)
    
    // Remove from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('customColors')
    }
    
    // Reset CSS custom properties to original dark theme values
    if (typeof document !== 'undefined') {
      const root = document.documentElement
      root.style.setProperty('--primary', '0 72% 51%') // Original red primary
      root.style.setProperty('--secondary', '345 20% 18%') // Original dark secondary
      root.style.setProperty('--background', '345 35% 8%') // Original dark background
    }
    
    console.log('Reset to default colors')
  }

  // Load saved colors and API credentials on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Load saved colors
    const savedColors = localStorage.getItem('customColors')
    if (savedColors) {
      try {
        const colors = JSON.parse(savedColors)
        setPrimaryColor(colors.primary || '#3b82f6')
        setSecondaryColor(colors.secondary || '#8b5cf6')
        setBackgroundColor(colors.background || '#1a1a1a')
      } catch (error) {
        console.error('Error loading saved colors:', error)
      }
    }

    // Load saved API credentials
    const savedApiCredentials = localStorage.getItem('apiCredentials')
    if (savedApiCredentials) {
      try {
        const credentials = JSON.parse(savedApiCredentials)
        setApiCredentials(prev => ({ ...prev, ...credentials }))
      } catch (error) {
        console.error('Error loading saved API credentials:', error)
      }
    }
  }, [])

  // Save API credentials
  const saveApiCredentials = (api: string, credentials: any) => {
    const updated = { ...apiCredentials, [api]: credentials }
    setApiCredentials(updated)
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('apiCredentials', JSON.stringify(updated))
    }
  }

  // Clear API credentials
  const clearApiCredentials = (api: string) => {
    const updated = { ...apiCredentials, [api]: {} }
    setApiCredentials(updated)
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('apiCredentials', JSON.stringify(updated))
    }
  }

  // Toggle password visibility
  const togglePasswordVisibility = (api: string, field: string) => {
    const key = `${api}_${field}`
    setShowApiPasswords(prev => ({ ...prev, [key]: !prev[key] }))
  }

  if (!isOpen) return null

  const handleLogout = () => {
    logout()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-6xl max-h-[90vh] grid gap-6 border border-border/50 bg-background/95 backdrop-blur-xl p-6 lg:p-8 shadow-2xl rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <SettingsIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold leading-none tracking-tight">Settings</h2>
              <p className="text-sm text-muted-foreground mt-1">Customize your E621 Horizon experience</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground border border-input bg-background/50 shadow-sm hover:border-accent h-10 w-10"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-border/50 -mx-6 lg:-mx-8 px-6 lg:px-8 overflow-x-auto">
          <nav className="flex space-x-2 min-w-max">
            {[
              { id: 'account', label: 'Account', icon: User },
              { id: 'preferences', label: 'Preferences', icon: SettingsIcon },
              { id: 'downloads', label: 'Downloads', icon: Download },
              { id: 'blacklist', label: 'Blacklist', icon: Shield },
              { id: 'apis', label: 'APIs', icon: Globe },
              { id: 'developer', label: 'Developer', icon: Code }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center space-x-2 px-4 py-3 text-sm font-semibold transition-all duration-200 rounded-t-xl ${
                  activeTab === id
                    ? 'bg-primary/10 text-primary border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden -mx-6 lg:-mx-8 px-6 lg:px-8">
          {activeTab === 'account' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold mb-4 text-foreground">E621 Account Information</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-card/30 shadow-sm">
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">Username</p>
                        <p className="text-sm text-muted-foreground">{credentials?.username}</p>
                      </div>
                    </div>
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-card/30 shadow-sm">
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <Key className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">API Key</p>
                        <p className="text-sm text-muted-foreground font-mono">••••••••••••••••</p>
                      </div>
                    </div>
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4 text-foreground">Danger Zone</h3>
                <div className="p-4 rounded-xl border border-destructive/20 bg-destructive/5">
                  <button
                    onClick={handleLogout}
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive disabled:pointer-events-none disabled:opacity-50 border border-destructive/50 bg-destructive/10 shadow-sm hover:bg-destructive hover:text-destructive-foreground h-10 px-6 py-2 text-destructive"
                  >
                    Sign Out
                  </button>
                  <p className="mt-3 text-sm text-muted-foreground">
                    This will clear your stored credentials and return you to the login screen.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="space-y-8">
              {/* UI Scale Settings */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Interface Scale</h3>
                    <p className="text-sm text-muted-foreground">Adjust the overall size of the user interface</p>
                  </div>
                  <button
                    onClick={resetScale}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Reset
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium">Scale: {uiScaleSettings.scale}%</label>
                      <span className="text-xs text-muted-foreground">
                        {uiScaleSettings.scale < 80 ? 'Smaller' : 
                         uiScaleSettings.scale > 120 ? 'Larger' : 'Normal'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-xs text-muted-foreground min-w-[30px]">10%</span>
                      <input
                        type="range"
                        min="10"
                        max="300"
                        step="5"
                        value={uiScaleSettings.scale}
                        onChange={(e) => updateScale(parseInt(e.target.value))}
                        className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer slider"
                      />
                      <span className="text-xs text-muted-foreground min-w-[35px]">300%</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Changes apply immediately without requiring a page refresh
                    </p>
                  </div>
                </div>
              </div>

              {/* Appearance Settings */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-foreground">Appearance</h3>
                <div className="space-y-6">
                  {/* Color Palette */}
                  <div>
                    <h4 className="text-base font-medium mb-3">Color Palette</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <ColorPicker
                          value={primaryColor}
                          onChange={setPrimaryColor}
                          label="Primary Color"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Main accent color
                        </p>
                      </div>
                      <div>
                        <ColorPicker
                          value={secondaryColor}
                          onChange={setSecondaryColor}
                          label="Secondary Color"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Secondary accents
                        </p>
                      </div>
                      <div>
                        <ColorPicker
                          value={backgroundColor}
                          onChange={setBackgroundColor}
                          label="Background Color"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Main background
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-3 mt-4">
                      <button
                        onClick={applyCustomColors}
                        className="inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 hover:shadow-xl h-10 px-6 py-2"
                      >
                        Apply Colors
                      </button>
                      <button
                        onClick={resetToDefaults}
                        className="inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50 border border-input bg-background/50 shadow-sm hover:bg-accent hover:text-accent-foreground hover:border-accent h-10 px-6 py-2"
                      >
                        Reset Colors
                      </button>
                    </div>
                  </div>

                  {/* Background Settings */}
                  <div>
                    <h4 className="text-base font-medium mb-3">Background</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Background Type</label>
                        <div className="flex space-x-2">
                          {[
                            { value: 'none', label: 'None' },
                            { value: 'color', label: 'Color' },
                            { value: 'image', label: 'Image' }
                          ].map((option) => (
                            <button
                              key={option.value}
                              onClick={() => updateBackground({ type: option.value as any })}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                background.type === option.value
                                  ? 'bg-primary text-primary-foreground shadow-sm'
                                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {background.type === 'color' && (
                        <div>
                          <ColorPicker
                            value={background.value || '#1a1a1a'}
                            onChange={(color) => updateBackground({ value: color })}
                            label="Background Color"
                          />
                        </div>
                      )}

                      {background.type === 'image' && (
                        <div>
                          <label className="text-sm font-medium mb-2 block">Background Image URL</label>
                          <input
                            type="url"
                            placeholder="https://example.com/image.jpg"
                            value={background.value}
                            onChange={(e) => updateBackground({ value: e.target.value })}
                            className="flex h-12 w-full rounded-xl border border-input bg-background/50 px-4 py-3 text-sm font-medium shadow-sm transition-all duration-200 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary hover:border-primary/50"
                          />
                        </div>
                      )}

                      {background.type !== 'none' && (
                        <>
                          <div>
                            <label className="text-sm font-medium mb-2 block">
                              Background Opacity: {background.opacity}%
                            </label>
                            <div className="flex items-center space-x-4">
                              <span className="text-xs text-muted-foreground">0%</span>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={background.opacity}
                                onChange={(e) => updateBackground({ opacity: parseInt(e.target.value) })}
                                className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer slider"
                              />
                              <span className="text-xs text-muted-foreground">100%</span>
                            </div>
                          </div>
                          <button
                            onClick={clearBackground}
                            className="inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive disabled:pointer-events-none disabled:opacity-50 border border-destructive/50 bg-destructive/10 shadow-sm hover:bg-destructive hover:text-destructive-foreground h-10 px-4 py-2 text-destructive"
                          >
                            Clear Background
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Search Settings */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-foreground">Search Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Posts per page</label>
                    <select
                      value={settings.postsPerPage}
                      onChange={(e) => updateSettings({ postsPerPage: parseInt(e.target.value) })}
                      className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                    >
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Default Ratings</label>
                    <div className="mt-2 space-y-2">
                      {(['s', 'q', 'e'] as const).map((rating) => (
                        <label key={rating} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={settings.defaultRatings.includes(rating)}
                            onChange={(e) => {
                              const ratings = e.target.checked
                                ? [...settings.defaultRatings, rating]
                                : settings.defaultRatings.filter(r => r !== rating)
                              updateSettings({ defaultRatings: ratings as ("q" | "s" | "e")[] })
                            }}
                            className="rounded border-input"
                          />
                          <span className="text-sm">
                            {rating === 's' ? 'Safe' : rating === 'q' ? 'Questionable' : 'Explicit'}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'downloads' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold mb-4 text-foreground">Download Settings</h3>
                <div className="space-y-6">
                  {/* Default Quality */}
                  <div>
                    <label className="text-sm font-medium">Default Download Quality</label>
                    <select
                      value={downloadState.settings.quality}
                      onChange={(e) => updateDownloadSettings({ quality: e.target.value as any })}
                      className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                    >
                      <option value="original">Original</option>
                      <option value="sample">Sample</option>
                      <option value="preview">Preview</option>
                    </select>
                    <p className="text-xs text-muted-foreground mt-2">
                      The default quality to use when downloading posts
                    </p>
                  </div>

                  {/* Download Location */}
                  <div>
                    <label className="text-sm font-medium">Download Location</label>
                    <input
                      type="text"
                      value={downloadState.settings.location}
                      onChange={(e) => updateDownloadSettings({ location: e.target.value })}
                      className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                      placeholder="downloads"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      The directory where downloads will be saved
                    </p>
                  </div>

                  {/* Filename Template */}
                  <div>
                    <label className="text-sm font-medium">Filename Template</label>
                    <input
                      type="text"
                      value={downloadState.settings.filenameTemplate}
                      onChange={(e) => updateDownloadSettings({ filenameTemplate: e.target.value })}
                      className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                      placeholder="{artist}_{id}.{ext}"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Available variables: {'{id}'}, {'{artist}'}, {'{character}'}, {'{rating}'}, {'{score}'}, {'{ext}'}, {'{md5}'}, {'{date}'}, {'{year}'}, {'{month}'}, {'{day}'}
                    </p>
                  </div>

                  {/* Max Concurrent Downloads */}
                  <div>
                    <label className="text-sm font-medium">Max Concurrent Downloads</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={downloadState.settings.maxConcurrentDownloads}
                      onChange={(e) => updateDownloadSettings({ maxConcurrentDownloads: parseInt(e.target.value) })}
                      className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Maximum number of downloads to run at once
                    </p>
                  </div>

                  {/* Checkboxes */}
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="showNotifications"
                        checked={downloadState.settings.showNotifications}
                        onChange={(e) => updateDownloadSettings({ showNotifications: e.target.checked })}
                        className="mr-2"
                      />
                      <label htmlFor="showNotifications" className="text-sm">
                        Show notifications for completed downloads
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="createSubfolders"
                        checked={downloadState.settings.createSubfolders}
                        onChange={(e) => updateDownloadSettings({ createSubfolders: e.target.checked })}
                        className="mr-2"
                      />
                      <label htmlFor="createSubfolders" className="text-sm">
                        Create subfolders for downloads
                      </label>
                    </div>
                  </div>

                  {/* Subfolder Template */}
                  {downloadState.settings.createSubfolders && (
                    <div>
                      <label className="text-sm font-medium">Subfolder Template</label>
                      <input
                        type="text"
                        value={downloadState.settings.subfolderTemplate}
                        onChange={(e) => updateDownloadSettings({ subfolderTemplate: e.target.value })}
                        className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                        placeholder="{artist}"
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        Template for subfolder names when organizing downloads
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4 text-foreground">Download Manager</h3>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Open the download manager to view active downloads, progress, and manage your download queue
                  </p>
                  
                  <button
                    onClick={() => {
                      if (!downloadState.isDownloadPanelOpen) {
                        toggleDownloadPanel();
                      }
                      onClose();
                    }}
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 hover:shadow-xl h-10 px-6 py-2"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Open Download Manager
                  </button>
                  
                  {downloadState.activeDownloads > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Currently {downloadState.activeDownloads} active download{downloadState.activeDownloads > 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}



          {activeTab === 'blacklist' && (
            <BlacklistSettings />
          )}

          {activeTab === 'apis' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold mb-4 text-foreground">API Integrations</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Configure optional API credentials for additional content sources. E621 authentication is required and managed separately.
                </p>
                
                {/* FurAffinity */}
                <div className="space-y-6 border-b border-border/50 pb-6 mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                      <Globe className="h-4 w-4 text-orange-500" />
                    </div>
                    <div>
                      <h4 className="text-base font-semibold">FurAffinity</h4>
                      <p className="text-xs text-muted-foreground">Optional integration for FurAffinity content</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-11">
                    <div>
                      <label className="text-sm font-medium">Username</label>
                      <input
                        type="text"
                        value={apiCredentials.furaffinity.username}
                        onChange={(e) => saveApiCredentials('furaffinity', { 
                          ...apiCredentials.furaffinity, 
                          username: e.target.value 
                        })}
                        className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                        placeholder="Your FurAffinity username"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Cookie</label>
                      <div className="relative mt-1">
                        <input
                          type={showApiPasswords.furaffinity_cookie ? "text" : "password"}
                          value={apiCredentials.furaffinity.cookie}
                          onChange={(e) => saveApiCredentials('furaffinity', { 
                            ...apiCredentials.furaffinity, 
                            cookie: e.target.value 
                          })}
                          className="block w-full rounded-md border border-input bg-background px-3 py-1.5 pr-10 text-sm"
                          placeholder="Session cookie for authentication"
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('furaffinity', 'cookie')}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showApiPasswords.furaffinity_cookie ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="ml-11">
                    <button
                      onClick={() => clearApiCredentials('furaffinity')}
                      className="text-xs text-destructive hover:text-destructive/80"
                    >
                      Clear FurAffinity credentials
                    </button>
                  </div>
                </div>

                {/* Inkbunny */}
                <div className="space-y-6 border-b border-border/50 pb-6 mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                      <Globe className="h-4 w-4 text-blue-500" />
                    </div>
                    <div>
                      <h4 className="text-base font-semibold">Inkbunny</h4>
                      <p className="text-xs text-muted-foreground">Optional integration for Inkbunny content</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-11">
                    <div>
                      <label className="text-sm font-medium">Username</label>
                      <input
                        type="text"
                        value={apiCredentials.inkbunny.username}
                        onChange={(e) => saveApiCredentials('inkbunny', { 
                          ...apiCredentials.inkbunny, 
                          username: e.target.value 
                        })}
                        className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                        placeholder="Your Inkbunny username"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Password</label>
                      <div className="relative mt-1">
                        <input
                          type={showApiPasswords.inkbunny_password ? "text" : "password"}
                          value={apiCredentials.inkbunny.password}
                          onChange={(e) => saveApiCredentials('inkbunny', { 
                            ...apiCredentials.inkbunny, 
                            password: e.target.value 
                          })}
                          className="block w-full rounded-md border border-input bg-background px-3 py-1.5 pr-10 text-sm"
                          placeholder="Your Inkbunny password"
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('inkbunny', 'password')}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showApiPasswords.inkbunny_password ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="ml-11">
                    <button
                      onClick={() => clearApiCredentials('inkbunny')}
                      className="text-xs text-destructive hover:text-destructive/80"
                    >
                      Clear Inkbunny credentials
                    </button>
                  </div>
                </div>

                {/* DeviantArt */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                      <Globe className="h-4 w-4 text-green-500" />
                    </div>
                    <div>
                      <h4 className="text-base font-semibold">DeviantArt</h4>
                      <p className="text-xs text-muted-foreground">Optional integration for DeviantArt content (requires OAuth)</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-11">
                    <div>
                      <label className="text-sm font-medium">Client ID</label>
                      <input
                        type="text"
                        value={apiCredentials.deviantart.clientId}
                        onChange={(e) => saveApiCredentials('deviantart', { 
                          ...apiCredentials.deviantart, 
                          clientId: e.target.value 
                        })}
                        className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                        placeholder="Your DeviantArt Client ID"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Client Secret</label>
                      <div className="relative mt-1">
                        <input
                          type={showApiPasswords.deviantart_secret ? "text" : "password"}
                          value={apiCredentials.deviantart.clientSecret}
                          onChange={(e) => saveApiCredentials('deviantart', { 
                            ...apiCredentials.deviantart, 
                            clientSecret: e.target.value 
                          })}
                          className="block w-full rounded-md border border-input bg-background px-3 py-1.5 pr-10 text-sm"
                          placeholder="Your DeviantArt Client Secret"
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('deviantart', 'secret')}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showApiPasswords.deviantart_secret ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="ml-11">
                    <button
                      onClick={() => clearApiCredentials('deviantart')}
                      className="text-xs text-destructive hover:text-destructive/80"
                    >
                      Clear DeviantArt credentials
                    </button>
                  </div>
                </div>

                <div className="mt-8 p-4 rounded-lg bg-muted/30 border border-border/50">
                  <p className="text-xs text-muted-foreground">
                    <strong>Note:</strong> These API integrations are optional and only needed if you want to browse content from these sources. 
                    All credentials are stored locally in your browser and are only sent to their respective services for authentication.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'developer' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold mb-4 text-foreground">Developer Settings</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Advanced debugging and development tools for troubleshooting the application.
                </p>
                
                {/* Debug Console Settings */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-semibold">Debug Console</h4>
                      <p className="text-xs text-muted-foreground">Enable the floating debug console to monitor application logs</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={devSettings.debugConsoleEnabled}
                        onChange={(e) => updateDevSettings({ debugConsoleEnabled: e.target.checked })}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 dark:peer-focus:ring-primary/25 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  {devSettings.debugConsoleEnabled && (
                    <div className="ml-4 space-y-4 pl-4 border-l-2 border-primary/20">
                      <div>
                        <h5 className="text-sm font-medium mb-3">Log Types</h5>
                        <div className="grid grid-cols-2 gap-3">
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={devSettings.showDebugLogs}
                              onChange={(e) => updateDevSettings({ showDebugLogs: e.target.checked })}
                              className="rounded"
                            />
                            <span className="text-xs">Debug Logs</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={devSettings.showApiLogs}
                              onChange={(e) => updateDevSettings({ showApiLogs: e.target.checked })}
                              className="rounded"
                            />
                            <span className="text-xs">API Logs</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={devSettings.showErrorLogs}
                              onChange={(e) => updateDevSettings({ showErrorLogs: e.target.checked })}
                              className="rounded"
                            />
                            <span className="text-xs">Error Logs</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={devSettings.showWarningLogs}
                              onChange={(e) => updateDevSettings({ showWarningLogs: e.target.checked })}
                              className="rounded"
                            />
                            <span className="text-xs">Warning Logs</span>
                          </label>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium">Max Log Entries</label>
                        <div className="mt-1 flex items-center space-x-3">
                          <input
                            type="range"
                            min="100"
                            max="5000"
                            step="100"
                            value={devSettings.maxLogEntries}
                            onChange={(e) => updateDevSettings({ maxLogEntries: parseInt(e.target.value) })}
                            className="flex-1"
                          />
                          <span className="text-xs text-muted-foreground min-w-[60px]">
                            {devSettings.maxLogEntries}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Maximum number of log entries to keep in memory
                        </p>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="text-sm font-medium">Persist Logs</h5>
                          <p className="text-xs text-muted-foreground">Save logs between sessions</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={devSettings.persistLogs}
                            onChange={(e) => updateDevSettings({ persistLogs: e.target.checked })}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 dark:peer-focus:ring-primary/25 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                        </label>
                      </div>
                    </div>
                  )}

                  <div className="mt-6 pt-4 border-t border-border/50">
                    <button
                      onClick={resetDevSettings}
                      className="text-sm text-destructive hover:text-destructive/80 font-medium"
                    >
                      Reset Developer Settings
                    </button>
                  </div>
                </div>

                <div className="mt-8 p-4 rounded-lg bg-muted/30 border border-border/50">
                  <p className="text-xs text-muted-foreground">
                    <strong>Note:</strong> Developer settings are intended for debugging and troubleshooting. 
                    The debug console will appear as a floating panel in the bottom-right corner when enabled.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t border-border/50">
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 hover:shadow-xl h-11 px-8 py-2"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}