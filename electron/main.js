const { app, BrowserWindow, Menu, protocol } = require('electron')
const { pathToFileURL } = require('url')
const isDev = require('electron-is-dev')
const path = require('path')

// Register custom scheme privileges BEFORE app is ready so DOM storage works (non-opaque origin)
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true
    }
  }
])

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false, // Disable CORS for API calls
      allowRunningInsecureContent: true
    },
    icon: path.join(__dirname, '../assets/icon.png'),
    show: false,
    titleBarStyle: 'default',
    frame: true,
    backgroundColor: '#1a1a1a' // Prevent white flash on load
  })

  // Set a custom user agent required by e621 API for all renderer requests
  try {
    const APP_USER_AGENT = 'E621Horizon/1.0 (https://github.com/yourusername/e621horizon)'
    mainWindow.webContents.setUserAgent(APP_USER_AGENT)
  } catch (e) {
    console.warn('[Electron] Failed to set custom user agent:', e)
  }

  // Load the app
  let startUrl;
  if (isDev) {
    startUrl = 'http://localhost:3000'
    mainWindow.loadURL(startUrl)
  } else {
    // In production, serve static files from out/ via a custom protocol to avoid file:// issues
    const startAppUrl = 'app://local/index.html'
    console.log('[Electron] Loading URL:', startAppUrl)
    mainWindow.loadURL(startAppUrl)
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    
    // Open DevTools only in development (toggle with F12 via menu)
    if (isDev) {
      try { mainWindow.webContents.openDevTools({ mode: 'detach' }) } catch {}
    }
  })

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // Remove menu bar in production
  if (!isDev) {
    Menu.setApplicationMenu(null)
  } else {
    // Create a simple menu for development
    const template = [
      {
        label: 'File',
        submenu: [
          {
            label: 'Refresh',
            accelerator: 'CmdOrCtrl+R',
            click: () => {
              mainWindow.reload()
            }
          },
          {
            label: 'Developer Tools',
            accelerator: 'F12',
            click: () => {
              mainWindow.webContents.toggleDevTools()
            }
          },
          { type: 'separator' },
          {
            label: 'Exit',
            accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
            click: () => {
              app.quit()
            }
          }
        ]
      }
    ]

    const menu = Menu.buildFromTemplate(template)
    Menu.setApplicationMenu(menu)
  }
}

// App event handlers
app.whenReady().then(() => {
  // Register a custom protocol to serve files from the packaged out/ directory
  protocol.registerFileProtocol('app', (request, callback) => {
    try {
      const reqUrl = new URL(request.url)
      let pathname = decodeURI(reqUrl.pathname)
      if (!pathname || pathname === '/') {
        pathname = '/index.html'
      } else {
        // If no file extension, serve index.html in that folder (for app router routes)
        const hasExt = path.extname(pathname) !== ''
        if (!hasExt) pathname = path.join(pathname, 'index.html')
      }

      // Map to app.asar/out/<pathname>
      const basePath = app.getAppPath()
      const resolvedPath = path.join(basePath, 'out', pathname)
      // Debug logging for difficult cases
      // console.log('[Protocol] app:// ->', resolvedPath)
      callback({ path: resolvedPath })
    } catch (err) {
      console.error('[Protocol] Failed to resolve path for', request.url, err)
      callback({ error: -6 }) // net::ERR_FILE_NOT_FOUND
    }
  })

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Handle certificate errors (for e621 API)
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  // Allow all certificates in development
  if (isDev) {
    event.preventDefault()
    callback(true)
  } else {
    callback(false)
  }
})

// Security: prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault()
    
    // Allow opening external links in browser
    const { shell } = require('electron')
    shell.openExternal(navigationUrl)
  })
})