import { state, setActiveTrack, removeTrack } from '../state'
import { handleFileDrop } from '../audio/decoder'
import { t } from '../i18n'

export function renderTrackList(container: HTMLElement) {
  if (state.tracks.length === 0) {
    container.innerHTML = `
      <div id="track-dropzone-empty" class="p-6 text-center h-full flex flex-col items-center justify-center cursor-pointer" style="color: var(--color-daw-muted); border: 2px dashed var(--color-daw-border); border-radius: 8px; margin: 8px;">
        <span class="text-4xl block mb-3 opacity-30">🎵</span>
        <p class="text-sm">${t('tracks.empty')}</p>
        <input type="file" id="sidebar-file-input" multiple accept="audio/*,video/*" class="hidden" />
      </div>
    `
    initSidebarDropzone(container, true)
    return
  }

  container.innerHTML = `
    <div class="p-3 h-full flex flex-col">
      <div class="flex items-center justify-between mb-3 px-2">
        <h3 class="text-xs font-semibold uppercase tracking-wider" style="color: var(--color-daw-muted);">
          ${t('tracks.title')}
        </h3>
        <span class="text-xs px-2 py-0.5 rounded" style="background: var(--color-daw-panel); color: var(--color-daw-muted);">
          ${state.tracks.length}
        </span>
      </div>
      <ul id="track-list-items" class="space-y-1 flex-1 overflow-y-auto">
      </ul>
      <div id="track-dropzone-add" class="mt-3 p-3 text-center text-xs cursor-pointer" style="border: 1px dashed var(--color-daw-border); border-radius: 6px; color: var(--color-daw-muted);">
        ${t('tracks.addHint')}
        <input type="file" id="sidebar-file-input" multiple accept="audio/*,video/*" class="hidden" />
      </div>
    </div>
  `

  const list = document.getElementById('track-list-items')!
  for (const track of state.tracks) {
    const isActive = track.id === state.activeTrackId
    const statusIcon = getStatusIcon(track.status)

    const li = document.createElement('li')
    li.className = `track-item flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer ${isActive ? 'active' : ''}`

    li.innerHTML = `
      <span class="text-base">${statusIcon}</span>
      <div class="flex-1 min-w-0">
        <div class="text-sm font-medium truncate" style="color: var(--color-daw-text);">${track.name}</div>
        <div class="text-xs" style="color: var(--color-daw-muted);">${track.format.toUpperCase()}${track.isVideo ? ' (video)' : ''}</div>
      </div>
      <button class="track-remove p-1.5 rounded opacity-40 hover:opacity-100 transition-opacity" style="background: var(--color-daw-panel);" data-id="${track.id}" title="Remove">
        <span class="text-xs">✕</span>
      </button>
    `

    li.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('.track-remove')) return
      setActiveTrack(track.id)
    })

    li.querySelector('.track-remove')!.addEventListener('click', (e) => {
      e.stopPropagation()
      removeTrack(track.id)
    })

    list.appendChild(li)
  }

  initSidebarDropzone(container, false)
}

function initSidebarDropzone(container: HTMLElement, isEmpty: boolean) {
  const dropzone = isEmpty
    ? document.getElementById('track-dropzone-empty')
    : document.getElementById('track-dropzone-add')

  const fileInput = document.getElementById('sidebar-file-input') as HTMLInputElement
  if (!dropzone || !fileInput) return

  // クリックでファイル選択
  dropzone.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).tagName !== 'INPUT') {
      fileInput.click()
    }
  })

  fileInput.addEventListener('change', (e) => {
    const files = (e.target as HTMLInputElement).files
    if (files) handleFileDrop(files)
    fileInput.value = ''
  })

  // ドラッグ＆ドロップ
  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault()
    e.stopPropagation()
    dropzone.style.borderColor = 'var(--color-daw-accent)'
    dropzone.style.background = 'rgba(124, 58, 237, 0.05)'
  })

  dropzone.addEventListener('dragleave', () => {
    dropzone.style.borderColor = ''
    dropzone.style.background = ''
  })

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault()
    e.stopPropagation()
    dropzone.style.borderColor = ''
    dropzone.style.background = ''
    handleFileDrop(e.dataTransfer!.files)
  })

  // サイドバー全体にもドロップ対応（トラックがある場合も含む）
  container.addEventListener('dragover', (e) => {
    e.preventDefault()
    e.stopPropagation()
    container.style.background = 'rgba(124, 58, 237, 0.05)'
  })

  container.addEventListener('dragleave', (e) => {
    // サイドバーから離れた場合のみリセット
    if (!container.contains(e.relatedTarget as Node)) {
      container.style.background = ''
    }
  })

  container.addEventListener('drop', (e) => {
    e.preventDefault()
    e.stopPropagation()
    container.style.background = ''
    if (e.dataTransfer?.files) {
      handleFileDrop(e.dataTransfer.files)
    }
  })
}

function getStatusIcon(status: string): string {
  switch (status) {
    case 'loading': return '⏳'
    case 'ready': return '✓'
    case 'mastering': return '⚙️'
    case 'done': return '✓'
    case 'error': return '✗'
    default: return '♪'
  }
}
