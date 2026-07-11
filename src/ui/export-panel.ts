import { state, getActiveTrack } from '../state'
import { exportWav, exportAllAsZip } from '../audio/exporter'

export function renderExportPanel(container: HTMLElement) {
  const track = getActiveTrack()
  const hasBuffer = track?.masteredBuffer !== null && track?.masteredBuffer !== undefined
  const isReady = track?.status === 'ready' || track?.status === 'done'

  container.innerHTML = `
    <div class="flex items-center gap-4">
      <button id="btn-export-one" class="transport-btn daw-btn px-4 py-2 font-medium ${!hasBuffer ? 'opacity-50 cursor-not-allowed' : ''}" style="background: ${hasBuffer ? 'var(--color-daw-success)' : 'var(--color-daw-panel)'}; color: ${hasBuffer ? 'white' : 'var(--color-daw-muted)'}; border-color: ${hasBuffer ? 'var(--color-daw-success)' : 'var(--color-daw-border)'};" ${!hasBuffer ? 'disabled' : ''}>
        📥 Download
      </button>
      <button id="btn-export-all" class="transport-btn daw-btn px-4 py-2 font-medium ${!hasBuffer ? 'opacity-50 cursor-not-allowed' : ''}" style="background: ${hasBuffer ? 'var(--color-daw-accent)' : 'var(--color-daw-panel)'}; color: ${hasBuffer ? 'white' : 'var(--color-daw-muted)'}; border-color: ${hasBuffer ? 'var(--color-daw-accent)' : 'var(--color-daw-border)'};" ${!hasBuffer ? 'disabled' : ''}>
        📦 Download All as ZIP
      </button>
      <div class="flex-1"></div>
      <div id="export-status" class="text-sm" style="color: var(--color-daw-muted);"></div>
    </div>
  `

  if (!hasBuffer) return

  document.getElementById('btn-export-one')!.addEventListener('click', async () => {
    const btn = document.getElementById('btn-export-one')!
    const status = document.getElementById('export-status')!
    btn.textContent = '⏳ Exporting...'
    btn.setAttribute('disabled', 'true')
    try {
      await exportWav()
      status.textContent = '✓ Done!'
    } catch (e) {
      status.textContent = '✗ Export failed'
    }
    btn.textContent = '📥 Download'
    btn.removeAttribute('disabled')
  })

  document.getElementById('btn-export-all')!.addEventListener('click', async () => {
    const btn = document.getElementById('btn-export-all')!
    const status = document.getElementById('export-status')!
    btn.textContent = '⏳ Packing...'
    btn.setAttribute('disabled', 'true')
    try {
      await exportAllAsZip()
      status.textContent = '✓ Done!'
    } catch (e) {
      status.textContent = '✗ Export failed'
    }
    btn.textContent = '📦 Download All as ZIP'
    btn.removeAttribute('disabled')
  })
}
