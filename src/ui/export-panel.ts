import { state, getActiveTrack } from '../state'
import { exportWav, exportAllAsZip } from '../audio/exporter'
import { t } from '../i18n'

let pendingDownload: 'one' | 'all' | null = null
let dialogElement: HTMLDivElement | null = null
let progressInterval: ReturnType<typeof setInterval> | null = null

export function renderExportPanel(container: HTMLElement) {
  const track = getActiveTrack()
  const hasBuffer = track?.masteredBuffer !== null && track?.masteredBuffer !== undefined

  container.innerHTML = `
    <div class="export-row flex items-center gap-4">
      <button id="btn-export-one" class="transport-btn daw-btn px-4 py-2 font-medium" style="background: ${hasBuffer ? 'var(--color-daw-success)' : 'var(--color-daw-panel)'}; color: ${hasBuffer ? 'white' : 'var(--color-daw-muted)'}; border-color: ${hasBuffer ? 'var(--color-daw-success)' : 'var(--color-daw-border)'};">
        ${t('export.download')}
      </button>
      <button id="btn-export-all" class="transport-btn daw-btn px-4 py-2 font-medium" style="background: ${hasBuffer ? 'var(--color-daw-accent)' : 'var(--color-daw-panel)'}; color: ${hasBuffer ? 'white' : 'var(--color-daw-muted)'}; border-color: ${hasBuffer ? 'var(--color-daw-accent)' : 'var(--color-daw-border)'};">
        ${t('export.downloadAll')}
      </button>
      <div class="flex-1 hidden sm:block"></div>
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
    executeDownload(type)
  } else {
    pendingDownload = type
    showRenderingDialog()
  }
}

async function executeDownload(type: 'one' | 'all') {
  const status = document.getElementById('export-status')

  if (type === 'one') {
    if (status) status.textContent = t('export.rendering')
    try {
      await exportWav()
      if (status) status.textContent = t('export.done')
    } catch (e) {
      if (status) status.textContent = t('export.failed')
    }
  } else {
    if (status) status.textContent = t('export.packing')
    try {
      await exportAllAsZip()
      if (status) status.textContent = t('export.done')
    } catch (e) {
      if (status) status.textContent = t('export.failed')
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
        ${t('rendering.title')}
      </h3>
      <p style="font-size: 14px; color: var(--color-daw-muted); margin-bottom: 24px; white-space: pre-line;">
        ${t('rendering.desc')}
      </p>
      <div style="
        width: 100%;
        height: 8px;
        background: var(--color-daw-panel);
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 8px;
      ">
        <div id="rendering-progress-bar" style="
          width: 0%;
          height: 100%;
          background: linear-gradient(90deg, var(--color-daw-accent), #8b5cf6);
          border-radius: 4px;
          transition: width 0.3s ease;
        "></div>
      </div>
      <div id="rendering-percent" style="
        font-size: 24px;
        font-weight: 700;
        color: var(--color-daw-accent);
        margin-bottom: 16px;
        font-family: monospace;
      ">0%</div>
      <button id="dialog-cancel" style="
        background: var(--color-daw-panel);
        border: 1px solid var(--color-daw-border);
        color: var(--color-daw-muted);
        padding: 8px 24px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
      ">
        ${t('rendering.cancel')}
      </button>
    </div>
  `

  document.body.appendChild(dialogElement)

  document.getElementById('dialog-cancel')!.addEventListener('click', () => {
    hideRenderingDialog()
  })

  // 進捗を定期的に更新
  progressInterval = setInterval(updateProgressDisplay, 100)
  checkRenderingStatus()
}

function updateProgressDisplay() {
  const progressBar = document.getElementById('rendering-progress-bar')
  const percentText = document.getElementById('rendering-percent')

  if (progressBar && percentText) {
    const progress = state.renderProgress
    progressBar.style.width = `${progress}%`
    percentText.textContent = `${progress}%`
  }
}

function hideRenderingDialog() {
  if (progressInterval) {
    clearInterval(progressInterval)
    progressInterval = null
  }
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
  const isDone = track?.status === 'done'

  if (hasBuffer && isDone && pendingDownload) {
    const type = pendingDownload
    hideRenderingDialog()
    executeDownload(type)
  } else if (!dialogElement) {
    return
  } else {
    setTimeout(checkRenderingStatus, 100)
  }
}
