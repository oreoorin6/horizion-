const { app, BrowserWindow, Menu, protocol, ipcMain, dialog } = require('electron')
const { pathToFileURL } = require('url')
const isDev = require('electron-is-dev')
const path = require('path')
const fs = require('fs')
const https = require('https')

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
      allowRunningInsecureContent: true,
      preload: path.join(__dirname, 'preload.js')
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

// ---------------------------
// Download manager (main-side)
// ---------------------------

// Keep track of active downloads to support cancellation
const activeDownloads = new Map()

function resolveDownloadDirectory(dir) {
  // If dir is absolute, return as-is; else resolve under user Downloads
  try {
    if (path.isAbsolute(dir)) return dir
  } catch {}
  return path.join(app.getPath('downloads'), dir || 'downloads')
}

function ensureDirectoryExists(dirPath) {
  try {
    fs.mkdirSync(dirPath, { recursive: true })
  } catch (e) {
    // best effort
  }
}

function uniquePath(filePath) {
  if (!fs.existsSync(filePath)) return filePath
  const dir = path.dirname(filePath)
  const ext = path.extname(filePath)
  const name = path.basename(filePath, ext)
  let i = 1
  let next
  do {
    next = path.join(dir, `${name} (${i})${ext}`)
    i++
  } while (fs.existsSync(next) && i < 1000)
  return next
}

function followRedirects(urlString, headers, depth = 0) {
  return new Promise((resolve, reject) => {
    if (depth > 5) return reject(new Error('Too many redirects'))

    const request = https.request(urlString, { method: 'GET', headers }, response => {
      const status = response.statusCode || 0
      if ([301, 302, 303, 307, 308].includes(status) && response.headers.location) {
        response.resume()
        const nextUrl = new URL(response.headers.location, urlString).toString()
        resolve(followRedirects(nextUrl, headers, depth + 1))
      } else if (status >= 200 && status < 300) {
        resolve(response)
      } else {
        reject(new Error(`HTTP ${status}`))
      }
    })
    request.on('error', reject)
    request.end()
  })
}

ipcMain.handle('download:start', async (event, payload) => {
  const { id, url, directory, filename, headers: hdrs } = payload || {}
  if (!id || !url || !filename) {
    throw new Error('Missing required download params')
  }

  const UA = 'E621Horizon/1.0 (https://github.com/yourusername/e621horizon)'
  const headers = Object.assign({
    'User-Agent': UA,
    'Referer': 'https://e621.net/'
  }, hdrs || {})

  const fullDir = resolveDownloadDirectory(directory)
  ensureDirectoryExists(fullDir)
  let fullPath = path.join(fullDir, filename)
  fullPath = uniquePath(fullPath)

  const startTime = Date.now()
  try {
    const response = await followRedirects(url, headers)
    const totalBytes = parseInt(response.headers['content-length'] || '0', 10) || 0
    const writeStream = fs.createWriteStream(fullPath)

    let downloaded = 0
    let lastEmit = Date.now()
    let lastBytes = 0

    // Allow cancellation
    const abortController = new AbortController()
    const cleanup = () => {
      activeDownloads.delete(id)
    }
    activeDownloads.set(id, {
      abort: () => {
        try { response.destroy() } catch {}
        try { writeStream.close() } catch {}
        try { fs.unlinkSync(fullPath) } catch {}
        cleanup()
      }
    })

    response.on('data', chunk => {
      writeStream.write(chunk)
      downloaded += chunk.length

      const now = Date.now()
      if (now - lastEmit > 300) {
        const deltaBytes = downloaded - lastBytes
        const deltaTime = (now - lastEmit) / 1000
        const speed = deltaBytes / 1024 / 1024 / (deltaTime || 1) // MB/s
        event.sender.send('download:progress', { id, downloaded, total: totalBytes, speed })
        lastEmit = now
        lastBytes = downloaded
      }
    })

    response.on('end', () => {
      writeStream.end(() => {
        cleanup()
        event.sender.send('download:completed', { id, path: fullPath })
      })
    })

    response.on('error', err => {
      try { writeStream.close() } catch {}
      cleanup()
      event.sender.send('download:error', { id, message: err?.message || 'Download failed' })
    })

  } catch (err) {
    event.sender.send('download:error', { id, message: err?.message || 'Download failed' })
  }
})

ipcMain.handle('download:cancel', (event, id) => {
  const d = activeDownloads.get(id)
  if (d && typeof d.abort === 'function') {
    d.abort()
  }
  event.sender.send('download:cancelled', { id })
})

// Open system folder picker dialog and return chosen path
ipcMain.handle('dialog:chooseFolder', async () => {
  const win = BrowserWindow.getFocusedWindow() || mainWindow
  const result = await dialog.showOpenDialog(win, {
    title: 'Select Download Folder',
    properties: ['openDirectory', 'createDirectory']
  })
  if (result.canceled || !result.filePaths?.length) return null
  return result.filePaths[0]
})