'use client'

import { useSavedTags } from '@/hooks/useSavedTags'
import Link from 'next/link'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function TagsPage() {
  const { savedTags, addTag, removeTag } = useSavedTags()
  const [newTag, setNewTag] = useState('')

  const handleAddTag = () => {
    if (newTag) {
      addTag(newTag)
      setNewTag('')
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Your Saved Tags</h1>

      <div className="flex gap-2 mb-4">
        <Input
          type="text"
          value={newTag}
          onChange={e => setNewTag(e.target.value)}
          placeholder="Add a new tag"
          onKeyDown={e => e.key === 'Enter' && handleAddTag()}
        />
        <Button onClick={handleAddTag}>Add Tag</Button>
      </div>

      <div className="space-y-2">
        {savedTags.length === 0 ? (
          <p>You have no saved tags.</p>
        ) : (
          savedTags.map(tag => (
            <div key={tag.id} className="flex items-center justify-between p-2 rounded-md bg-gray-100 dark:bg-gray-800">
              <Link href={`/?tags=${encodeURIComponent(tag.name)}`} className="font-mono hover:underline">
                {tag.name}
              </Link>
              <Button variant="ghost" size="sm" onClick={() => removeTag(tag.id)}>
                Remove
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
