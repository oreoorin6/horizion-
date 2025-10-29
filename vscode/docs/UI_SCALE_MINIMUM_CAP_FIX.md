# UI Scale Minimum Cap Fix

## Problem
When using the UI Scale slider in settings, users could reduce the interface scale down to 10%, which made the UI so small that it became impossible to interact with or navigate back to settings to fix it.

## Solution
Added a **70% minimum cap** to the UI scale setting to ensure the interface always remains usable.

## Changes Made

### 1. Updated `useUIScale.ts` Hook
**File**: `src/hooks/useUIScale.ts`

- Changed minimum scale from **10%** to **70%**
- Updated interface comment: `scale: number; // 70-300 (percentage)`
- Updated validation in `updateScale()`: `Math.max(70, Math.min(300, scale))`

### 2. Updated Settings Modal UI
**File**: `src/components/SettingsModal.tsx`

- Changed slider minimum from **10** to **70**
- Updated label text from "10%" to "70%"
- Slider now ranges: **70% - 300%** (was 10% - 300%)

## Benefits

### ✅ Prevents Unusable UI
- Users can no longer make the interface too small to interact with
- 70% is small enough for power users who want more screen space
- 70% is large enough to remain fully functional and readable

### ✅ Better User Experience
- Prevents accidental "soft-locking" at extremely small scales
- No need to manually edit localStorage to recover from too-small UI
- Settings remain accessible at all valid scale levels

### ✅ Reasonable Range
- **70%** - Minimum (compact but usable)
- **100%** - Default (standard size)
- **300%** - Maximum (for accessibility/large displays)

## Technical Details

### Scale Validation
```typescript
// In useUIScale.ts
const clampedScale = Math.max(70, Math.min(300, scale))
```

The scale value is **clamped** between 70 and 300:
- Values below 70 are forced to 70
- Values above 300 are forced to 300
- Protects both UI and slider from invalid values

### Slider Configuration
```tsx
<input
  type="range"
  min="70"     // Changed from 10
  max="300"
  step="5"
  value={uiScaleSettings.scale}
  onChange={(e) => updateScale(parseInt(e.target.value))}
/>
```

### Backwards Compatibility
If a user has an old scale value saved in localStorage (e.g., from when 10% was allowed):
- The hook will automatically clamp it to 70% on load
- No manual intervention needed
- Settings persist correctly at the new minimum

## Files Modified
- ✅ `src/hooks/useUIScale.ts` - Updated min from 10 to 70
- ✅ `src/components/SettingsModal.tsx` - Updated slider min from 10 to 70

## Testing Checklist
- [x] Slider minimum is now 70%
- [x] Cannot drag slider below 70%
- [x] Old saved values < 70% get clamped to 70% on load
- [x] UI remains fully functional at 70% scale
- [x] All buttons, text, and controls are accessible
- [x] No TypeScript errors
- [x] Settings persist correctly

## Scale Recommendations

| Scale | Use Case |
|-------|----------|
| 70% | Power users wanting maximum screen space |
| 80-90% | Compact UI for smaller screens |
| 100% | Default, balanced for most users |
| 110-130% | Slightly larger for comfort |
| 150-200% | Accessibility, vision impairment |
| 200-300% | Large displays, presentations, extreme accessibility |

## Recovery Information
**Previous Issue**: If users set scale to 10-69%, they couldn't interact with the UI to fix it.

**Previous Workaround**:
```javascript
// Had to manually edit localStorage in browser console
localStorage.setItem('e621-ui-scale', JSON.stringify({ scale: 100 }))
location.reload()
```

**Now**: Not needed! The minimum cap prevents getting stuck.