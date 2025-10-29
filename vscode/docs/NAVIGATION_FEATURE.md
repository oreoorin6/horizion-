# Post Navigation Feature

## Overview
Added next/previous post navigation buttons to the PostDetailModal component, allowing users to navigate through adjacent posts in the sequence without closing the modal.

## Features

### Navigation Buttons
- **Left Arrow Button**: Navigate to previous post
- **Right Arrow Button**: Navigate to next post
- **Keyboard Support**: Use arrow keys (← →) to navigate
- **Loading States**: Buttons show loading spinner during API calls
- **Disabled State**: Buttons are disabled when no adjacent post exists

### API Integration
- Uses e621's `/posts/{id}/show_seq.json?seq=next|prev` endpoint
- Automatically checks for adjacent post availability
- Handles cases where no next/previous post exists (404 responses)

### User Experience
- **Seamless Navigation**: Stay in the modal while browsing posts
- **Visual Feedback**: Loading indicators and disabled states
- **Keyboard Shortcuts**: Arrow keys for quick navigation
- **Error Handling**: Graceful handling of API failures

## Technical Implementation

### New API Method
```typescript
public async getAdjacentPost(id: number, direction: 'next' | 'prev'): Promise<E621Post | null>
```

### Modal Props Update
```typescript
interface PostDetailModalProps {
  post: E621Post | null
  onClose: () => void
  onNavigate?: (post: E621Post) => void  // New optional prop
}
```

### Usage Example
```typescript
<PostDetailModal 
  post={selectedPost} 
  onClose={() => setSelectedPost(null)}
  onNavigate={(post) => setSelectedPost(post)}  // Enable navigation
/>
```

## Files Modified
- `src/lib/api/e621/index.ts` - Added `getAdjacentPost` method
- `src/lib/api/IApiClient.ts` - Updated IE621ApiClient interface
- `src/components/PostDetailModal.tsx` - Added navigation UI and logic
- `src/app/page.tsx` - Updated to support navigation
- `src/app/search/page.tsx` - Updated to support navigation

## How It Works

1. **Modal Opens**: Checks for adjacent posts using the e621 API
2. **Button State**: Enables/disables navigation buttons based on availability
3. **User Clicks**: Fetches the adjacent post and updates the modal content
4. **Keyboard Support**: Arrow keys trigger the same navigation functions
5. **Error Handling**: If API call fails, navigation gracefully handles the error

## Browser Safety
All API calls use the existing proxy pattern to avoid CORS issues when running in the browser environment.
