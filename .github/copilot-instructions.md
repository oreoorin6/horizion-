# E621 Horizon - AI Coding Agent Instructions

## Project Overview
E621 Horizon is a modern desktop application for browsing e621.net, built with Next.js 15, TypeScript, and Electron. The app provides a clean, responsive interface with advanced search capabilities, theme customization, user authentication, download management, and AI-powered image analysis.

## Architecture
- **Next.js 15** with App Router for frontend and API routes
- **React + TypeScript** for UI components with ShadCN/Radix UI
- **Electron** for cross-platform desktop packaging (Windows focus)
- **Context-based state management** with React hooks (no Redux/Zustand)
- **Browser-safe code** with SSR compatibility checks
- **API proxy pattern** to handle CORS via `/api/proxy` route

## Key Components & Data Flow
- **API Layer**: `src/lib/api/e621/index.ts` - E621ApiClient with rate limiting (1.8 req/sec)
- **API Management**: `ApiManager` singleton pattern for client registration
- **State Management Hooks**: 
  - `useE621Search` - Core search with debouncing, pagination, localStorage persistence
  - `useAuth` - Secure credential management with localStorage
  - `useApi` - Generic API client access hook
- **Context Providers**: `ApiProvider`, `SearchProvider`, `DownloadManagerProvider`
- **UI Components**: ShadCN-based components in `src/components/ui/`
- **Layout Pattern**: Grid view with modal detail overlay

## API References & Documentation
- **E621 OpenAPI Spec**: https://e621.wiki/openapi.yaml - Complete API specification
- **E621 API Documentation**: https://e621.net/help/api - Official API guide
- **Rate Limits**: 1 request per second (we use 1.8/sec conservatively)
- **Authentication**: HTTP Basic Auth with username:api_key
- **User Agent Required**: Format: `AppName/Version (Contact)`

## Critical Patterns to Follow
1. **API Client Registration**: All API clients must register with `apiManager.registerClient(client)`
2. **Server-Side Safety**: Always check `typeof window !== 'undefined'` before browser APIs
3. **CORS Handling**: Use `/api/proxy` route for e621.net API calls in browser
4. **Type Safety**: Use interfaces like `E621Post`, `SearchParams`, `IApiClient`
5. **Hooks Pattern**: Follow load/save/apply functions with localStorage persistence

## Browser Safety Pattern
**Critical**: All browser APIs must have SSR safety checks:

```typescript
// Required pattern used throughout codebase
function loadSettings(): UserSettings {
  if (typeof window === 'undefined') return defaultSettings
  
  try {
    const stored = localStorage.getItem('e621-settings')
    if (!stored) return defaultSettings
    return { ...defaultSettings, ...JSON.parse(stored) }
  } catch (error) {
    console.error('Failed to load settings, using defaults:', error)
    return defaultSettings
  }
}
```

## API Architecture
**CORS Solution**: Browser requests use proxy pattern:
- Browser: `fetch('/api/proxy?endpoint=posts.json&tags=wolf')`
- Server: Direct API calls to `https://e621.net`
- API client auto-detects environment and routes accordingly

**Authentication**: HTTP Basic Auth with e621 username/API key:
```typescript
// In useAuth hook
const auth = btoa(`${username}:${apiKey}`);
e621api.setAuth({ 'Authorization': `Basic ${auth}` });
```

## Development Workflow
- `.\build.ps1` - Interactive build script (PowerShell)
- `npm run dev` - Next.js dev server (port 3000)
- `npm run electron-dev` - Concurrent dev server + Electron
- `npm run build && npm run dist` - Production Windows executable

## Request Caching & Debouncing
- Search requests cached for 2 seconds to prevent duplicates
- User input debounced 300ms in `useE621Search`
- Rate limiting enforced at API client level (1.8 req/sec)

## UI Layout Patterns

### Grid and Modal Detail View
The application uses a two-level navigation pattern:
1. **Grid View**: The main interface shows search results in a responsive grid layout
2. **Detail Modal**: Clicking a post opens a modal overlay with detailed view
   - Shows larger image/content with post metadata
   - Displays tags, description, and upload information
   - Provides actions like download and favoriting
   - Modal can be dismissed to return to grid view

### Homepage Tag Sections
The homepage is organized into customizable sections based on tags:
- Each section displays results for specific tag searches (e.g., "wolf", "dildo")
- Users can add/remove tag sections through Homepage Settings
- Each section displays its own grid of search results

## Development Patterns

### API Client Pattern
```typescript
// 1. Create client extending ApiClient
export class MyApiClient extends ApiClient implements IApiClient {
  public readonly name = 'myapi';
  constructor() { super(baseUrl, userAgent, rateLimiter); }
}

// 2. Register globally
const myApi = new MyApiClient();
apiManager.registerClient(myApi);

// 3. Use in components
const myApi = useApi<IApiClient>('myapi');
```

### Hook State Persistence
```typescript
// Pattern: localStorage integration in hooks
const [state, dispatch] = useReducer(reducer, {
  ...initialState,
  data: loadFromStorage() || defaultData
});

// Save on state changes
useEffect(() => {
  saveToStorage(state.data);
}, [state.data]);
```

### Electron Security Config
```javascript
// electron/main.js - Required for API access
webPreferences: {
  webSecurity: false,  // Allows CORS requests
  contextIsolation: true,
  nodeIntegration: false
}
```

## File Structure Conventions
- **Pages**: `src/app/` - Next.js App Router
- **Components**: `src/components/` - Reusable UI components  
- **Hooks**: `src/hooks/` - Custom state management
- **API**: `src/lib/api/` - API clients and types
- **AI**: `src/ai/flows/` - Genkit AI integration (placeholder)

## Adding New Features
1. **API Integration**: Create client, register with `ApiManager`
2. **State Management**: Create hook with localStorage persistence
3. **UI Components**: Use ShadCN patterns, handle browser safety
4. **Electron**: Test both dev and production builds