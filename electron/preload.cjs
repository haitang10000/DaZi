const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('keypath', {
  load: () => ipcRenderer.sendSync('keypath:load'),
  save: (progress) => ipcRenderer.sendSync('keypath:save', progress),
  clear: () => ipcRenderer.sendSync('keypath:clear'),
  dataPath: () => ipcRenderer.sendSync('keypath:path'),
})
