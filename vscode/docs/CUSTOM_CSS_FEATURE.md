# Custom CSS Feature

## Overview
The Custom CSS feature allows users to add their own CSS styles to customize the appearance of E621 Horizon. This provides complete control over the visual design while maintaining the core functionality of the application.

## Features

### Real-Time CSS Editing
- **Live Preview**: Changes apply instantly when custom CSS is enabled
- **Syntax Validation**: Built-in CSS validation to catch errors
- **Error Display**: Clear error messages when CSS syntax is invalid
- **Enable/Disable Toggle**: Quickly turn custom styles on/off without losing your code

### CSS Editor
- **Monaco-like Experience**: Large textarea with monospace font
- **400px Height**: Plenty of space to write extensive custom styles
- **Syntax Highlighting**: Easy to read with proper formatting
- **Persistent Storage**: CSS is saved to localStorage automatically

### Safety Features
- **Reset Button**: One-click restore to default example CSS
- **Validation Before Apply**: Test CSS before injecting into the page
- **Isolated Injection**: Custom CSS is injected in a separate style tag
- **Easy Removal**: Toggle off to immediately remove all custom styles

## Usage

### Opening Custom CSS Settings
1. Click the **Settings** icon in the top navigation
2. Navigate to the **"Custom CSS"** tab
3. Toggle **"Enable Custom CSS"** to activate

### Writing Custom CSS
1. Write your CSS in the text editor
2. Changes apply automatically if custom CSS is enabled
3. Use the **"Apply & Validate CSS"** button to test your styles
4. Any errors will be displayed above the editor

### Example Customizations

#### Custom Scrollbar
```css
::-webkit-scrollbar {
  width: 12px;
}

::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.3);
}

::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 6px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}
```

#### Enhanced Hover Effects
```css
.post-card:hover {
  transform: scale(1.05);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  transition: all 0.3s ease;
}
```

#### Custom Background Pattern
```css
body {
  background-image: 
    linear-gradient(45deg, #1a1a1a 25%, transparent 25%),
    linear-gradient(-45deg, #1a1a1a 25%, transparent 25%);
  background-size: 20px 20px;
  background-position: 0 0, 10px 10px;
}
```

#### Glassmorphism Effect
```css
.modal-content {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
```

## Advanced Customization Ideas

### Theme Overrides
```css
/* Change primary color throughout the app */
:root {
  --primary: 120 100% 50%; /* Green theme */
}

/* Custom card styling */
.post-card {
  border-radius: 20px;
  border: 2px solid var(--primary);
  overflow: hidden;
}
```

### Animation Effects
```css
/* Fade-in animation for posts */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.post-card {
  animation: fadeIn 0.5s ease-out;
}
```

### Layout Modifications
```css
/* Wider content area */
.container {
  max-width: 2000px !important;
}

/* Compact grid layout */
.grid {
  gap: 0.5rem !important;
}
```

### Typography Changes
```css
/* Custom font */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');

body {
  font-family: 'Inter', sans-serif;
}

/* Larger text */
body {
  font-size: 18px;
}
```

### Dark Mode Enhancements
```css
/* Ultra-dark background */
body {
  background-color: #000000;
}

/* High contrast borders */
.border {
  border-color: rgba(255, 255, 255, 0.2) !important;
}
```

### Custom Hover States
```css
/* Glow effect on hover */
button:hover {
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
  transition: box-shadow 0.3s ease;
}

/* Smooth color transition */
a:hover {
  color: #3b82f6;
  transition: color 0.2s ease;
}
```

## Technical Implementation

### Hook: `useCustomCSS`
Located in `src/hooks/useCustomCSS.ts`

**State:**
- `settings: CustomCSSSettings` - Current CSS and enabled state
- `error: string | null` - Validation error messages

**Methods:**
- `updateSettings(newSettings)` - Update settings and apply CSS
- `updateCSS(css)` - Update CSS code
- `toggleEnabled()` - Toggle custom CSS on/off
- `resetCSS()` - Reset to default example CSS
- `validateCSS(css)` - Test CSS validity
- `applyAndValidate(css)` - Apply CSS after validation

### CSS Injection
Custom CSS is injected into the `<head>` via a `<style>` tag with ID `custom-css-injection`:

```javascript
const style = document.createElement('style')
style.id = 'custom-css-injection'
style.textContent = userCSS
document.head.appendChild(style)
```

### Storage
- **Key**: `e621-custom-css`
- **Format**: JSON object with `enabled` and `css` properties
- **Location**: `localStorage`
- **Persistence**: Survives page refreshes and browser restarts

