'use client'

import { useState, useEffect } from 'react'
import { X, User, Key, Palette, Settings as SettingsIcon, Download } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useBackground } from '@/hooks/useTheme'
import { useE621Search } from '@/hooks/useE621Search'
import { useDownloadManager } from '../lib/download-manager'
import ColorPicker from '@/components/ui/color-picker'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { credentials, logout } = useAuth()
  const { background, updateBackground, clearBackground } = useBackground()
  const { settings, updateSettings } = useE621Search()
  const { state: downloadState, updateSettings: updateDownloadSettings, toggleSelectionMode, toggleDownloadPanel } = useDownloadManager()
  
  const [activeTab, setActiveTab] = useState<'account' | 'preferences' | 'appearance' | 'downloads'>('account')
  
  // Color palette state
  const [primaryColor, setPrimaryColor] = useState('#3b82f6') // Blue
  const [secondaryColor, setSecondaryColor] = useState('#8b5cf6') // Purple
  const [backgroundColor, setBackgroundColor] = useState('#1a1a1a') // Dark gray

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

  // Load saved colors on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
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
  }, [])

  if (!isOpen) return null

  const handleLogout = () => {
    logout()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-md">
      <div className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-3xl translate-x-[-50%] translate-y-[-50%] gap-6 border border-border/50 bg-background/95 backdrop-blur-xl p-8 shadow-2xl rounded-2xl">
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
        <div className="border-b border-border/50">
          <nav className="flex space-x-2">
            {[
              { id: 'account', label: 'Account', icon: User },
              { id: 'preferences', label: 'Preferences', icon: SettingsIcon },
              { id: 'appearance', label: 'Appearance', icon: Palette },
              { id: 'downloads', label: 'Downloads', icon: Download }
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
        <div className="max-h-[500px] overflow-y-auto">
          {activeTab === 'account' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold mb-4 text-foreground">Account Information</h3>
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
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-medium mb-3">Search Settings</h3>
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

          {activeTab === 'appearance' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold mb-4 text-foreground">Color Palette Settings</h3>
                <div className="space-y-6">
                  {/* Primary Color Palette */}
                  <div>
                    <ColorPicker
                      value={primaryColor}
                      onChange={setPrimaryColor}
                      label="Primary Color"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Main accent color used for buttons, links, and highlights
                    </p>
                  </div>

                  {/* Secondary Color Palette */}
                  <div>
                    <ColorPicker
                      value={secondaryColor}
                      onChange={setSecondaryColor}
                      label="Secondary Color"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Secondary accent color for complementary elements
                    </p>
                  </div>

                  {/* Background Color Palette */}
                  <div>
                    <ColorPicker
                      value={backgroundColor}
                      onChange={setBackgroundColor}
                      label="Background Color"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Main background color for the application
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3">
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
                      Reset to Default
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4 text-foreground">Background Settings</h3>
                <div className="space-y-4">
                  {/* Background Type */}
                  <div>
                    <label className="text-sm font-semibold text-foreground mb-3 block">
                      Background Type
                    </label>
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

                  {/* Color Picker */}
                  {background.type === 'color' && (
                    <div>
                      <ColorPicker
                        value={background.value || '#1a1a1a'}
                        onChange={(color) => updateBackground({ value: color })}
                        label="Background Color"
                      />
                    </div>
                  )}

                  {/* Image URL */}
                  {background.type === 'image' && (
                    <div>
                      <label className="text-sm font-semibold text-foreground mb-2 block">
                        Background Image URL
                      </label>
                      <input
                        type="url"
                        placeholder="https://example.com/image.jpg"
                        value={background.value}
                        onChange={(e) => updateBackground({ value: e.target.value })}
                        className="flex h-12 w-full rounded-xl border border-input bg-background/50 px-4 py-3 text-sm font-medium shadow-sm transition-all duration-200 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary hover:border-primary/50"
                      />
                    </div>
                  )}

                  {/* Opacity Slider */}
                  {background.type !== 'none' && (
                    <div>
                      <label className="text-sm font-semibold text-foreground mb-2 block">
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
                  )}

                  {/* Clear Background */}
                  {background.type !== 'none' && (
                    <div>
                      <button
                        onClick={clearBackground}
                        className="inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive disabled:pointer-events-none disabled:opacity-50 border border-destructive/50 bg-destructive/10 shadow-sm hover:bg-destructive hover:text-destructive-foreground h-10 px-4 py-2 text-destructive"
                      >
                        Clear Background
                      </button>
                    </div>
                  )}
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