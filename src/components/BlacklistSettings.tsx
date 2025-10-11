'use client'

import { useState, useCallback, useRef } from 'react'
import { Plus, Trash2, Eye, EyeOff, Edit3, Check, X } from 'lucide-react'
import { useBlacklist, type BlacklistEntry } from '@/hooks/useBlacklist'
import TagSuggestions from '@/components/TagSuggestions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useApi } from '@/hooks/useApi'

interface EditingEntry {
  id: string
  tags: string[]
  name: string
}

export function BlacklistSettings() {
  const { 
    settings, 
    updateSettings, 
    addEntry, 
    updateEntry, 
    removeEntry, 
    toggleEntry 
  } = useBlacklist()
  
  const [newEntryTags, setNewEntryTags] = useState('')
  const [newEntryName, setNewEntryName] = useState('')
  const [editingEntry, setEditingEntry] = useState<EditingEntry | null>(null)
  const [isAddingEntry, setIsAddingEntry] = useState(false)
  
  // Tag suggestions state
  const [tagSuggestions, setTagSuggestions] = useState<any[]>([])
  const [isTagLoading, setIsTagLoading] = useState(false)
  const [editTagSuggestions, setEditTagSuggestions] = useState<any[]>([])
  const [isEditTagLoading, setIsEditTagLoading] = useState(false)
  
  // Refs for input fields
  const newTagInputRef = useRef<HTMLInputElement>(null)
  const editTagInputRef = useRef<HTMLInputElement>(null)
  
  // API client for fetching tags
  const e621api = useApi('e621') as any

  // Tag suggestion functions
  const fetchTagSuggestions = useCallback(async (query: string, setSuggestions: (tags: any[]) => void, setLoading: (loading: boolean) => void) => {
    if (!query.trim() || !e621api) {
      setSuggestions([])
      return
    }

    try {
      setLoading(true)
      const tags = await e621api.searchTags(query.trim())
      setSuggestions(tags || [])
    } catch (error) {
      console.error('Failed to fetch tag suggestions:', error)
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }, [e621api])

  // Handle new entry tag input change
  const handleNewTagInputChange = useCallback((value: string) => {
    setNewEntryTags(value)
    
    // Get the last word being typed for suggestions
    const words = value.split(/[\s,]+/)
    const lastWord = words[words.length - 1]
    
    if (lastWord.length > 1) {
      fetchTagSuggestions(lastWord, setTagSuggestions, setIsTagLoading)
    } else {
      setTagSuggestions([])
    }
  }, [fetchTagSuggestions])

  // Handle edit entry tag input change
  const handleEditTagInputChange = useCallback((value: string) => {
    if (!editingEntry) return
    
    const tagArray = value
      .split(/[\s,]+/)
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)
    
    setEditingEntry({
      ...editingEntry,
      tags: tagArray
    })
    
    // Get the last word being typed for suggestions
    const words = value.split(/[\s,]+/)
    const lastWord = words[words.length - 1]
    
    if (lastWord.length > 1) {
      fetchTagSuggestions(lastWord, setEditTagSuggestions, setIsEditTagLoading)
    } else {
      setEditTagSuggestions([])
    }
  }, [editingEntry, fetchTagSuggestions])

  // Handle tag selection for new entry
  const handleNewTagSelect = useCallback((tag: string) => {
    const words = newEntryTags.split(/[\s,]+/)
    words[words.length - 1] = tag
    const newValue = words.join(' ') + ' '
    setNewEntryTags(newValue)
    setTagSuggestions([])
    
    // Focus back to input
    if (newTagInputRef.current) {
      newTagInputRef.current.focus()
    }
  }, [newEntryTags])

  // Handle tag selection for edit entry
  const handleEditTagSelect = useCallback((tag: string) => {
    if (!editingEntry) return
    
    const currentValue = editingEntry.tags.join(' ')
    const words = currentValue.split(/[\s,]+/)
    words[words.length - 1] = tag
    const newValue = words.join(' ') + ' '
    
    handleEditTagInputChange(newValue)
    setEditTagSuggestions([])
    
    // Focus back to input
    if (editTagInputRef.current) {
      editTagInputRef.current.focus()
    }
  }, [editingEntry, handleEditTagInputChange])

  // Handle mode change
  const handleModeChange = useCallback((mode: 'cover' | 'hide') => {
    updateSettings({
      ...settings,
      mode
    })
  }, [settings, updateSettings])

  // Handle show blocked tags toggle
  const handleShowBlockedTagsChange = useCallback((showBlockedTags: boolean) => {
    updateSettings({
      ...settings,
      showBlockedTags
    })
  }, [settings, updateSettings])

  // Add new entry
  const handleAddEntry = useCallback(() => {
    if (!newEntryTags.trim()) return

    const tags = newEntryTags
      .split(/[\s,]+/)
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)

    if (tags.length === 0) return

    addEntry(tags, newEntryName.trim() || undefined)
    setNewEntryTags('')
    setNewEntryName('')
    setIsAddingEntry(false)
  }, [newEntryTags, newEntryName, addEntry])

  // Start editing entry
  const handleStartEdit = useCallback((entry: BlacklistEntry) => {
    setEditingEntry({
      id: entry.id,
      tags: [...entry.tags],
      name: entry.name || ''
    })
  }, [])

  // Cancel editing
  const handleCancelEdit = useCallback(() => {
    setEditingEntry(null)
  }, [])

  // Save edited entry
  const handleSaveEdit = useCallback(() => {
    if (!editingEntry) return

    const tags = editingEntry.tags.filter(tag => tag.trim().length > 0)
    if (tags.length === 0) return

    updateEntry(editingEntry.id, {
      tags,
      name: editingEntry.name.trim() || tags.join(' + ')
    })
    setEditingEntry(null)
  }, [editingEntry, updateEntry])

  // Update editing entry tags
  const handleEditingTagsChange = useCallback((tags: string) => {
    if (!editingEntry) return
    
    const tagArray = tags
      .split(/[\s,]+/)
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)
    
    setEditingEntry({
      ...editingEntry,
      tags: tagArray
    })
  }, [editingEntry])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Content Blacklist</h3>
        <p className="text-sm text-muted-foreground">
          Hide or cover posts with specific tags. Uses the same syntax as E621's blacklist system.
        </p>
      </div>

      {/* Global Settings */}
      <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
        <h4 className="font-medium">Blacklist Behavior</h4>
        
        <div className="space-y-3">
          {/* Mode Selection */}
          <div>
            <label className="text-sm font-medium mb-2 block">When content is blacklisted:</label>
            <div className="flex gap-2">
              <Button
                variant={settings.mode === 'cover' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleModeChange('cover')}
                className="flex items-center gap-2"
              >
                <EyeOff size={16} />
                Show cover with reveal option
              </Button>
              <Button
                variant={settings.mode === 'hide' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleModeChange('hide')}
                className="flex items-center gap-2"
              >
                <Eye size={16} />
                Hide completely from search
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {settings.mode === 'cover' 
                ? 'Posts will show a black cover that can be clicked to reveal the content'
                : 'Posts will be completely hidden from search results using API filters'
              }
            </p>
          </div>

          {/* Show blocked tags option - only for cover mode */}
          {settings.mode === 'cover' && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="showBlockedTags"
                checked={settings.showBlockedTags}
                onChange={(e) => handleShowBlockedTagsChange(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="showBlockedTags" className="text-sm">
                Show which tags triggered the blacklist
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Blacklist Entries */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">Blacklist Entries ({settings.entries.length})</h4>
          <Button
            size="sm"
            onClick={() => setIsAddingEntry(true)}
            className="flex items-center gap-2"
          >
            <Plus size={16} />
            Add Entry
          </Button>
        </div>

        {/* Add new entry form */}
        {isAddingEntry && (
          <div className="p-4 bg-muted/30 rounded-lg space-y-3">
            <h5 className="font-medium text-sm">Add New Blacklist Entry</h5>
            
            <div className="space-y-2">
              <div>
                <label className="text-sm font-medium">Tags (space or comma separated)</label>
                <div className="relative mt-1">
                  <Input
                    ref={newTagInputRef}
                    value={newEntryTags}
                    onChange={(e) => handleNewTagInputChange(e.target.value)}
                    placeholder="e.g., gore, scat, rating:explicit male solo"
                    className="bg-background/50 text-foreground pr-8"
                  />
                  {isTagLoading && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                    </div>
                  )}
                  <TagSuggestions 
                    suggestions={tagSuggestions}
                    onSelect={handleNewTagSelect}
                    loading={isTagLoading}
                    onClickOutside={() => setTagSuggestions([])}
                    inputRef={newTagInputRef}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Use spaces or commas between tags. Use <code>-tag</code> to exclude tags.
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium">Name (optional)</label>
                <Input
                  value={newEntryName}
                  onChange={(e) => setNewEntryName(e.target.value)}
                  placeholder="e.g., Gore content"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleAddEntry}>
                <Check size={16} className="mr-1" />
                Add Entry
              </Button>
              <Button size="sm" variant="outline" onClick={() => setIsAddingEntry(false)}>
                <X size={16} className="mr-1" />
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Existing entries */}
        <div className="space-y-2">
          {settings.entries.map((entry) => (
            <div 
              key={entry.id} 
              className={`p-3 rounded-lg border ${
                entry.enabled 
                  ? 'bg-background border-border' 
                  : 'bg-muted/50 border-muted-foreground/20'
              }`}
            >
              {editingEntry?.id === entry.id ? (
                // Edit mode
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Tags</label>
                    <div className="relative mt-1">
                      <Input
                        ref={editTagInputRef}
                        value={editingEntry.tags.join(' ')}
                        onChange={(e) => handleEditTagInputChange(e.target.value)}
                        className="bg-background/50 text-foreground pr-8"
                      />
                      {isEditTagLoading && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                        </div>
                      )}
                      <TagSuggestions 
                        suggestions={editTagSuggestions}
                        onSelect={handleEditTagSelect}
                        loading={isEditTagLoading}
                        onClickOutside={() => setEditTagSuggestions([])}
                        inputRef={editTagInputRef}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Name</label>
                    <Input
                      value={editingEntry.name}
                      onChange={(e) => setEditingEntry({
                        ...editingEntry,
                        name: e.target.value
                      })}
                      className="mt-1"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={handleSaveEdit}>
                      <Check size={14} className="mr-1" />
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                      <X size={14} className="mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                // View mode
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h5 className={`font-medium text-sm ${
                        entry.enabled ? 'text-foreground' : 'text-muted-foreground'
                      }`}>
                        {entry.name || 'Unnamed Entry'}
                      </h5>
                      {!entry.enabled && (
                        <span className="text-xs text-muted-foreground">(Disabled)</span>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      {entry.tags.map((tag, index) => (
                        <span 
                          key={index}
                          className={`text-xs px-2 py-1 rounded ${
                            entry.enabled
                              ? tag.startsWith('-')
                                ? 'bg-green-500/20 text-green-700 dark:text-green-300'
                                : 'bg-red-500/20 text-red-700 dark:text-red-300'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {tag.startsWith('-') ? `exclude: ${tag.substring(1)}` : tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 ml-3">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleEntry(entry.id)}
                      className="h-8 w-8 p-0"
                    >
                      {entry.enabled ? (
                        <Eye size={16} className="text-green-600" />
                      ) : (
                        <EyeOff size={16} className="text-muted-foreground" />
                      )}
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleStartEdit(entry)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit3 size={14} />
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeEntry(entry.id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {settings.entries.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <EyeOff size={48} className="mx-auto mb-3 opacity-30" />
              <p>No blacklist entries configured</p>
              <p className="text-sm">Click "Add Entry" to create your first blacklist rule</p>
            </div>
          )}
        </div>
      </div>

      {/* Help text */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p><strong>Tag syntax:</strong></p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li><code>tag1 tag2</code> - Hide posts that have ALL listed tags</li>
          <li><code>-tag</code> - Exclude posts that have this tag</li>
          <li><code>rating:explicit</code> - Filter by rating (safe, questionable, explicit)</li>
          <li><code>male solo</code> - Hide solo male posts</li>
          <li><code>young -rating:s</code> - Hide young characters except safe-rated</li>
        </ul>
      </div>
    </div>
  )
}