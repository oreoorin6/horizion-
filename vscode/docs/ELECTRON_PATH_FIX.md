# Electron file:// Protocol Path Fix

## Problem

When Electron loads the Next.js static export using the `file://` protocol, absolute paths like `/_next/static/...` don't work because they're interpreted as `file:///next/static/...` (root of the filesystem) instead of relative to the HTML file.

This causes:
- Blank white screen in production build
- "Loading..." stuck state
- Failed to load JS/CSS assets

## Solution

The fix involves two parts:

### 1. Post-Build Path Transformation (`fix-paths.js`)

After Next.js builds the static export, we run a script that:
- Scans all HTML files in the `out/` directory
- Replaces absolute paths (`/_next/...`) with relative paths (`./` _next/...` or `../_next/...`)
- Calculates the correct depth for nested pages (e.g., `/search/index.html` needs `../_next/`)

### 2. Build Script Integration

The `fix-paths.js` script is integrated into:
- **build.ps1** (PowerShell build script) - Step 2.5
- **build.bat** (Batch build script) - Step 2.5
- **quick-electron-build.ps1** (for manual use if needed)

## Implementation Details

### fix-paths.js
```javascript
// Calculates depth based on file location in out/ directory
const depth = relativePath.split(path.sep).length - 2;
const prefix = depth > 0 ? '../'.repeat(depth) : './';

// Replaces all /_next/ references
content = content.replace(/href="\/_next\//g, `href="${prefix}_next/`);
content = content.replace(/src="\/_next\//g, `src="${prefix}_next/`);
```

### Path Transformations

**Root level** (`out/index.html`):
- `/_next/static/...` → `./_next/static/...`

**Nested pages** (`out/search/index.html`):
- `/_next/static/...` → `../_next/static/...`

## Why This Happens

Next.js static exports are designed for web servers where absolute paths work correctly:
- Web server: `/next/static/file.js` → `http://example.com/_next/static/file.js` ✓
- Electron file: `/_next/static/file.js` → `file:///next/static/file.js` ✗

The `file://` protocol treats `/` as the filesystem root, not the app directory.

## Alternative Approaches Tried

❌ **`assetPrefix: './'` in next.config.js**: Doesn't work with App Router
❌ **Custom webpack config**: Too complex and breaks Next.js optimizations
❌ **Using a local server**: Unnecessary overhead and complexity

✅ **Post-build path transformation**: Simple, reliable, integrates cleanly

## Usage

The path fix is now automatic when using the build scripts:
```powershell
# PowerShell
.\build.ps1
# Select option [2] for production build

# Batch
build.bat
# Select option [2]
```

Manual fix if needed:
```bash
npm run build
node fix-paths.js
npx electron-builder --config electron-builder.yml
```

## Verification

After fix is applied, check `out/index.html`:
```html
<!-- Before fix -->
<script src="/_next/static/chunks/webpack-abc123.js"></script>

<!-- After fix -->
<script src="./_next/static/chunks/webpack-abc123.js"></script>
```

## References

- Next.js Static Export: https://nextjs.org/docs/app/building-your-application/deploying/static-exports
- Electron file:// Protocol: https://www.electronjs.org/docs/latest/api/protocol#protocolregisterfileprotocolscheme-handler
- Related Issue: https://github.com/vercel/next.js/issues/3335