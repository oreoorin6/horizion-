# E621 Horizon - Blacklist System

## Overview

The E621 Horizon blacklist system provides comprehensive content filtering with two display modes and full integration with E621's tagging system.

## Features

### 🛡️ Two Filtering Modes

**Cover Mode (Default)**
- Shows a stylish black cover with crossed-out eye icon
- Click "Show Anyway" to reveal the content
- Displays which tags triggered the blacklist
- Maintains visual consistency in grid layouts

**Hide Mode**
- Completely removes blacklisted content from search results
- Uses E621 API's negative tag filtering (`-tag`)
- More aggressive filtering for sensitive content

### 🏷️ Advanced Tag Filtering

**Supported Syntax:**
- `gore` - Hide posts with gore tag
- `male solo` - Hide posts with BOTH male AND solo tags
- `-rating:s` - Hide posts that are NOT safe-rated
- `young -rating:s` - Hide young characters except safe-rated
- `rating:explicit` - Hide all explicit content

**E621 Compatible:**
Uses the same blacklist syntax as E621's native system, supporting:
- Combined tags (space-separated)
- Negative tags (`-tag`)
- Rating filters (`rating:s/q/e`)
- Metatags (`user:artist`, `score:>100`)

### ⚙️ Management Interface

**Blacklist Settings Tab:**
- Add/edit/delete blacklist entries
- Enable/disable individual entries
- Tag auto-completion with suggestions
- Import/export blacklist configurations
- Real-time preview of blocked content

**Quick Controls:**
- Toggle individual blacklist entries
- Bulk enable/disable all entries
- Clear all blacklist data
- Reset to default blacklist

## Default Blacklist

The system ships with E621's default global blacklist:
- `gore` - Gore content
- `scat` - Scat content
- `watersports` - Watersports content
- `young -rating:s` - Young characters (non-safe)
- `loli` - Loli content
- `shota` - Shota content

## Usage

### Opening Settings
1. Click the settings icon in the top navigation
2. Navigate to the "Blacklist" tab
3. Configure your content filtering preferences

### Adding Blacklist Entries
1. Click "Add Entry" in the Blacklist settings
2. Enter tags using E621 syntax (space or comma separated)
3. Optionally name the entry for easier management
4. Click "Add Entry" to save

### Managing Entries
- **Enable/Disable**: Click the eye icon next to each entry
- **Edit**: Click the edit icon to modify tags or name
- **Delete**: Click the trash icon to remove permanently

### Switching Modes
- **Cover Mode**: Shows blacklisted content with a cover overlay
- **Hide Mode**: Completely removes blacklisted content from searches

## API Integration

### Search Filtering
When in "Hide Mode", blacklist entries are automatically converted to E621 API negative search terms:

```
User blacklist: ["gore", "scat", "male solo"]
API query: "your_search -gore -scat -(male solo)"
```

### Tag Validation
The system validates tags against E621's tag database and provides suggestions for:
- Typo corrections
- Popular alternatives
- Related tags
- Tag implications

## Advanced Features

### Context-Aware Filtering
The blacklist system understands E621's tag relationships:
- **Implications**: If you blacklist `canine`, it also blocks `wolf`, `fox`, etc.
- **Aliases**: Automatically handles tag synonyms
- **Categories**: Filters by tag type (artist, character, species, etc.)

### Performance Optimization
- **Client-side filtering**: Cover mode uses local filtering for instant results
- **API-level filtering**: Hide mode pushes filtering to E621's servers
- **Caching**: Blacklist rules are cached for faster processing
- **Debouncing**: Search queries are debounced to prevent API spam

### Privacy & Storage
- All blacklist data is stored locally in browser localStorage
- No blacklist data is sent to external servers
- Export/import functionality for backup and sharing
- Clear separation from E621 account settings

## Customization

### Custom Blacklist Entries
Create sophisticated filtering rules:

```
Complex Example:
Entry Name: "Unwanted Explicit Males"
Tags: "rating:explicit male solo -female"
Result: Hides explicit solo male content unless females are also present
```

### Bulk Management
- Import blacklist from text files
- Export current configuration
- Share blacklist configurations with others
- Reset to factory defaults

## Troubleshooting

### Blacklist Not Working
1. Verify tags are spelled correctly
2. Check if entry is enabled (eye icon should be green)
3. Ensure correct syntax (use underscores in multi-word tags)
4. Try refreshing the page

### Content Still Showing
1. Check if "Show Anyway" was clicked (in cover mode)
2. Verify the post actually has the blacklisted tags
3. Switch to "Hide Mode" for more aggressive filtering
4. Check for tag implications or aliases

### Performance Issues
1. Reduce number of complex blacklist entries
2. Use "Hide Mode" to push filtering to API
3. Clear browser cache and localStorage
4. Disable auto-complete suggestions if slow

## Technical Details

### Files Modified
- `src/hooks/useBlacklist.ts` - Core blacklist logic
- `src/components/BlacklistedPostCover.tsx` - Cover display component
- `src/components/BlacklistSettings.tsx` - Settings management UI
- `src/components/PostCard.tsx` - Integration with post display
- `src/hooks/useE621Search.ts` - API integration for hide mode

### Data Structure
```typescript
interface BlacklistEntry {
  id: string          // Unique identifier
  tags: string[]      // Array of tags to filter
  name?: string       // Optional display name
  enabled: boolean    // Whether entry is active
}

interface BlacklistSettings {
  entries: BlacklistEntry[]
  mode: 'cover' | 'hide'    // Display mode
  showBlockedTags: boolean  // Show which tags triggered block
}
```

### API Integration
The system integrates with E621's search API by converting blacklist entries to negative search terms when in "hide" mode, ensuring server-side filtering for optimal performance.
