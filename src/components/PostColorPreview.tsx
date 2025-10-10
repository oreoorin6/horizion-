'use client'

import { useState } from 'react'
import ColorPicker from '@/components/ui/color-picker'

interface PostColorPreviewProps {
  post?: {
    id: number
    bg_color: string | null
    preview: {
      url: string | null
      width: number
      height: number
    }
  }
}

export default function PostColorPreview({ post }: PostColorPreviewProps) {
  const [bgColor, setBgColor] = useState(post?.bg_color || '#000000')
  const [isEditing, setIsEditing] = useState(false)

  // Mock post data for demo
  const mockPost = post || {
    id: 1234567,
    bg_color: bgColor,
    preview: {
      url: null, // We'll show a placeholder
      width: 150,
      height: 150
    }
  }

  return (
    <div className="max-w-md mx-auto space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-foreground mb-2">Post Background Color Demo</h3>
        <p className="text-sm text-muted-foreground">
          This demonstrates how posts can have custom background colors (Janitor+ feature from e621 API)
        </p>
      </div>

      {/* Post Preview */}
      <div className="p-4 rounded-2xl border border-border/50 shadow-sm">
        <div 
          className="aspect-square rounded-xl border border-border shadow-sm overflow-hidden transition-colors duration-300"
          style={{ backgroundColor: bgColor }}
        >
          <div className="w-full h-full flex items-center justify-center">
            {mockPost.preview.url ? (
              <img 
                src={mockPost.preview.url} 
                alt={`Post ${mockPost.id}`}
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <div className="text-center p-4">
                <div className="w-16 h-16 mx-auto mb-3 rounded-lg bg-muted/30 flex items-center justify-center">
                  <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-sm text-muted-foreground">Post Preview</p>
                <p className="text-xs text-muted-foreground">ID: {mockPost.id}</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Post Info */}
        <div className="mt-3 text-center">
          <p className="text-sm font-medium text-foreground">Post #{mockPost.id}</p>
          <p className="text-xs text-muted-foreground">
            Background: {bgColor || 'None'}
          </p>
        </div>
      </div>

      {/* Color Picker Controls */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">Post Background Color</span>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="text-xs text-primary hover:text-primary/80 transition-colors"
          >
            {isEditing ? 'Done' : 'Edit'}
          </button>
        </div>

        {isEditing && (
          <div className="space-y-4">
            <ColorPicker
              value={bgColor}
              onChange={setBgColor}
              label="Choose Background Color"
            />
            
            <div className="flex space-x-2">
              <button
                onClick={() => setBgColor('#000000')}
                className="px-3 py-2 text-xs font-medium rounded-lg bg-muted hover:bg-muted/80 transition-colors"
              >
                Reset to Black
              </button>
              <button
                onClick={() => setBgColor('#ffffff')}
                className="px-3 py-2 text-xs font-medium rounded-lg bg-muted hover:bg-muted/80 transition-colors"
              >
                White
              </button>
              <button
                onClick={() => setBgColor('#transparent')}
                className="px-3 py-2 text-xs font-medium rounded-lg bg-muted hover:bg-muted/80 transition-colors"
              >
                Clear
              </button>
            </div>

            <div className="p-3 rounded-lg bg-muted/50 border border-border/30">
              <p className="text-xs text-muted-foreground">
                <strong>API Integration:</strong> In a real implementation, this would call{' '}
                <code className="text-primary">updatePostBackgroundColor()</code> to save the color to e621.
                This feature requires Janitor+ permissions.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}