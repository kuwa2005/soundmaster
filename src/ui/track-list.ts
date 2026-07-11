import { state, setActiveTrack, removeTrack } from '../state'

export function renderTrackList(container: HTMLElement) {
  if (state.tracks.length === 0) {
    container.innerHTML = `
      <div class="p-6 text-center" style="color: var(--color-daw-muted);">
        <span class="text-4xl block mb-3 opacity-30">🎵</span>
        <p class="text-sm">ファイルをドロップしてください</p>
      </div>
    `
    return
  }

  container.innerHTML = `
    <div class="p-3">
      <div class="flex items-center justify-between mb-3 px-2">
        <h3 class="text-xs font-semibold uppercase tracking-wider" style="color: var(--color-daw-muted);">
          TRACKS
        </h3>
        <span class="text-xs px-2 py-0.5 rounded" style="background: var(--color-daw-panel); color: var(--color-daw-muted);">
          ${state.tracks.length}
        </span>
      </div>
      <ul id="track-list-items" class="space-y-1">
      </ul>
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
