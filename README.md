# E621 Horizon

## Search Functionality Improvements

The search functionality in E621 Horizon has been significantly enhanced with several important fixes and new features!

### What's New

1. **Improved Search Page**: Visit `/search` for a dedicated search experience with better formatting
2. **Fixed Tag Handling**: The application now correctly formats tags for the E621 API
3. **Load More Results**: Pagination support with a "Load More" button to see additional content
4. **Post Detail Modal**: Click on any post to see full details in a modal window
5. **Increased Results**: Default result limit increased to 100 posts per search
6. **Better Error Handling**: More descriptive errors and debugging tools

### How to Use

1. Type your search tags in the header search bar
2. Press Enter or click the search button
3. Browse the results on the new search page
4. Click any image to view full details
5. Use the "Load More" button at the bottom to see additional results

### Examples of Working Search Tags

- `female rating:safe` - Safe female content
- `canine -male` - Canine content with no male tags
- `wolf solo` - Solo wolf images
- `dragon rating:s` - Safe dragon content
- `dildo` - For more mature content
- `order:score` - Add to any search to sort by popularity

### Performance Tips

- Use more specific tags to get more relevant results
- Try using rating tags (`rating:s`, `rating:q`, `rating:e`) to filter content
- Adding `order:score` will show most popular content first
- For faster loading, combine multiple tags to narrow results

### If You Still Have Issues

Try using the API Test Page at `/test` to see raw API responses and debug any issues.

A modern, feature-rich desktop application for browsing e621.net. Built with Next.js, TypeScript, and Electron.

## Features

- **Modern UI**: Clean, responsive interface built with Next.js and Tailwind CSS
- **Advanced Search**: Powerful search with tag filtering, rating controls, and blacklists  
- **Pool Support**: Browse and download entire pools with batch download functionality
- **AI Integration**: Image analysis and related content suggestions using Google's Genkit
- **Customization**: Themes, backgrounds, and personalized homepage sections
### 🔧 **Key Features Implemented:**

- **🔐 Authentication**: Secure e621 username/API key login system
- **🔍 Search System**: Tag-based search with rating filters
- **⚡ Rate Limiting**: Respectful API usage (1 req/sec)
- **🎨 Theming**: Dynamic color schemes and backgrounds  
- **⚙️ Settings**: Persistent user preferences with account management
- **📱 Responsive UI**: Mobile-friendly interface
- **🖥️ Electron App**: Desktop executable framework
- **Desktop App**: Native Windows executable with Electron

## Architecture

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with ShadCN UI components
- **State Management**: React Hooks (useState, useReducer, useContext)
- **AI**: Google Genkit for image analysis and content recommendations
- **Desktop**: Electron for cross-platform desktop application
- **API**: Custom e621 API client with rate limiting

## Installation

### Quick Start (Recommended)

**Automated Installation:**
```cmd
# Windows Batch (Simple)
install-dependencies.bat

# PowerShell (Advanced with options)
.\install-dependencies.ps1

# PowerShell with force clean install
.\install-dependencies.ps1 -Force
```

The automated scripts will:
- Verify Node.js installation (18+ required)
- Update npm to latest version  
- Clean existing dependencies
- Install all required packages
- Verify critical dependencies
- Install global development tools

📋 **See [DEPENDENCIES.md](./DEPENDENCIES.md) for detailed installation guide and troubleshooting.**

### Prerequisites

