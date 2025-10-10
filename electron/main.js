const { app, BrowserWindow, Menu } = require('electron')
const isDev = require('electron-is-dev')
const path = require('path')

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
      webSecurity: false,
      allowRunningInsecureContent: true
    },
    icon: path.join(__dirname, '../assets/icon.png'),
    show: false,
    titleBarStyle: 'default',
    frame: true
  })

  // Load the app
  const startUrl = isDev 
    ? 'http://localhost:3000' 
    : `file://${path.join(__dirname, '../out/index.html')}`

  mainWindow.loadURL(startUrl)

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    
    // Focus the window
    if (isDev) {
      mainWindow.webContents.openDevTools()
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