'use client';

import Link from 'next/link';
import { ArrowLeft, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Code = ({ children }: { children: React.ReactNode }) => (
  <code className="bg-muted text-foreground p-1 rounded-sm text-xs font-mono">{children}</code>
);

const DocsPage = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button asChild variant="outline">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
        
        <div className="text-center py-8 mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 mb-6">
            <Image className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent mb-4">
            E621 Horizon Documentation
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            A guide for developers working on the modern e621 browser application
          </p>
        </div>

        <article className="prose dark:prose-invert max-w-none bg-card p-6 rounded-lg shadow-sm">
          <h1>E621 Horizon - AI Coding Agent Instructions</h1>
          
          <h2>Project Overview</h2>
          <p>
            E621 Horizon is a modern desktop application for browsing e621.net, built with Next.js, TypeScript, and Electron. The app features a dark-themed, responsive interface with tag-based search capabilities, theme customization, user authentication, and customizable homepage sections for different tag searches with post counts.
          </p>

          <h2>Architecture</h2>
          <ul>
            <li><strong>Next.js 15</strong> with App Router for the frontend</li>
            <li><strong>React + TypeScript</strong> for UI components</li>
            <li><strong>Electron</strong> for cross-platform desktop packaging</li>
            <li><strong>Context-based state management</strong> (no Redux/Zustand)</li>
            <li><strong>Browser-safe code</strong> for SSR compatibility with appropriate <Code>typeof window !== 'undefined'</Code> checks</li>
            <li><strong>Responsive UI</strong> with adaptive grid layouts for different screen sizes</li>
          </ul>

          <h2>Key Components & Data Flow</h2>
          <ul>
            <li><strong>API Layer</strong>: <Code>src/lib/api/e621/index.ts</Code> - E621 API client with rate limiting (1.8 req/sec)</li>
            <li><strong>State Management</strong>:
              <ul>
                <li><Code>useE621Search</Code> - Core search functionality with debouncing and tag suggestions</li>
                <li><Code>useAuth</Code> - Authentication and credential management</li>
                <li><Code>useTheme</Code> - Visual theming and background customization</li>
                <li><Code>useHomeSettings</Code> - Homepage configuration with tag sections</li>
              </ul>
            </li>
            <li><strong>Context Providers</strong>: <Code>ThemeProvider</Code> for theme management</li>
            <li><strong>UI Components</strong>: ShadCN-based components in <Code>src/components/ui/</Code></li>
            <li><strong>UI Layout Pattern</strong>: Two-level view with grid results and modal detail view</li>
          </ul>

          <h2>Critical Patterns to Follow</h2>
          <ol>
            <li><strong>Type Safety</strong>: Always use TypeScript interfaces like <Code>E621Post</Code>, <Code>SearchParams</Code>, and <Code>IApiClient</Code></li>
            <li><strong>Server-Side Safety</strong>: Check <Code>typeof window !== 'undefined'</Code> before accessing browser-only objects</li>
            <li><strong>Hooks Structure</strong>: Follow established pattern in hooks folder with load/save/apply functions</li>
            <li><strong>API Access</strong>: Import the API client singleton directly via <Code>import {'{ e621api }'} from '@/lib/api/e621'</Code></li>
            <li><strong>Debounced Actions</strong>: Implement debouncing for user inputs and API requests</li>
            <li><strong>Search Suggestions</strong>: Use tag autocomplete with post counts to aid user search experience</li>
          </ol>

          <h2>Browser Compatibility</h2>
          <p>The app uses Next.js SSR, so ensure all browser APIs (<Code>window</Code>, <Code>document</Code>, <Code>localStorage</Code>) have safety checks:</p>
          <pre><code>
{`// Example pattern used throughout the codebase
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
}`}
          </code></pre>

          <h2>Authentication Flow</h2>
          <ol>
            <li><Code>AuthWrapper</Code> component checks for credentials and renders login or app content</li>
            <li><Code>useAuth</Code> hook manages credentials with secure localStorage persistence</li>
            <li>API requests use basic auth headers with the e621.net API</li>
          </ol>

          <h2>Development Workflow</h2>
          <ul>
            <li><Code>npm run dev</Code> - Start Next.js development server</li>
            <li><Code>npm run electron-dev</Code> - Start Electron app in dev mode</li>
            <li><Code>npm run build</Code> - Build Next.js application</li>
            <li><Code>npm run dist</Code> - Create Windows executable</li>
          </ul>

          <h2>API Integration</h2>
          <p>The E621 API client in <Code>src/lib/api/e621/index.ts</Code> handles:</p>
          <ul>
            <li>Rate limiting (1.8 requests/second)</li>
            <li>Error handling and request caching</li>
            <li>Type-safe interfaces for posts, pools, and search params</li>
          </ul>

          <h2>UI Layout Patterns</h2>
          <p>The application features a modern, dark-themed interface with blue accent colors and a clean, minimalist design:</p>

          <h3>Grid and Modal Detail View</h3>
          <p>The application uses a two-level navigation pattern with a dark-themed interface:</p>
          <ol>
            <li><strong>Grid View</strong>: The main interface shows search results in a responsive grid layout
              <ul>
                <li>Displays thumbnail images in a responsive grid (5 columns in the example)</li>
                <li>Each thumbnail has a small circular bookmark/favorite indicator in the corner</li>
                <li>Uses a dark navy background (#111827 or similar) with blue accent colors</li>
                <li>Contains a top navigation bar with the app logo, search input, and action buttons</li>
                <li>Search bar is prominent with blue accent border when active</li>
                <li>Features intelligent search autocomplete that shows relevant tag suggestions with post counts</li>
                <li>Search suggestions appear in a dropdown with tag counts (e.g., "dildo: 91,160") in right-aligned format</li>
                <li>Autocomplete shows related/variant tags (e.g., dildo_insertion, dildo_in_ass) in descending post count order</li>
                <li>Includes "Analyze Image" and "Filters" buttons in the header alongside settings</li>
                <li>Displays pagination controls (Previous, Page 1, Next) for search results</li>
              </ul>
            </li>
            <li><strong>Detail Modal</strong>: Clicking a post opens a modal overlay with detailed view
              <ul>
                <li>Shows larger image/content with post metadata</li>
                <li>Displays tags organized by category (artist, character, species, etc.)</li>
                <li>Provides actions like download, favoriting, and navigation between posts</li>
                <li>Includes color preview of dominant colors in the image</li>
                <li>Modal can be dismissed to return to grid view</li>
              </ul>
            </li>
          </ol>

          <h3>Homepage Tag Sections</h3>
          <p>The homepage is organized into customizable tag sections as seen in the interface:</p>
          <ul>
            <li>Each section (like "Popular" and "Dragon" shown in the UI) displays as a separate category</li>
            <li>Tag sections display in a vertical layout with headings clearly separating each section</li>
            <li>Users can add or remove tag sections through the "Homepage Settings" modal at the top</li>
            <li>Tags can be added via text input (e.g., "Add a tag section (e.g., 'wolf')") with blue "Add" button</li>
            <li>Active tags appear as chips/pills (dark with blue accent) that can be removed via an "×" button</li>
            <li>Each tag section displays a grid of image thumbnails with favorite/bookmark indicators</li>
            <li>Images display in a responsive grid layout (not horizontal scrolling as previously described)</li>
            <li>Each thumbnail has a small indicator icon in the corner for additional metadata</li>
          </ul>

          <h2>Visual Design Elements</h2>
          <ul>
            <li><strong>Color Scheme</strong>: Dark navy background (#111827) with blue accent colors (#3B82F6) and high contrast white text</li>
            <li><strong>UI Components</strong>: Minimal, modern inputs with subtle animations and rounded corners</li>
            <li><strong>Search Autocomplete</strong>: Dark dropdown with white text and right-aligned post counts</li>
            <li><strong>Typography</strong>: Clean sans-serif fonts with clear hierarchy</li>
            <li><strong>Layout</strong>: Responsive design with grid layouts for content and flex for navigation</li>
            <li><strong>Interactive Elements</strong>: Hover states with subtle color changes and shadow effects</li>
            <li><strong>Modals</strong>: Centered overlays with semi-transparent backgrounds (seen in Homepage Settings)</li>
            <li><strong>Post Color Preview</strong>: Visual representation of image colors in detail view</li>
            <li><strong>Empty States</strong>: Clear messaging for no results ("No posts found. Try adjusting your search terms or filters.")</li>
            <li><strong>Notifications</strong>: Toast-style notifications (e.g., "Login Successful" message seen in screenshot)</li>
          </ul>

          <h2>Empty States and Error Handling</h2>
          <p>The application provides clear messaging for various states:</p>
          <ul>
            <li><strong>No Search Results</strong>: When a search returns no matching posts, a centered message states "No posts found. Try adjusting your search terms or filters."</li>
            <li><strong>Login Status</strong>: Success notifications appear in the bottom right (e.g., "Login Successful. Welcome, username!")</li>
            <li><strong>Loading States</strong>: Appropriate loading indicators during data fetching operations</li>
          </ul>

          <h2>Adding New Features</h2>
          <ol>
            <li>Create new React components in <Code>src/components/</Code></li>
            <li>Add new pages in <Code>src/app/</Code> directory</li>
            <li>Implement state management in custom hooks under <Code>src/hooks/</Code></li>
            <li>Register any new API clients with the <Code>apiManager</Code></li>
            <li>Follow established dark theme (#111827) and blue accent color scheme (#3B82F6)</li>
            <li>Use existing UI components from <Code>src/components/ui/</Code></li>
            <li>Implement appropriate empty states and loading indicators</li>
          </ol>

          <p>Remember to follow the established patterns for error handling, state persistence, browser compatibility, and visual design throughout the codebase.</p>
        </article>
      </main>
    </div>
  );
};

export default DocsPage;