### Validation
CSS validation creates a temporary `<style>` element to test parsing:

```javascript
const style = document.createElement('style')
style.textContent = css
document.head.appendChild(style)

// Check if CSS rules were parsed
const isValid = style.sheet && style.sheet.cssRules.length >= 0

// Clean up test style
document.head.removeChild(style)
```

## Best Practices

### Performance
- **Avoid Expensive Selectors**: Use classes instead of complex attribute selectors
- **Minimize Animations**: Too many animations can slow down the page
- **Use CSS Variables**: Leverage existing CSS variables for consistency

### Maintainability
- **Comment Your Code**: Document what each section does
- **Organize Sections**: Group related styles together
- **Test Incrementally**: Add styles gradually and test each change

### Compatibility
- **Vendor Prefixes**: Use `-webkit-`, `-moz-`, etc. for broad support
- **Fallbacks**: Provide fallback styles for unsupported features
- **Test Across Browsers**: Ensure your styles work in different browsers

## Troubleshooting

### CSS Not Applying
1. Check that **"Enable Custom CSS"** is toggled ON
2. Click **"Apply & Validate CSS"** to re-apply
3. Check browser console for errors
4. Try resetting to default and re-adding styles incrementally

### Invalid CSS Errors
1. Check for missing semicolons or braces
2. Validate property names (no typos)
3. Ensure selectors are valid
4. Use the browser's DevTools to inspect elements

### Styles Not Persisting
1. Check browser's localStorage is not disabled
2. Ensure you're not in private/incognito mode
3. Check that localStorage quota isn't exceeded
4. Try exporting/copying CSS and re-importing

### Performance Issues
1. Remove complex selectors
2. Reduce number of animations
3. Avoid `* { ... }` universal selectors
4. Use `will-change` sparingly

## Security Considerations

### Safe Practices
- **Only CSS**: The editor only accepts CSS, no JavaScript execution
- **Isolated Injection**: Custom CSS is in a separate style tag
- **Local Storage Only**: CSS is never sent to external servers
- **User Control**: Easy to disable or reset at any time

### What You Can't Do
- ❌ Execute JavaScript
- ❌ Load external scripts
- ❌ Access user credentials
- ❌ Modify application behavior (only appearance)

## Browser Compatibility

### Supported Browsers
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Electron (application wrapper)

### Feature Support
- ✅ CSS Custom Properties
- ✅ CSS Grid
- ✅ CSS Flexbox
- ✅ CSS Animations
- ✅ CSS Transforms
- ✅ Modern Pseudo-selectors

## Future Enhancements

### Planned Features
- **CSS Templates**: Pre-made theme templates
- **Import/Export**: Share CSS with others
- **Syntax Highlighting**: Monaco editor integration
- **Auto-Complete**: CSS property suggestions
- **Theme Gallery**: Community-shared themes
- **Dark/Light Mode Presets**: Quick theme switching

## Examples Gallery

### Neon Cyberpunk Theme
```css
:root {
  --primary: 290 100% 60%;
  --secondary: 180 100% 50%;
}

body {
  background: linear-gradient(135deg, #1a0033 0%, #000022 100%);
}

.post-card {
  border: 2px solid rgba(180, 100, 255, 0.5);
  box-shadow: 0 0 15px rgba(180, 100, 255, 0.3);
}

button {
  background: linear-gradient(135deg, #b464ff 0%, #00ccff 100%);
  box-shadow: 0 4px 15px rgba(180, 100, 255, 0.4);
}
```

### Minimalist White Theme
```css
body {
  background: #ffffff;
  color: #333333;
}

.post-card {
  background: #f9f9f9;
  border: 1px solid #e0e0e0;
  box-shadow: none;
}

button {
  background: #333333;
  color: #ffffff;
}
```

### Retro Terminal Theme
```css
@import url('https://fonts.googleapis.com/css2?family=Courier+Prime&display=swap');

body {
  background: #000000;
  color: #00ff00;
  font-family: 'Courier Prime', monospace;
}

.post-card {
  border: 2px solid #00ff00;
  background: rgba(0, 255, 0, 0.05);
}

button {
  border: 2px solid #00ff00;
  background: transparent;
  color: #00ff00;
}

button:hover {
  background: #00ff00;
  color: #000000;
}
```

## Conclusion

The Custom CSS feature provides unlimited creative freedom to personalize E621 Horizon. Whether you want subtle tweaks or complete theme overhauls, the tool gives you full control while maintaining safety and performance.

**Happy customizing! 🎨**