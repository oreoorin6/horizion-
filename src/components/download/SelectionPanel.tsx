'use client';

import React, { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Download, ChevronDown, X, Check } from 'lucide-react';
import { useDownloadManager } from '../../lib/download-manager';
import { DownloadQuality } from '../../lib/download-manager/types';
import { E621Post } from '../../lib/api/e621/types';

interface SelectionPanelProps {
  posts: E621Post[];
}

export default function SelectionPanel({ posts }: SelectionPanelProps) {
  const { 
    state, 
    downloadSelectedPosts, 
    deselectAllPosts, 
    selectAllPosts 
  } = useDownloadManager();
  
  const [showQualityDropdown, setShowQualityDropdown] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const selectedCount = state.selection.selectedPosts.length;
  
  // Don't show panel if no posts are selected
  if (selectedCount === 0) return null;
  
  const handleDownload = (quality?: DownloadQuality) => {
    setIsDownloading(true);
    downloadSelectedPosts(posts, quality);
    setShowQualityDropdown(false);
    
    // Reset state after delay
    setTimeout(() => {
      setIsDownloading(false);
    }, 2000);
  };
  
  const handleSelectAll = () => {
    const allPostIds = posts.map(post => post.id);
    selectAllPosts(allPostIds);
  };
  
  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-background/95 backdrop-blur-lg border border-accent rounded-xl shadow-lg p-4 min-w-80">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-center">
                <Check className="h-4 w-4 text-primary" />
              </div>
              <span className="font-medium">
                {selectedCount} post{selectedCount !== 1 ? 's' : ''} selected
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              className="text-xs"
            >
              Select All ({posts.length})
            </Button>
            
            <div className="relative">
              <div className="flex">
                <Button
                  onClick={() => handleDownload()}
                  disabled={isDownloading}
                  className="rounded-r-none px-3"
                  size="sm"
                >
                  <Download size={14} className="mr-1" />
                  {isDownloading ? 'Downloading...' : 'Download'}
                </Button>
                <Button
                  onClick={() => setShowQualityDropdown(!showQualityDropdown)}
                  disabled={isDownloading}
                  className="border-l-0 rounded-l-none px-2"
                  size="sm"
                >
                  <ChevronDown size={14} />
                </Button>
              </div>
              
              {showQualityDropdown && (
                <div className="absolute bottom-full mb-1 right-0 bg-background border border-accent rounded-md shadow-lg z-20">
                  <div className="py-1">
                    <button
                      className="w-full text-left px-4 py-2 text-sm hover:bg-accent/50"
                      onClick={() => handleDownload('original')}
                    >
                      Original Quality
                    </button>
                    <button
                      className="w-full text-left px-4 py-2 text-sm hover:bg-accent/50"
                      onClick={() => handleDownload('sample')}
                    >
                      Sample Quality
                    </button>
                    <button
                      className="w-full text-left px-4 py-2 text-sm hover:bg-accent/50"
                      onClick={() => handleDownload('preview')}
                    >
                      Preview Quality
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={deselectAllPosts}
              className="h-8 w-8"
            >
              <X size={14} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}