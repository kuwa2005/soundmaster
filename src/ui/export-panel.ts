import { state, getActiveTrack, subscribe } from '../state'
import { exportWav, exportAllAsZip } from '../audio/exporter'

let pendingDownload: 'one' | 'all' | null = null
let dialogElement: HTMLDivElement | null = null

export function renderExportPanel(container: HTMLElement) {
  const track = getActiveTrack()
  const hasBuffer = track?.masteredBuffer !== null && track?.masteredBuffer !== undefined
  const isMastering = track?.status === 'mastering'

  container.innerHTML = `
    <div class="flex items-center gap-4">
      <button id="btn-export-one" class="transport-btn daw-btn px-4 py-2 font-medium" style="background: ${hasBuffer ? 'var(--color-daw-success)' : 'var(--color-daw-panel)'}; color: ${hasBuffer ? 'white' : 'var(--color-daw-muted)'}; border-color: ${hasBuffer ? 'var(--color-daw-success)' : 'var(--color-daw-border)'};">
        📥 Download
      </button>
      <button id="btn-export-all" class="transport-btn daw-btn px-4 py-2 font-medium" style="background: ${hasBuffer ? 'var(--color-daw-accent)' : 'var(--color-daw-panel)'}; color: ${hasBuffer ? 'white' : 'var(--color-daw-muted)'}; border-color: ${hasBuffer ? 'var(--color-daw-accent)' : 'var(--color-daw-border)'};">
        📦 Download All as ZIP
      </button>
      <div class="flex-1"></div>
      <div id="export-status" class="text-sm" style="color: var(--color-daw-muted);"></div>
    </div>
  `

  document.getElementById('btn-export-one')!.addEventListener('click', () => {
    handleDownloadClick('one')
  })

  document.getElementById('btn-export-all')!.addEventListener('click', () => {
    handleDownloadClick('all')
  })
}

function handleDownloadClick(type: 'one' | 'all') {
  const track = getActiveTrack()
  const hasBuffer = track?.masteredBuffer !== null && track?.masteredBuffer !== undefined

  if (hasBuffer) {
    // レンダリング済み → 即時ダウンロード
    executeDownload(type)
  } else {
    // レンダリング未完了 → ダイアログ表示して待機
    pendingDownload = type
    showRenderingDialog()
  }
}

async function executeDownload(type: 'one' | 'all') {
  const status = document.getElementById('export-status')

  if (type === 'one') {
    if (status) status.textContent = '⏳ Exporting...'
    try {
      await exportWav()
      if (status) status.textContent = '✓ Done!'
    } catch (e) {
      if (status) status.textContent = '✗ Export failed'
    }
  } else {
    if (status) status.textContent = '⏳ Packing...'
    try {
      await exportAllAsZip()
      if (status) status.textContent = '✓ Done!'
    } catch (e) {
      if (status) status.textContent = '✗ Export failed'
    }
  }
}

function showRenderingDialog() {
  if (dialogElement) return

  dialogElement = document.createElement('div')
  dialogElement.id = 'rendering-dialog'
  dialogElement.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    backdrop-filter: blur(4px);
  `

  dialogElement.innerHTML = `
    <div style="
      background: var(--color-daw-surface);
      border: 1px solid var(--color-daw-border);
      border-radius: 12px;
      padding: 32px;
      text-align: center;
      min-width: 320px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    ">
      <div style="font-size: 48px; margin-bottom: 16px;">⚙️</div>
      <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 8px; color: var(--color-daw-text);">
        レンダリング中...
      </h3>
      <p style="font-size: 14px; color: var(--color-daw-muted); margin-bottom: 24px;">
        マスタリング処理を実行しています。<br>
        完了後、自動的にダウンロードが開始されます。
      </p>
      <div style="
        width: 100%;
        height: 4px;
        background: var(--color-daw-panel);
        border-radius: 2px;
        overflow: hidden;
        margin-bottom: 16px;
      ">
        <div id="rendering-progress" style="
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, var(--color-daw-accent), #8b5cf6);
          animation: rendering-pulse 1.5s ease-in-out infinite;
          border-radius: 2px;
        "></div>
      </div>
      <button id="dialog-cancel" style="
        background: var(--color-daw-panel);
        border: 1px solid var(--color-daw-border);
        color: var(--color-daw-muted);
        padding: 8px 24px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
      ">
        キャンセル
      </button>
    </div>
  `

  // アニメーションスタイルを追加
  const style = document.createElement('style')
  style.textContent = `
    @keyframes rendering-pulse {
      0%, 100% { opacity: 1; transform: translateX(-100%); }
      50% { opacity: 0.7; }
    }
    #rendering-progress {
      animation: rendering-slide 1.5s ease-in-out infinite;
    }
    @keyframes rendering-slide {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
  `
  document.head.appendChild(style)

  document.body.appendChild(dialogElement)

  // キャンセルボタン
  document.getElementById('dialog-cancel')!.addEventListener('click', () => {
    hideRenderingDialog()
  })

  // ステート変更を監視
  checkRenderingStatus()
}

function hideRenderingDialog() {
  if (dialogElement) {
    dialogElement.remove()
    dialogElement = null
  }
  pendingDownload = null
}

function checkRenderingStatus() {
  if (!dialogElement) return

  const track = getActiveTrack()
  const hasBuffer = track?.masteredBuffer !== null && track?.masteredBuffer !== undefined

  if (hasBuffer && pendingDownload) {
    // レンダリング完了 → ダイアログを閉じてダウンロード実行
    const type = pendingDownload
    hideRenderingDialog()
    executeDownload(type)
  } else {
    // まだレンダリング中 → 100ms後に再チェック
    setTimeout(checkRenderingStatus, 100)
  }
}
