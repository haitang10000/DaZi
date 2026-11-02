const { app, BrowserWindow, Menu, dialog, ipcMain } = require('electron')
const fs = require('node:fs')
const path = require('node:path')

app.setName('KeyPath')

const DATA_FILENAME = 'keypath-data.json'
const MAX_DATA_BYTES = 2 * 1024 * 1024
let mainWindow = null
let resolvedDataFile = ''

function appDirectory() {
  return app.isPackaged ? path.dirname(app.getPath('exe')) : app.getAppPath()
}

function fallbackDirectory() {
  return app.getPath('userData')
}

function directoryIsWritable(directory) {
  try {
    fs.mkdirSync(directory, { recursive: true })
    const probe = path.join(directory, `.keypath-write-test-${process.pid}`)
    fs.writeFileSync(probe, 'ok', 'utf8')
    fs.unlinkSync(probe)
    return true
  } catch {
    return false
  }
}

function resolveDataFile() {
  if (resolvedDataFile) return resolvedDataFile
  const preferred = path.join(appDirectory(), DATA_FILENAME)
  const fallback = path.join(fallbackDirectory(), DATA_FILENAME)
  resolvedDataFile = directoryIsWritable(path.dirname(preferred)) ? preferred : fallback
  return resolvedDataFile
}

function errorText(error) {
  if (error && typeof error.message === 'string') return error.message
  return String(error)
}

function readData() {
  const file = resolveDataFile()
  try {
    if (!fs.existsSync(file)) return { ok: true, data: null, path: file }
    const size = fs.statSync(file).size
    if (size > MAX_DATA_BYTES) {
      return { ok: false, data: null, path: file, error: '数据文件超过大小限制' }
    }
    const raw = fs.readFileSync(file, 'utf8')
    if (!raw.trim()) return { ok: true, data: null, path: file }
    const data = JSON.parse(raw)
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return { ok: false, data: null, path: file, error: '数据文件格式无效' }
    }
    return { ok: true, data, path: file }
  } catch (error) {
    return { ok: false, data: null, path: file, error: errorText(error) }
  }
}

function writeData(payload) {
  const file = resolveDataFile()
  let temporary = ''
  try {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      throw new Error('数据格式无效')
    }
    const text = JSON.stringify(payload, null, 2)
    if (Buffer.byteLength(text, 'utf8') > MAX_DATA_BYTES) {
      throw new Error('数据文件超过大小限制')
    }
    fs.mkdirSync(path.dirname(file), { recursive: true })
    temporary = `${file}.tmp`
    fs.writeFileSync(temporary, text, 'utf8')
    try {
      fs.renameSync(temporary, file)
    } catch {
      // Some Windows security policies refuse replacing an existing file atomically.
      fs.writeFileSync(file, text, 'utf8')
      fs.rmSync(temporary, { force: true })
    }
    return { ok: true, path: file }
  } catch (error) {
    if (temporary) {
      try {
        fs.rmSync(temporary, { force: true })
      } catch {
        // Ignore cleanup failures; the original error is the useful one.
      }
    }
    return { ok: false, path: file, error: errorText(error) }
  }
}

function clearData() {
  const targets = new Set([
    path.join(appDirectory(), DATA_FILENAME),
    path.join(fallbackDirectory(), DATA_FILENAME),
  ])
  try {
    for (const file of targets) {
      fs.rmSync(file, { force: true })
      fs.rmSync(`${file}.tmp`, { force: true })
    }
    return { ok: true, path: resolveDataFile() }
  } catch (error) {
    return { ok: false, path: resolveDataFile(), error: errorText(error) }
  }
}

function isTrustedSender(event) {
  return Boolean(mainWindow && event.sender === mainWindow.webContents)
}

ipcMain.on('keypath:load', (event) => {
  event.returnValue = isTrustedSender(event)
    ? readData()
    : { ok: false, data: null, path: '', error: '未授权的数据请求' }
})

ipcMain.on('keypath:save', (event, payload) => {
  event.returnValue = isTrustedSender(event)
    ? writeData(payload)
    : { ok: false, error: '未授权的数据请求' }
})

ipcMain.on('keypath:clear', (event) => {
  event.returnValue = isTrustedSender(event)
    ? clearData()
    : { ok: false, error: '未授权的数据请求' }
})

ipcMain.on('keypath:path', (event) => {
  event.returnValue = isTrustedSender(event) ? resolveDataFile() : ''
})

function createWindow() {
  const icon = path.join(__dirname, '..', 'build', 'icon.ico')
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 900,
    minWidth: 960,
    minHeight: 680,
    show: false,
    title: '键径 KeyPath',
    backgroundColor: '#f5f2ea',
    icon: fs.existsSync(icon) ? icon : undefined,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  mainWindow.once('ready-to-show', () => mainWindow.show())
  mainWindow.on('closed', () => {
    mainWindow = null
  })

  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('file://')) event.preventDefault()
  })

  const indexFile = path.join(__dirname, '..', 'dist', 'index.html')
  mainWindow.loadFile(indexFile).catch((error) => {
    dialog.showErrorBox(
      '键径 KeyPath 启动失败',
      `无法读取应用界面文件：\n${indexFile}\n\n${errorText(error)}`,
    )
    app.quit()
  })
}

const hasSingleInstanceLock = app.requestSingleInstanceLock()

if (!hasSingleInstanceLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (!mainWindow) return
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.show()
    mainWindow.focus()
  })

  app.whenReady().then(() => {
    app.setAppUserModelId('com.keypath.typing')
    Menu.setApplicationMenu(null)
    createWindow()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })
}
