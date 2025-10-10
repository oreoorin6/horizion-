'use client'

import { useState, useEffect } from 'react'
import { useApiSearch } from '@/context/ApiSearchProvider'

interface RatingFilterProps {
  onFilterChange?: (ratings: ("q" | "s" | "e")[]) => void
}

export default function RatingFilter({ onFilterChange }: RatingFilterProps) {
  const { settings, updateSettings, searchQuery, handleSearch } = useApiSearch()
  
  // Track which ratings are ENABLED (visible)
  const [enabledRatings, setEnabledRatings] = useState<("q" | "s" | "e")[]>(
    settings.defaultRatings || ['s', 'q', 'e']
  )
  
  // Ensure the initial state matches the current settings
  useEffect(() => {
    setEnabledRatings(settings.defaultRatings || ['s', 'q', 'e'])
  }, [settings.defaultRatings])
  
  // Filter labels and values
  const ratingOptions = [
    { value: 's' as const, label: 'Safe', color: 'bg-green-500' },
    { value: 'q' as const, label: 'Questionable', color: 'bg-yellow-500' },
    { value: 'e' as const, label: 'Explicit', color: 'bg-red-500' }
  ]
  
  // Common filter presets - now the ratings array represents what should be SHOWN
  const presets = [
    { label: 'Safe only', ratings: ['s'], color: 'bg-green-500' },
    { label: 'SQ', ratings: ['s', 'q'], color: 'bg-yellow-500' },
    { label: 'All', ratings: ['s', 'q', 'e'], color: 'bg-purple-500' }
  ]  // No longer needed - removed safe mode toggle
  
  // Apply a preset filter
  const applyPreset = (ratings: ("q" | "s" | "e")[]) => {
    // Update local state
    setEnabledRatings(ratings)
    
    // Update global settings
    updateSettings({ defaultRatings: ratings })
    
    // Call the callback if provided
    if (onFilterChange) {
      onFilterChange(ratings)
    }
    
    // Always force a search refresh with the current query
    // The timeout ensures state updates have propagated
    console.log(`[RatingFilter] Applied preset: ${ratings.join(', ')}, refreshing search with query: "${searchQuery}"`)
    setTimeout(() => {
      if (searchQuery) {
        handleSearch(searchQuery)
      } else {
        // If there's no explicit search query, try with a default
        handleSearch("*")
      }
    }, 50)
  }
  
  // Check if a rating is currently enabled/visible
  const isEnabled = (rating: "q" | "s" | "e") => {
    return enabledRatings.includes(rating)
  }
  
  // Load initial dropdown state from localStorage, defaulting to closed
  const loadDropdownState = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('e621-rating-dropdown-state')
      return saved === 'open'
    }
    return false
  }
  
  // Add state to track if custom dropdown is open
  const [showCustom, setShowCustom] = useState(loadDropdownState())
  
  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Content:</span>
        <div className="flex space-x-1">
          {/* Presets */}
          {presets.map(preset => (
            <button
              type="button"
              key={preset.label}
              onClick={(e) => {
                e.preventDefault();
                console.log(`[RatingFilter] Preset ${preset.label} clicked, applying preset...`);
                
                // Update settings first
                setEnabledRatings(preset.ratings as ("q" | "s" | "e")[]);
                updateSettings({ defaultRatings: preset.ratings as ("q" | "s" | "e")[] });
                
                // Create a direct search URL that explicitly includes the rating parameters
                if (typeof window !== 'undefined') {
                  // Create the rating parameter based on exclusion
                  const allRatings = ['s', 'q', 'e'];
                  const excludedRatings = allRatings.filter(r => !preset.ratings.includes(r));
                  
                  // Get the base query without any existing rating filters
                  let baseQuery = searchQuery || '';
                  baseQuery = baseQuery.replace(/\s*-rating:\w\s*/g, ' ').trim();
                  
                  // Add the rating exclusion tags directly to the query string
                  let finalQuery = baseQuery;
                  if (excludedRatings.length > 0 && preset.ratings.length < 3) {
                    const ratingExclusions = excludedRatings.map(r => `-rating:${r}`).join(' ');
                    finalQuery = baseQuery ? `${baseQuery} ${ratingExclusions}` : ratingExclusions;
                  }
                  
                  console.log(`[RatingFilter] Modified query with explicit ratings: "${finalQuery}"`);
                  
                  // Navigate to the search page with the modified query
                  const url = new URL('/search', window.location.origin);
                  url.searchParams.set('tags', finalQuery);
                  url.searchParams.set('page', '1');
                  url.searchParams.set('_ts', Date.now().toString());
                  
                  console.log(`[RatingFilter] Navigating to: ${url.toString()}`);
                  window.location.href = url.toString();
                }
              }}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors
                ${preset.ratings.every(r => enabledRatings.includes(r as any)) && 
                  preset.ratings.length === enabledRatings.length
                  ? `bg-opacity-100 text-white ${preset.color}`
                  : 'bg-gray-700 bg-opacity-50 text-gray-300'
                }`}
              title={`Show ${preset.label} content`}
            >
              {preset.label}
            </button>
          ))}
          
          {/* Custom Toggle Button - only toggles dropdown, doesn't change filters */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault(); // Prevent any default behavior
              const newState = !showCustom
              setShowCustom(newState); // Toggle dropdown visibility
              
              // Save dropdown state to localStorage
              if (typeof window !== 'undefined') {
                localStorage.setItem('e621-rating-dropdown-state', newState ? 'open' : 'closed')
              }
            }}
            className="px-2 py-1 rounded text-xs font-medium transition-colors bg-gray-700 hover:bg-gray-600 text-gray-200"
            title="Show custom filter options"
          >
            <div className="flex items-center gap-1">
              <span>Custom</span>
              <span className="text-xs">{showCustom ? '▲' : '▼'}</span>
            </div>
          </button>
        </div>
      </div>

      {/* Dropdown for Custom Filters */}
      {showCustom && (
        <div className="absolute z-10 mt-1 bg-gray-800 border border-gray-700 rounded shadow-lg p-3 right-0">
          <div className="mb-2 text-xs font-medium text-gray-400">Custom Filter</div>
          <div className="flex space-x-2">
            {ratingOptions.map(({ value, label, color }) => (
              <button
                type="button"
                key={value}
                onClick={(e) => {
                  e.preventDefault();
                  console.log(`[RatingFilter] Custom toggle for ${label} clicked.`);
                  
                  // Calculate the new enabled ratings
                  let newEnabledRatings: ("q" | "s" | "e")[];
                  
                  if (enabledRatings.includes(value)) {
                    // If currently enabled, disable it
                    newEnabledRatings = enabledRatings.filter(r => r !== value);
                  } else {
                    // If currently disabled, enable it
                    newEnabledRatings = [...enabledRatings, value];
                  }
                  
                  // Special case: if all ratings are disabled, show all content
                  if (newEnabledRatings.length === 0) {
                    newEnabledRatings = ['s', 'q', 'e']; 
                  }
                  
                  // Update local state and settings
                  setEnabledRatings(newEnabledRatings);
                  updateSettings({ defaultRatings: newEnabledRatings });
                  
                  // Use the same approach as presets - build a URL with explicit rating exclusions
                  if (typeof window !== 'undefined') {
                    // Create the rating parameter based on exclusion
                    const allRatings = ['s', 'q', 'e'] as ("q" | "s" | "e")[];
                    const excludedRatings = allRatings.filter(r => !newEnabledRatings.includes(r));
                    
                    // Get the base query without any existing rating filters
                    let baseQuery = searchQuery || '';
                    baseQuery = baseQuery.replace(/\s*-rating:\w\s*/g, ' ').trim();
                    
                    // Add the rating exclusion tags directly to the query string
                    let finalQuery = baseQuery;
                    if (excludedRatings.length > 0 && newEnabledRatings.length < 3) {
                      const ratingExclusions = excludedRatings.map(r => `-rating:${r}`).join(' ');
                      finalQuery = baseQuery ? `${baseQuery} ${ratingExclusions}` : ratingExclusions;
                    }
                    
                    console.log(`[RatingFilter] Modified query with explicit ratings: "${finalQuery}"`);
                    
                    // Navigate to the search page with the modified query
                    const url = new URL('/search', window.location.origin);
                    url.searchParams.set('tags', finalQuery);
                    url.searchParams.set('page', '1');
                    url.searchParams.set('_ts', Date.now().toString());
                    
                    console.log(`[RatingFilter] Navigating to: ${url.toString()}`);
                    window.location.href = url.toString();
                  }
                }}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors
                  ${isEnabled(value)
                    ? `bg-opacity-100 text-white ${color}`
                    : 'bg-gray-700 bg-opacity-50 text-gray-300'
                  }`}
                title={`${isEnabled(value) ? 'Content shown' : 'Content hidden'} for ${label} rating`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}