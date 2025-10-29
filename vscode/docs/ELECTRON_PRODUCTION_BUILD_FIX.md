# Electron Production Build Fix

## Problem
When building the production Electron app, two major issues occurred:

1. **Pure White Screen** - The app window displayed only white when launched
   - Error: `Failed to load URL: file:///.../out/index.html with error: ERR_FILE_NOT_FOUND`
   - Root cause: Next.js wasn't exporting static files to `out/` directory

2. **Code Signing Errors** - Build process failed with symbolic link errors
   - Error: `Cannot create symbolic link : A required privilege is not held by the client`
   - Root cause: electron-builder trying to extract code signing tools without admin privileges

## Solution Overview

Fixed the production build by:
1. Configuring Next.js for static HTML export
2. Detecting Electron environment for direct API calls
3. Disabling unnecessary code signing
4. Adding background color to prevent white flash

## Changes Made

### 1. Next.js Configuration (`next.config.js`)

**Before:**
```javascript
const nextConfig = {
  distDir: 'dist',  // Conflicts with electron-builder
  // No static export configured
}
```

**After:**
```javascript
const nextConfig = {
  output: 'export',                // Export static HTML files
  distDir: '.next',                // Standard Next.js build directory
  outputFileTracingRoot: __dirname, // Silence lockfile warning
  trailingSlash: true,
  images: {
    unoptimized: true              // Required for static export
  }
}
```

**Why:** 
- `output: 'export'` tells Next.js to generate static HTML files in `out/` directory
- Electron needs actual HTML files to load, not a Next.js server
- `distDir: '.next'` prevents conflict with electron-builder's `dist/` output
- `outputFileTracingRoot` silences workspace root warning

### 2. E621 API Client (`src/lib/api/e621/index.ts`)

**Added Electron Detection:**
```typescript
// Detect if running in Electron
const isElectron = typeof window !== 'undefined' && 
  typeof (window as any).process !== 'undefined' && 
  (window as any).process.versions && 
  (window as any).process.versions.electron;

// Use direct API in Electron, proxy in browser
const API_BASE = typeof window !== 'undefined' && !isElectron
  ? '/api/proxy'           // Browser: needs proxy for CORS
  : 'https://e621.net';    // Electron: direct API (webSecurity disabled)
```

**Why:**
- In Electron, `webSecurity: false` allows direct API calls without CORS issues
- `/api/proxy` routes don't work with static export anyway
- Direct API calls are faster and more reliable in Electron

### 3. FurAffinity API Client (`src/lib/api/furaffinity/index.ts`)

**Same Electron detection logic applied:**
```typescript
const isElectron = typeof window !== 'undefined' && 
  typeof (window as any).process !== 'undefined' && 
  (window as any).process.versions && 
  (window as any).process.versions.electron;

const API_BASE = typeof window !== 'undefined' && !isElectron
  ? '/api/proxy-fa'
  : 'https://www.furaffinity.net';
```

### 4. Electron Main Window (`electron/main.js`)

**Added background color:**
```javascript
mainWindow = new BrowserWindow({
  // ... other options
  backgroundColor: '#1a1a1a' // Prevent white flash on load
})
```

**Why:** Prevents the brief white flash while the app loads

### 5. Package.json Build Configuration

**Updated electron-builder settings:**
```json
"build": {
  "win": {
    "target": "dir",              // Build unpacked app instead of installer
    "sign": false,                // Disable code signing
    "signingHashAlgorithms": []   // No signing algorithms needed
  },
  "forceCodeSigning": false       // Don't require code signing
}
```

**Why:**
- "target": "dir" builds unpacked app without creating installer
- Disabling code signing prevents the symbolic link errors
- Code signing requires Windows Developer license anyway

## Technical Details

### Static Export vs Server Mode

