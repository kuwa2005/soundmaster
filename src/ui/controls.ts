import { state, setStyle, setLoudness } from '../state'
import { rebuildMasteringChain } from '../audio/mastering-chain'

const styles = [
  { value: 'warmth' as const, label: '温もり', icon: '🔥', desc: '低音ブースト・高音カット', color: '#f97316' },
  { value: 'balance' as const, label: 'バランス', icon: '⚖️', desc: '均一で自然な調整', color: '#3b82f6' },
  { value: 'openness' as const, label: '開く', icon: '✨', desc: '高音ブースト・広がり', color: '#8b5cf6' },
]

const loudnessLevels = [
  { value: 'low' as const, label: '低', desc: '-18 LUFS', color: '#22c55e', bars: 1 },
  { value: 'medium' as const, label: '中', desc: '-14 LUFS', color: '#eab308', bars: 2 },
  { value: 'high' as const, label: '高', desc: '-10 LUFS', color: '#ef4444', bars: 3 },
]

export function renderControls(container: HTMLElement) {
  container.innerHTML = `
    <div class="flex gap-6 items-start">
      <div class="flex-1">
        <h3 class="text-xs font-semibold uppercase tracking-wider mb-3" style="color: var(--color-daw-muted);">STYLE</h3>
        <div class="flex gap-2" id="style-buttons">
          ${styles.map(s => `
            <button 
              class="style-option flex-1 px-3 py-3 rounded-lg text-left transition-all ${state.style === s.value ? 'style-selected' : ''}"
              data-style="${s.value}"
              style="border: 2px solid ${state.style === s.value ? s.color : 'var(--color-daw-border)'}; background: ${state.style === s.value ? s.color + '15' : 'var(--color-daw-panel)'};"
            >
              <div class="flex items-center gap-2 mb-1">
                <span class="text-xl">${s.icon}</span>
                <span class="text-sm font-bold" style="color: ${state.style === s.value ? s.color : 'var(--color-daw-text)'};">${s.label}</span>
              </div>
              <div class="text-xs" style="color: ${state.style === s.value ? s.color : 'var(--color-daw-muted)'};">${s.desc}</div>
            </button>
          `).join('')}
        </div>
      </div>

      <div class="w-px self-stretch" style="background: var(--color-daw-border);"></div>

      <div class="flex-1">
        <h3 class="text-xs font-semibold uppercase tracking-wider mb-3" style="color: var(--color-daw-muted);">LOUDNESS</h3>
        <div class="flex gap-2" id="loudness-buttons">
          ${loudnessLevels.map(l => `
            <button 
              class="loudness-option flex-1 px-3 py-3 rounded-lg text-center transition-all ${state.loudness === l.value ? 'loudness-selected' : ''}"
              data-loudness="${l.value}"
              style="border: 2px solid ${state.loudness === l.value ? l.color : 'var(--color-daw-border)'}; background: ${state.loudness === l.value ? l.color + '15' : 'var(--color-daw-panel)'};"
            >
              <div class="flex items-center justify-center gap-1 mb-1">
                ${Array(l.bars).fill('').map((_, i) => `
                  <div style="width: 4px; height: ${12 + i * 4}px; background: ${state.loudness === l.value ? l.color : 'var(--color-daw-muted)'}; border-radius: 2px;"></div>
                `).join('')}
              </div>
              <div class="text-sm font-bold" style="color: ${state.loudness === l.value ? l.color : 'var(--color-daw-text)'};">${l.label}</div>
              <div class="text-xs" style="color: ${state.loudness === l.value ? l.color : 'var(--color-daw-muted)'};">${l.desc}</div>
            </button>
          `).join('')}
        </div>
      </div>
    </div>
  `

  document.querySelectorAll('.style-option').forEach(btn => {
    btn.addEventListener('click', () => {
      const value = btn.getAttribute('data-style') as typeof state.style
      setStyle(value)
      rebuildMasteringChain()
    })
  })

  document.querySelectorAll('.loudness-option').forEach(btn => {
    btn.addEventListener('click', () => {
      const value = btn.getAttribute('data-loudness') as typeof state.loudness
      setLoudness(value)
      rebuildMasteringChain()
    })
  })
}
