import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const root = createRoot(document.getElementById('root')!)

if (window.keypath) {
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
} else {
  root.render(
    <StrictMode>
      <div className="desktop-only">
        <div className="desktop-only-card">
          <span className="desktop-only-mark" aria-hidden="true">
            K
          </span>
          <h1>请从桌面应用启动</h1>
          <p>键径 KeyPath 现在是一款本地桌面应用。请运行安装包，或从应用目录打开 KeyPath。</p>
          <p className="desktop-only-hint">应用内不会启动任何本地服务器，也不会通过网址运行。</p>
        </div>
      </div>
    </StrictMode>,
  )
}
