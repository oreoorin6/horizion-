'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Plus, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useHomeSettings } from '@/hooks/useHomeSettings'
import { useApi } from '@/hooks/useApi'
import { useDebounce } from '@/hooks/useDebounce'
import TagSuggestions from './TagSuggestions'

interface HomepageSettingsProps {
  isVisible: boolean
  onToggle: () => void
}

export default function HomepageSettings({ isVisible, onToggle }: HomepageSettingsProps) {
  const { settings, addTagSection, removeTagSection } = useHomeSettings()
  const [newTagInput, setNewTagInput] = useState('')
  const [tagSuggestions, setTagSuggestions] = useState<any[]>([])
  const [isTagLoading, setIsTagLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const e621api = useApi('e621') as any
  const debouncedTagInput = useDebounce(newTagInput, 300)

  // Popular starter suggestions
  const popularSuggestions = [
    { name: 'wolf', post_count: 50000 },
    { name: 'cat', post_count: 45000 },
    { name: 'dragon', post_count: 40000 },
    { name: 'fox', post_count: 35000 },
    { name: 'canine', post_count: 60000 },
    { name: 'feline', post_count: 55000 }
  ]

  // Fetch tag suggestions based on input
  useEffect(() => {
    if (debouncedTagInput.length > 2 && e621api) {
      const fetchTags = async () => {
        setIsTagLoading(true)
        try {
          console.log('[HomepageSettings] Searching tags for:', debouncedTagInput)
          const tags = await e621api.searchTags(debouncedTagInput)
          console.log('[HomepageSettings] Tag search results:', tags ? tags.length : 0)
          
          if (Array.isArray(tags)) {
            setTagSuggestions(tags)
          } else {
            console.error('[HomepageSettings] Invalid tag search result:', tags)
            setTagSuggestions([])
          }
        } catch (error) {
          console.error('[HomepageSettings] Failed to fetch tags:', error)
          setTagSuggestions([])
        } finally {
          setIsTagLoading(false)
        }
      }
      fetchTags()
    } else if (debouncedTagInput.length > 0 && debouncedTagInput.length <= 2) {
      // Show filtered popular suggestions for short inputs
      const filtered = popularSuggestions.filter(tag => 
        tag.name.toLowerCase().includes(debouncedTagInput.toLowerCase())
      )
      setTagSuggestions(filtered)
    } else {
      // Show popular suggestions when input is empty or just focused
      setTagSuggestions(newTagInput.length === 0 ? [] : popularSuggestions)
    }
  }, [debouncedTagInput, newTagInput, e621api])

  const handleAddTag = () => {
    const trimmedInput = newTagInput.trim()
    if (trimmedInput) {
      // Check if section already exists
      const exists = settings.tagSections.some(section => 
        section.title.toLowerCase() === trimmedInput.toLowerCase() ||
        section.tags.some(tag => tag.toLowerCase() === trimmedInput.toLowerCase())
      )
      
      if (!exists) {
        addTagSection({
          title: trimmedInput,
          tags: [trimmedInput],
          enabled: true
        })
        setNewTagInput('')
        setTagSuggestions([]) // Clear suggestions after adding
      } else {
        console.log(`[HomepageSettings] Section "${trimmedInput}" already exists`)
        // Could show a toast notification here in the future
      }
    }
  }

  const handleTagSelect = (tag: string) => {
    setNewTagInput(tag)
    setTagSuggestions([])
    
    // Check if section already exists before auto-adding
    const exists = settings.tagSections.some(section => 
      section.title.toLowerCase() === tag.toLowerCase() ||
      section.tags.some(t => t.toLowerCase() === tag.toLowerCase())
    )
    
    if (!exists) {
      // Auto-add the selected tag
      addTagSection({
        title: tag,
        tags: [tag],
        enabled: true
      })
      setNewTagInput('')
    } else {
      console.log(`[HomepageSettings] Section "${tag}" already exists`)
      // Keep the tag in the input so user can see it exists
    }
  }

  const handleInputFocus = () => {
    if (newTagInput.length === 0) {
      setTagSuggestions(popularSuggestions)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTag()
      setTagSuggestions([]) // Clear suggestions on Enter
    }
  }

  if (!isVisible) {
    return (
      <button
        onClick={onToggle}
        className="fixed top-20 right-6 z-40 bg-primary/10 hover:bg-primary/20 border border-primary/20 backdrop-blur-sm rounded-xl p-3 transition-all duration-200"
        title="Homepage Settings"
      >
        <Settings className="h-5 w-5 text-primary" />
      </button>
    )
  }

  return (
    <div className="sticky top-16 z-40 mb-6">
      <div className="bg-primary/10 border border-primary/20 backdrop-blur-sm rounded-xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">Homepage Settings</h2>
          <button
            onClick={onToggle}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <p className="text-sm text-muted-foreground mb-4">
          Add or remove tag sections from your custom homepage. Try popular tags like "wolf", "cat", "dragon", or any artist names.
        </p>

        <div className="relative mb-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                type="text"
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyPress={handleKeyPress}
                onFocus={handleInputFocus}
                placeholder="Add a tag section (e.g., 'wolf')"
                className="bg-background/50 text-foreground pr-8"
              />
              {isTagLoading && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                </div>
              )}
              <TagSuggestions 
                suggestions={tagSuggestions}
                onSelect={handleTagSelect}
                loading={isTagLoading}
                onClickOutside={() => setTagSuggestions([])}
                inputRef={inputRef}
              />
            </div>
            <Button 
              onClick={handleAddTag}
              disabled={!newTagInput.trim() || settings.tagSections.some(section => 
                section.title.toLowerCase() === newTagInput.trim().toLowerCase() ||
                section.tags.some(tag => tag.toLowerCase() === newTagInput.trim().toLowerCase())
              )}
              className="bg-primary hover:bg-primary/90 disabled:opacity-50"
            >
              {settings.tagSections.some(section => 
                section.title.toLowerCase() === newTagInput.trim().toLowerCase() ||
                section.tags.some(tag => tag.toLowerCase() === newTagInput.trim().toLowerCase())
              ) ? 'Exists' : 'Add'}
            </Button>
          </div>
        </div>

        {settings.tagSections.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {settings.tagSections.map((section) => (
              <div
                key={section.id}
                className="flex items-center gap-2 bg-background/50 border border-border/50 rounded-lg px-3 py-1.5 text-sm"
              >
                <span className="text-foreground font-medium">{section.title}</span>
                <button
                  onClick={() => removeTagSection(section.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}