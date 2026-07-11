import { state } from '../state'
import { playAudio, stopAudio, pauseAudio } from '../audio/playback'
import { switchToOriginal, switchToMastered } from '../audio/ab-switch'

export function renderTransport(container: HTMLElement) {
  const hasTrack = state.activeTrackId !== null

  container.innerHTML = `
    <div class="flex items-center gap-4">
      <div class="flex items-center gap-2">
        <button id="btn-play" class="transport-btn daw-btn daw-btn-primary px-5 py-2 font-medium ${!hasTrack ? 'opacity-50 cursor-not-allowed' : ''}" ${!hasTrack ? 'disabled' : ''}>
          ${state.isPlaying ? '⏸ Pause' : '▶ Play'}
        </button>
        <button id="btn-stop" class="transport-btn daw-btn px-4 py-2 font-medium ${!hasTrack ? 'opacity-50 cursor-not-allowed' : ''}" ${!hasTrack ? 'disabled' : ''}>
          ⏹ Stop
        </button>
      </div>

      <div class="flex-1"></div>

      <div class="flex items-center gap-3">
        <span class="text-xs font-medium" style="color: var(--color-daw-muted);">A/B</span>
        <div class="flex rounded-lg overflow-hidden" style="border: 1px solid var(--color-daw-border);">
          <button id="btn-original" class="px-3 py-1.5 text-sm font-medium transition-colors ${!state.isMastered ? 'text-white' : ''}" style="background: ${!state.isMastered ? 'var(--color-daw-accent)' : 'var(--color-daw-panel)'}; color: ${!state.isMastered ? 'white' : 'var(--color-daw-text)'};" ${!hasTrack ? 'disabled' : ''}>
            Original
          </button>
          <button id="btn-mastered" class="px-3 py-1.5 text-sm font-medium transition-colors ${state.isMastered ? 'text-white' : ''}" style="background: ${state.isMastered ? 'var(--color-daw-accent)' : 'var(--color-daw-panel)'}; color: ${state.isMastered ? 'white' : 'var(--color-daw-text)'};" ${!hasTrack ? 'disabled' : ''}>
            Mastered
          </button>
        </div>
      </div>

      <div class="flex-1"></div>

      <div id="time-display" class="font-mono text-sm tabular-nums" style="color: var(--color-daw-muted); background: var(--color-daw-panel); padding: 4px 12px; border-radius: 4px;">
        00:00.000
      </div>
    </div>
  `

  if (!hasTrack) return

  document.getElementById('btn-play')!.addEventListener('click', () => {
    if (state.isPlaying) {
      pauseAudio()
    } else {
      playAudio()
    }
  })

  document.getElementById('btn-stop')!.addEventListener('click', () => {
    stopAudio()
  })

  document.getElementById('btn-original')!.addEventListener('click', () => {
    if (!state.isMastered) return
    switchToOriginal()
  })

  document.getElementById('btn-mastered')!.addEventListener('click', () => {
    if (state.isMastered) return
    switchToMastered()
  })
}
