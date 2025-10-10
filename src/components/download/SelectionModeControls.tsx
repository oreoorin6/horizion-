'use client';

import React from 'react';
import { Button } from '../../components/ui/button';
import { useDownloadManager } from '../../lib/download-manager';
import { E621Post } from '../../lib/api/e621/types';

interface SelectionModeControlsProps {
  posts: E621Post[];
  onSelectAll: () => void;
  onDownloadSelected: () => void;
  onCancel: () => void;
}

export default function SelectionModeControls({
  posts,
  onSelectAll,
  onDownloadSelected,
  onCancel
}: SelectionModeControlsProps) {
  const { state, selectAllPosts, deselectAllPosts, invertSelection } = useDownloadManager();
  const { selectedPosts } = state.selection;
  
  // Handle select all posts on the current page
  const handleSelectAll = () => {
    const postIds = posts.map(post => post.id);
    selectAllPosts(postIds);
    onSelectAll && onSelectAll();
  };
  
  // Handle deselect all
  const handleDeselectAll = () => {
    deselectAllPosts();
  };
  
  // Handle invert selection
  const handleInvertSelection = () => {
    const postIds = posts.map(post => post.id);
    invertSelection(postIds);
  };
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-accent p-3 flex items-center justify-between z-50">
      <div className="flex items-center gap-2">
        <Button 
          variant="secondary" 
          size="sm"
          onClick={handleSelectAll}
        >
          Select All on Page
        </Button>
        <Button 
          variant="secondary" 
          size="sm"
          onClick={handleDeselectAll}
          disabled={selectedPosts.length === 0}
        >
          Deselect All
        </Button>
        <Button 
          variant="secondary" 
          size="sm"
          onClick={handleInvertSelection}
        >
          Invert Selection
        </Button>
        <span className="ml-4 text-sm">
          Selected: <span className="font-bold">{selectedPosts.length}</span> {selectedPosts.length === 1 ? 'post' : 'posts'}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button 
          variant="default" 
          size="sm"
          onClick={onDownloadSelected}
          disabled={selectedPosts.length === 0}
        >
          Download Selected
        </Button>
      </div>
    </div>
  );
}