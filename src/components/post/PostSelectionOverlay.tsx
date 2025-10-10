'use client';

import React from 'react';
import { CheckSquare } from 'lucide-react';
import { useDownloadManager } from '../../lib/download-manager';
import { E621Post } from '../../lib/api/e621/types';

interface PostSelectionOverlayProps {
  post: E621Post;
}

export default function PostSelectionOverlay({ post }: PostSelectionOverlayProps) {
  const { selectPost, deselectPost, isPostSelected } = useDownloadManager();
  const isSelected = isPostSelected(post.id);
  
  const handleToggleSelection = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isSelected) {
      deselectPost(post.id);
    } else {
      selectPost(post.id);
    }
  };
  
  // Always show the selection checkbox
  return (
    <div 
      className="absolute top-2 right-2 z-20"
      onClick={handleToggleSelection}
    >
      <div 
        className={`
          h-6 w-6 rounded border cursor-pointer flex items-center justify-center
          transition-colors duration-200
          ${isSelected 
            ? 'bg-primary border-primary text-primary-foreground' 
            : 'bg-background/80 border-accent hover:bg-accent/20 backdrop-blur-sm'}
        `}
      >
        {isSelected && <CheckSquare size={14} />}
      </div>
    </div>
  );
}