- **Node.js 18+** - [Download from nodejs.org](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Git** (for cloning repository)

### Development Setup

1. Clone the repository:
```bash
git clone https://github.com/oreoorin6/horizion-.git
cd horizion-
```

2. Install dependencies (choose one method):
```bash
# Automated (recommended)
.\install-dependencies.ps1

# Manual
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. In another terminal, start the Electron app:
```bash
npm run electron-dev
```

### Building the Executable

1. Build the Next.js application:
```bash
npm run build
```

2. Create the Windows executable:
```bash
npm run dist
```

The executable will be created in the `dist` folder.

### Manual Build Process

If you want to build manually:

1. Install dependencies:
```bash
npm install
```

2. Build the web application:
```bash
npm run build
```

3. Build the Electron app:
```bash
npm run build-electron
```

## Usage

### 🚀 **First Time Setup**
1. Launch the application
2. Enter your e621 username and API key when prompted
3. Credentials are stored securely on your device

### 🔍 **Search**
- Use the search bar to find posts by tags
- Combine multiple tags with spaces
- Use `-tag` to exclude tags
- Rating filters: `rating:s`, `rating:q`, `rating:e`

### ⚙️ **Settings**
- **Account Tab**: View credentials and sign out
- **Preferences Tab**: Configure ratings, posts per page, blacklists
- **Appearance Tab**: Customize theme colors and backgrounds

### 🏊 **Pools** *(Coming Soon)*
- Navigate to `/pool/{id}` to view pools
- Use "Download All" to batch download pool contents
- Posts are downloaded in order with proper filenames

### 🤖 **AI Features** *(Framework Ready)*
- Image analysis generates relevant tags automatically
- Related links suggest similar content and artist galleries
- Powered by Google's Genkit framework

### 🔐 **Authentication**
- **Secure Storage**: Credentials stored locally only
- **API Integration**: Automatic authentication headers
- **Easy Logout**: Clear credentials anytime from settings

## Project Structure

```
├── src/
│   ├── app/                 # Next.js app router pages
│   │   ├── pool/[id]/      # Pool viewer pages
│   │   ├── actions.ts      # Server actions for AI flows
│   │   ├── layout.tsx      # Root layout
│   │   └── page.tsx        # Home page
│   ├── components/         # React components
│   │   ├── ui/            # ShadCN UI components
│   │   └── AppHeader.tsx  # Main app header
│   ├── hooks/             # Custom React hooks
│   │   ├── useE621Search.ts    # Main search state management
│   │   ├── useHomeSettings.ts  # Homepage customization
│   │   └── useTheme.ts         # Theme and background management
│   ├── lib/               # Utility libraries
│   │   ├── e621-api.ts    # E621 API client with rate limiting
│   │   └── utils.ts       # Helper utilities
│   └── ai/                # AI flows and integrations
│       └── flows/         # Genkit flow definitions
├── electron/              # Electron main process
│   └── main.js           # Electron app entry point
├── public/               # Static assets
└── assets/              # App icons and resources
```

## Configuration

### Environment Variables

Create a `.env.local` file:

```bash
# Google AI API key (for Genkit flows)
GOOGLE_API_KEY=your_google_api_key_here

# Optional: Custom e621 API settings
E621_USER_AGENT=YourApp/1.0
```

### Electron Configuration

The app is configured in `electron-builder` section of `package.json`:
- Output directory: `dist/`
- Installer: NSIS for Windows
- App ID: `com.e621horizon.app`

## Development

### Adding New Features

1. **Components**: Add new React components in `src/components/`
2. **Pages**: Create new pages in `src/app/`
3. **Hooks**: Add state management hooks in `src/hooks/`
4. **AI Flows**: Create new Genkit flows in `src/ai/flows/`

### API Integration

The e621 API client (`src/lib/e621-api.ts`) handles:
- Rate limiting (1 request/second)
- Error handling and retries
- Type-safe response interfaces
- Batch operations for bulk data

### State Management

- `useE621Search`: Main application state (search, posts, settings)
- `useHomeSettings`: Homepage layout customization  
- `useTheme`: Visual theming and backgrounds
- All state is persisted to localStorage

## Troubleshooting

### Common Issues

1. **API Rate Limiting**: The app includes built-in rate limiting, but if you encounter 429 errors, try reducing request frequency.

2. **CORS Errors**: The Electron app disables web security for API access. In development, make sure the dev server is running.

3. **Build Errors**: Ensure all dependencies are installed and Node.js version is 18+.

4. **Missing Images**: Some e621 images require specific referrer headers. The app handles this automatically.

### Dependencies Issues

If you encounter module errors, install missing dependencies:

```bash
# Core dependencies
npm install next@^15.0.0 react@^18.0.0 react-dom@^18.0.0

# UI dependencies  
npm install tailwindcss autoprefixer postcss
npm install class-variance-authority clsx tailwind-merge
npm install lucide-react

# Radix UI components
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npm install @radix-ui/react-select @radix-ui/react-slider
npm install @radix-ui/react-switch @radix-ui/react-tabs @radix-ui/react-toast

# Electron dependencies
npm install electron electron-builder concurrently wait-on electron-is-dev

# AI dependencies (optional)
npm install @genkit-ai/core @genkit-ai/googleai @genkit-ai/flow
```

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable  
5. Submit a pull request

## Disclaimer

This application is not affiliated with e621.net. Please respect their terms of service and API usage guidelines.