const { contextBridge, ipcRenderer } = require('electron')

// Expose a minimal, safe API for downloads
contextBridge.exposeInMainWorld('e621', {
  download: {
    start: (payload) => ipcRenderer.invoke('download:start', payload),
    cancel: (id) => ipcRenderer.invoke('download:cancel', id),
    onProgress: (callback) => {
      const listener = (_event, data) => callback(data)
      ipcRenderer.on('download:progress', listener)
      return () => ipcRenderer.removeListener('download:progress', listener)
    },
    onCompleted: (callback) => {
      const listener = (_event, data) => callback(data)
      ipcRenderer.on('download:completed', listener)
      return () => ipcRenderer.removeListener('download:completed', listener)
    },
    onError: (callback) => {
      const listener = (_event, data) => callback(data)
      ipcRenderer.on('download:error', listener)
      return () => ipcRenderer.removeListener('download:error', listener)
    },
    onCancelled: (callback) => {
      const listener = (_event, data) => callback(data)
      ipcRenderer.on('download:cancelled', listener)
      return () => ipcRenderer.removeListener('download:cancelled', listener)
    }
  }
  ,
  dialog: {
    chooseFolder: () => ipcRenderer.invoke('dialog:chooseFolder')
  },
  system: {
    getDefaultDownloadsPath: () => ipcRenderer.invoke('system:getDefaultDownloadsPath')
  },
  updater: {
    onAvailable: (callback) => {
      const listener = (_event, data) => callback(data)
      ipcRenderer.on('update:available', listener)
      return () => ipcRenderer.removeListener('update:available', listener)
    },
    checkNow: () => ipcRenderer.invoke('update:checkNow'),
    openRelease: (url) => ipcRenderer.invoke('update:openRelease', url)
  }
})
