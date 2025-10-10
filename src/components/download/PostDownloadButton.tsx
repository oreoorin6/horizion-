'use client';

import React, { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Download, ChevronDown, Check } from 'lucide-react';
import { E621Post } from '../../lib/api/e621/types';
import { useDownloadManager } from '../../lib/download-manager';
import { DownloadQuality } from '../../lib/download-manager/types';

interface PostDownloadButtonProps {
  post: E621Post;
  compact?: boolean;
  iconOnly?: boolean;
}

export default function PostDownloadButton({
  post,
  compact = false,
  iconOnly = false
}: PostDownloadButtonProps) {
  const { downloadPost } = useDownloadManager();
  const [showDropdown, setShowDropdown] = useState(false);
  const [downloadStarted, setDownloadStarted] = useState(false);
  
  const handleDownload = (quality?: DownloadQuality) => {
    downloadPost(post, quality);
    setDownloadStarted(true);
    setShowDropdown(false);
    
    // Reset the download started state after a delay
    setTimeout(() => {
      setDownloadStarted(false);
    }, 2000);
  };
  
  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };
  
  // Always render as both checkbox and download button
  return (
    <div className="flex items-center gap-2">
      <SelectionCheckbox post={post} />
      {iconOnly ? (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleDownload()}
          className="h-8 w-8"
        >
          {downloadStarted ? <Check size={16} /> : <Download size={16} />}
        </Button>
      ) : compact ? (
        <div className="relative">
          <div className="flex">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDownload()}
              className="px-2 h-7"
            >
              <Download size={14} className="mr-1" />
              {downloadStarted ? 'Added!' : 'Download'}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDropdown}
              className="h-7 w-7"
            >
              <ChevronDown size={14} />
            </Button>
          </div>
          
          {showDropdown && (
            <div className="absolute right-0 mt-1 bg-background border border-accent rounded-md shadow-lg z-20">
              <div className="py-1">
                <button
                  className="w-full text-left px-3 py-1 text-sm hover:bg-accent/50"
                  onClick={() => handleDownload('original')}
                >
                  Original
                </button>
                <button
                  className="w-full text-left px-3 py-1 text-sm hover:bg-accent/50"
                  onClick={() => handleDownload('sample')}
                >
                  Sample
                </button>
                <button
                  className="w-full text-left px-3 py-1 text-sm hover:bg-accent/50"
                  onClick={() => handleDownload('preview')}
                >
                  Preview
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="relative">
          <div className="flex">
            <Button
              variant="outline"
              onClick={() => handleDownload()}
              className="rounded-r-none"
            >
              <Download size={16} className="mr-2" />
              {downloadStarted ? 'Added to Downloads!' : 'Download'}
            </Button>
            <Button
              variant="outline"
              className="border-l-0 rounded-l-none px-2"
              onClick={toggleDropdown}
            >
              <ChevronDown size={16} />
            </Button>
          </div>
          
          {showDropdown && (
            <div className="absolute right-0 mt-1 bg-background border border-accent rounded-md shadow-lg z-20">
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
      )}
    </div>
  );
}

// Selection checkbox component
function SelectionCheckbox({ post }: { post: E621Post }) {
  const { selectPost, deselectPost, isPostSelected } = useDownloadManager();
  const selected = isPostSelected(post.id);
  
  const handleToggle = () => {
    if (selected) {
      deselectPost(post.id);
    } else {
      selectPost(post.id);
    }
  };
  
  return (
    <div 
      className={`
        h-6 w-6 rounded border cursor-pointer flex items-center justify-center
        ${selected 
          ? 'bg-primary border-primary text-primary-foreground' 
          : 'border-accent hover:bg-accent/20'}
      `}
      onClick={handleToggle}
    >
      {selected && <Check size={14} />}
    </div>
  );
}