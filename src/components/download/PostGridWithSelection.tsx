'use client';

import React, { useEffect } from 'react';
import { E621Post } from '../../lib/api/e621/types';
import { useDownloadManager } from '../../lib/download-manager';
import SelectionModeControls from './SelectionModeControls';
import PostDownloadButton from './PostDownloadButton';

interface PostGridWithSelectionProps {
  posts: E621Post[];
  children: React.ReactNode;
}

export default function PostGridWithSelection({
  posts,
  children
}: PostGridWithSelectionProps) {
  const { state, deselectAllPosts, downloadSelectedPosts } = useDownloadManager();
  const { active: selectionModeActive } = state.selection;
  
  // Clean up selection mode when unmounting
  useEffect(() => {
    return () => {
      if (selectionModeActive) {
        deselectAllPosts();
      }
    };
  }, []); // Remove dependencies to prevent infinite loop
  
  const handleDownloadSelected = () => {
    downloadSelectedPosts(posts);
  };
  
  return (
    <div className="relative">
      {children}
      
      {selectionModeActive && (
        <SelectionModeControls
          posts={posts}
          onSelectAll={() => {}}
          onDownloadSelected={handleDownloadSelected}
          onCancel={deselectAllPosts}
        />
      )}
    </div>
  );
}