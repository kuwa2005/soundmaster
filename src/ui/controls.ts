import { state, setStyle, setLoudness } from '../state'
import { rebuildMasteringChain } from '../audio/mastering-chain'

const styles = [
  { value: 'warmth' as const, label: '温もり', icon: '🔥', desc: '低音を温かく、高音を柔らかく' },
  { value: 'balance' as const, label: 'バランス', icon: '⚖️', desc: '全体的に均一な調整' },
  { value: 'openness' as const, label: '開く', icon: '✨', desc: '高音域を広げ、明るく' },
]

const loudnessLevels = [
  { value: 'low' as const, label: '低', desc: '自然な音圧' },
  { value: 'medium' as const, label: '中', desc: '標準的なマスタリング' },
  { value: 'high' as const, label: '高', desc: 'コンペティティブな音圧' },
]

export function renderControls(container: HTMLElement) {
  container.innerHTML = `
    <div class="flex gap-8 items-start">
      <div class="flex-1">
        <h3 class="text-xs font-semibold uppercase tracking-wider mb-3" style="color: var(--color-daw-muted);">STYLE</h3>
        <div class="flex gap-2" id="style-buttons">
          ${styles.map(s => `
            <button 
              class="option-btn flex-1 px-3 py-3 rounded-lg text-left ${state.style === s.value ? 'selected' : ''}"
              data-style="${s.value}"
            >
              <div class="flex items-center gap-2 mb-1">
                <span class="text-lg">${s.icon}</span>
                <span class="text-sm font-semibold" style="color: var(--color-daw-text);">${s.label}</span>
              </div>
              <div class="text-xs" style="color: var(--color-daw-muted);">${s.desc}</div>
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
              class="option-btn flex-1 px-3 py-3 rounded-lg text-center ${state.loudness === l.value ? 'selected' : ''}"
              data-loudness="${l.value}"
            >
              <div class="text-sm font-semibold mb-1" style="color: var(--color-daw-text);">${l.label}</div>
              <div class="text-xs" style="color: var(--color-daw-muted);">${l.desc}</div>
            </button>
          `).join('')}
        </div>
      </div>
    </div>
  `

  document.querySelectorAll('.style-btn, .option-btn[data-style]').forEach(btn => {
    btn.addEventListener('click', () => {
      const value = btn.getAttribute('data-style') as typeof state.style
      setStyle(value)
      rebuildMasteringChain()
    })
  })

  document.querySelectorAll('.loudness-btn, .option-btn[data-loudness]').forEach(btn => {
    btn.addEventListener('click', () => {
      const value = btn.getAttribute('data-loudness') as typeof state.loudness
      setLoudness(value)
      rebuildMasteringChain()
    })
  })
}