| Mode | API Routes | Build Output | Electron Compatible |
|------|-----------|--------------|---------------------|
| Server (`output: undefined`) | ✅ Works | Server code | ❌ No (needs Node.js server) |
| Static (`output: 'export'`) | ❌ Disabled | HTML files | ✅ Yes (file:// protocol) |

**For Electron, static export is required** because:
- Electron loads files via `file://` protocol
- Can't run a Next.js development server in production
- Static files are self-contained and portable

### Electron Environment Detection

The Electron detection checks for:
```typescript
typeof window !== 'undefined'            // Running in browser context
(window as any).process.versions.electron // Electron version exists
```

This is reliable because:
- Regular browsers don't expose `process.versions.electron`
- Electron always exposes this in the renderer process
- Works even with `contextIsolation: true`

### CORS Handling

| Environment | CORS Solution |
|-------------|---------------|
| Web Browser | Use `/api/proxy` routes |
| Electron | Direct API calls (webSecurity: false) |
| SSR | Direct API calls (server-side) |

Electron can bypass CORS because:
- `webSecurity: false` disables same-origin policy
- File protocol has different security model
- We control the entire environment

## Build Process Flow

### Development (npm run dev)
1. Next.js dev server starts on port 3000
2. Electron launches and connects to localhost:3000
3. Hot reload works normally
4. API proxy routes work

### Production (npm run dist)
1. **Clean** - Remove old dist/, .next/, out/ folders
2. **Install** - `npm install` dependencies
3. **Build** - `next build` exports static HTML to `out/`
4. **Package** - electron-builder packages `out/` + Electron into `dist/`
5. **Output** - `dist/win-unpacked/E621 Horizon.exe`

### File Structure After Build
```
dist/
└── win-unpacked/
    ├── E621 Horizon.exe        # Main executable
    ├── resources/
    │   └── app.asar           # Contains out/ + electron/
    │       ├── out/           # Next.js static export
    │       │   ├── index.html
    │       │   └── ...
    │       └── electron/
    │           └── main.js
    └── [Electron runtime files]
```

## Testing Checklist

- [x] Production build completes without errors
- [x] App launches and shows content (not white screen)
- [x] Direct API calls work in Electron
- [x] All pages load correctly
- [x] Search functionality works
- [x] Image loading works
- [x] No CORS errors in console
- [x] No code signing errors during build
- [x] App is portable (can copy to another PC)

## Common Issues & Solutions

### Issue: White Screen
**Symptom:** App window is completely white
**Solution:** This fix addresses it by enabling static export

### Issue: ERR_FILE_NOT_FOUND
**Symptom:** Console shows "Failed to load URL: file:///.../out/index.html"
**Solution:** `output: 'export'` creates the out/ directory

### Issue: Code Signing Errors
**Symptom:** Build fails with symbolic link permission errors
**Solution:** Disabled code signing in package.json

### Issue: API Calls Fail
**Symptom:** 404 errors for /api/proxy routes
**Solution:** Electron detection bypasses proxy, uses direct API

### Files Modified

- ✅ `next.config.js` - Added static export configuration
- ✅ `src/lib/api/e621/index.ts` - Added Electron detection
- ✅ `src/lib/api/furaffinity/index.ts` - Added Electron detection
- ✅ `electron/main.js` - Added background color
- ✅ `package.json` - Updated electron-builder configuration
- ✅ `src/app/api/` - **Removed** (API routes not compatible with static export)

## Running the Production App

### After Building:
```powershell
# Navigate to build output
cd dist\win-unpacked

# Run the app
.\E621 Horizon.exe
```

### Or Let Script Run It:
When build completes, script asks:
```
Would you like to run the app now? (y/n): y
```

## Performance Notes

**Production Build Benefits:**
- 🚀 **Faster Startup** - No dev server overhead
- 📦 **Smaller Size** - Only bundled code included
- ⚡ **Direct API Calls** - No proxy latency in Electron
- 🔒 **Self-Contained** - All assets bundled

**Build Time:**
- Clean: ~1 second
- Install: ~1 second (if no changes)
- Next.js Build: ~5-10 seconds
- Electron Package: ~20-30 seconds
- **Total: ~30-45 seconds**

## Future Improvements

### Possible Enhancements:
1. **Create Installer** - Change `target: "dir"` to `target: "nsis"` for Windows installer
2. **Code Signing** - Get Windows Developer cert for signed builds
3. **Auto-Update** - Implement electron-updater for automatic updates
4. **Multiple Targets** - Build for portable + installer + zip
5. **Compression** - Enable ASAR compression for smaller builds

### For Code Signing:
Would need to:
1. Obtain Windows Developer Certificate (~$200/year)
2. Set `sign: true` in package.json
3. Configure certificate in environment variables
4. Run build with admin privileges (for symlinks)

## References

- [Next.js Static Export](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- [Electron Builder Configuration](https://www.electron.build/configuration/configuration)
- [Electron Security](https://www.electronjs.org/docs/latest/tutorial/security)