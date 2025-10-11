'use client';

import React, { useState } from 'react';
import { getImageUrl } from '@/lib/api/e621/utils';
import { E621Post } from '@/lib/api/e621/types';
import { PlaySquare } from 'lucide-react';
import { refreshImageElement } from '@/lib/utils';
import PostSelectionOverlay from './post/PostSelectionOverlay';
import { BlacklistedPostCover } from '@/components/BlacklistedPostCover';
import { useBlacklist } from '@/hooks/useBlacklist';

interface PostCardProps {
  post: E621Post;
  onClick?: (post: E621Post) => void;
}

export default function PostCard({ post, onClick }: PostCardProps) {
  const [imageError, setImageError] = useState(false);
  const [blacklistRevealed, setBlacklistRevealed] = useState(false);
  
  const { settings, isPostBlacklisted } = useBlacklist();

  // Check if post is blacklisted
  const allTags = post.tags ? [
    ...post.tags.general,
    ...post.tags.species,
    ...post.tags.character,
    ...post.tags.copyright,
    ...post.tags.artist,
    ...post.tags.invalid,
    ...post.tags.lore,
    ...post.tags.meta,
  ] : [];
  
  const blacklistResult = isPostBlacklisted(allTags, post.rating);

  // Get the best available preview image
  const previewUrl = getImageUrl(post, 'preview');
  
  const isVideo = post.file?.ext === 'webm' || post.file?.ext === 'mp4' || post.file?.ext === 'gif';

  // Handle image click
  const handleClick = () => {
    if (onClick) onClick(post);
  };

  // Handle blacklist reveal
  const handleBlacklistReveal = () => {
    setBlacklistRevealed(true);
  };

  // Handle image error - avoid setState to prevent infinite re-renders
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.error(`Image load error for post ${post.id}:`, e);
    
    const img = e.currentTarget;
    
    // Prevent multiple error handlers on the same image
    if (img.dataset.errorHandled === 'true') return;
    img.dataset.errorHandled = 'true';
    
    // Get parent element to add error message
    const parent = img.parentElement;
    if (!parent) return;
    
    // Create error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-container absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-white text-center p-2';
    errorDiv.innerHTML = `
      <p class="text-xs mb-2">Failed to load image</p>
      <button class="text-xs bg-primary/90 hover:bg-primary px-2 py-1 rounded-md">Refresh</button>
    `;
    parent.appendChild(errorDiv);
    
    // Add click handler to refresh button
    const refreshButton = errorDiv.querySelector('button');
    if (refreshButton) {
      refreshButton.addEventListener('click', (e) => {
        e.stopPropagation(); // Don't trigger card click
        errorDiv.remove();
        img.dataset.errorHandled = 'false'; // Reset error flag
        if (previewUrl) {
          refreshImageElement(img, previewUrl, post.id);
        }
      });
    }
    
    // Hide the image to show the error message clearly
    img.style.display = 'none';
  };

  // If post is blacklisted and we're in cover mode, show the blacklist cover
  if (blacklistResult.blocked && settings.mode === 'cover' && !blacklistRevealed) {
    return (
      <div 
        className="aspect-square"
        onClick={(e) => {
          e.stopPropagation(); // Prevent triggering parent click handlers
        }}
      >
        <BlacklistedPostCover
          post={post}
          matchedEntries={blacklistResult.matchedEntries}
          showBlockedTags={settings.showBlockedTags}
          onReveal={handleBlacklistReveal}
          className="aspect-square cursor-pointer"
        />
      </div>
    );
  }

  // If post is blacklisted and we're in hide mode, don't render anything
  // (This should be handled by the search API, but this is a fallback)
  if (blacklistResult.blocked && settings.mode === 'hide' && !blacklistRevealed) {
    return null;
  }

  return (
    <div 
      className="relative overflow-hidden rounded-xl bg-card shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer aspect-square"
      onClick={handleClick}
    >
      <div className="absolute inset-0 bg-background/20"></div>
      
      {/* Selection Overlay */}
      <PostSelectionOverlay post={post} />
      
      {/* Video Indicator */}
      {isVideo && (
        <div className="absolute top-2 right-2 bg-black/60 p-1 rounded-md">
          <PlaySquare className="h-4 w-4 text-white" />
        </div>
      )}
      
      {/* Safety Rating Indicator */}
      <div className="absolute top-2 left-2">
        <div className={`h-3 w-3 rounded-full ${
          post.rating === 's' ? 'bg-green-500' : 
          post.rating === 'q' ? 'bg-yellow-500' : 
          'bg-red-500'
        }`} />
      </div>
      
      {/* Blacklist revealed indicator (subtle) */}
      {blacklistResult.blocked && blacklistRevealed && (
        <div className="absolute bottom-2 left-2 bg-orange-500/80 px-2 py-1 rounded text-xs text-white">
          Revealed
        </div>
      )}
      
      {previewUrl ? (
        <img
          src={previewUrl}
          alt={`Post ${post.id}`}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={handleImageError}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500">
          <div className="text-center">
            <p className="text-xs">No preview</p>
            <p className="text-xs">available</p>
          </div>
        </div>
      )}
    </div>
  );
}