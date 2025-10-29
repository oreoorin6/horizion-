# Search-Based Navigation Enhancement

## Overview
Enhanced the PostDetailModal navigation to follow search results instead of just post ID sequence. This provides a much more intuitive browsing experience that matches user expectations.

## Changes Made

### 1. Removed Image Brightness Hover
- **Before**: Image had `hover:brightness-110` effect when hovered
- **After**: Clean image display without brightness changes
- **Reason**: User feedback that brightness effect was distracting

### 2. Search-Context Navigation
- **Before**: Navigation used e621 API `/posts/{id}/show_seq.json` to get adjacent posts by ID
- **After**: Navigation follows the current search results array
- **Fallback**: Still uses API navigation when no search context is available

## Technical Implementation

### Interface Updates
```typescript
interface PostDetailModalProps {
  post: E621Post | null
  onClose: () => void
  onNavigate?: (post: E621Post) => void
  posts?: E621Post[]        // NEW: Array of current search results
  currentIndex?: number     // NEW: Index of current post in results
}
```

### Navigation Logic
```typescript
// Search-based navigation (preferred)
if (posts && typeof currentIndex === 'number' && currentIndex < posts.length - 1) {
  const nextPost = posts[currentIndex + 1];
  onNavigate(nextPost);
}
// API-based navigation (fallback)
else if (e621api) {
  const nextPost = await e621api.getAdjacentPost(post.id, 'next');
  if (nextPost) onNavigate(nextPost);
}
```

### Smart Navigation Detection
- **Search Page**: Uses search results array for navigation
- **Homepage**: Falls back to API navigation (multiple sections complexity)
- **Tooltips**: Update to reflect navigation type
- **Position Indicator**: Shows "X of Y" when using search results

## User Experience Benefits

### Search Results Navigation
- **Predictable**: Navigate through your actual search results
- **Fast**: No API calls needed, instant navigation
- **Contextual**: Stay within your current search scope
- **Visual Feedback**: Shows position in results (e.g., "3 of 50")

### Fallback Behavior
- **Homepage**: Still works with API navigation for mixed content
- **Direct Links**: API navigation when no search context exists
- **Error Handling**: Graceful fallback if search data is unavailable

## Visual Indicators

### Navigation Type Display
- **Search Results**: Shows "X of Y" indicator in bottom-right
- **API Navigation**: No position indicator (unknown total)
- **Tooltips**: Different text for search vs. API navigation
  - Search: "Next in search results (→)"
  - API: "Next post (→)"

### Clean Image Display
- **No Hover Effects**: Removed distracting brightness changes
- **Click Indication**: Maintains pointer cursor for fullscreen
- **Focus on Content**: Clean, unmodified image presentation

## Implementation Details

### Search Page Integration
- **Posts Array**: Passes current search results to modal
- **Index Calculation**: `posts.findIndex(p => p.id === selectedPost.id)`
- **Real-time Updates**: Index recalculated when selectedPost changes

### Homepage Behavior
- **API Fallback**: Uses empty posts array to trigger API navigation
- **Multiple Sections**: Complex to implement search navigation across sections
- **Future Enhancement**: Could be improved to track section context

## Performance Benefits

### Reduced API Calls
- **Search Context**: Zero API calls for navigation within results
- **Instant Response**: Immediate navigation without loading states
- **Better UX**: No waiting for network requests

### Smart Loading
- **Context Detection**: Only uses API when necessary
- **Efficient Fallback**: Maintains functionality in all scenarios
- **Error Resilience**: Works even if search context is lost

## User Workflow Example

1. **Search for "wolf"** → Get 50 results
2. **Click post #15** → Modal opens
3. **Click Next** → Navigate to post #16 in search results (instant)
4. **Continue browsing** → Stay within your search context
5. **Position tracking** → Always know where you are (16 of 50)

This enhancement makes navigation much more intuitive and matches how users expect to browse through their search results, while maintaining backward compatibility for other use cases.