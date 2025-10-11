'use client'

import { useSavedTags } from '@/hooks/useSavedTags'
import Link from 'next/link'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import AppHeader from '@/components/AppHeader'
import AuthWrapper from '@/components/AuthWrapper'
import SettingsModal from '@/components/SettingsModal'

export default function TagsPage() {
  const { savedTags, addTag, removeTag } = useSavedTags()
  const [newTag, setNewTag] = useState('')
  const [showSettings, setShowSettings] = useState(false)

  const handleAddTag = () => {
    if (newTag) {
      addTag(newTag)
      setNewTag('')
    }
  }

  return (
    <AuthWrapper>
      <div className="min-h-screen bg-background flex flex-col">
        <AppHeader onSettingsClick={() => setShowSettings(true)} />
        
        <main className="flex-1 px-6 py-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-8 text-foreground">Your Saved Tags</h1>

            <div className="flex gap-2 mb-6">
              <Input
                type="text"
                value={newTag}
                onChange={e => setNewTag(e.target.value)}
                placeholder="Add a new tag"
                onKeyDown={e => e.key === 'Enter' && handleAddTag()}
                className="bg-background text-foreground"
              />
              <Button onClick={handleAddTag}>Add Tag</Button>
            </div>

            <div className="space-y-3">
              {savedTags.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">You have no saved tags.</p>
              ) : (
                savedTags.map(tag => (
                  <div key={tag.id} className="flex items-center justify-between p-4 rounded-xl bg-background/50 border border-border/50 shadow-sm hover:shadow-md transition-all duration-200">
                    <Link 
                      href={`/search?tags=${encodeURIComponent(tag.name)}`} 
                      className="font-mono text-primary hover:text-primary/80 hover:underline text-lg font-medium"
                    >
                      {tag.name}
                    </Link>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => removeTag(tag.id)}
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      Remove
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </main>

        {/* Settings Modal */}
        <SettingsModal 
          isOpen={showSettings} 
          onClose={() => setShowSettings(false)} 
        />
      </div>
    </AuthWrapper>
  )
}
