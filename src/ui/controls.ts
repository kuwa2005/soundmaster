import { state, setStyle, setLoudness, setLowGenAmount, setHighGenAmount } from '../state'
import { rebuildMasteringChain, updateLiveChainParams } from '../audio/mastering-chain'

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

const styleDefaults: Record<string, { lowGen: number; highGen: number }> = {
  warmth: { lowGen: 0.4, highGen: 0.1 },
  balance: { lowGen: 0.2, highGen: 0.2 },
  openness: { lowGen: 0.1, highGen: 0.4 },
}

const SLIDER_MAX = 300

function handleStyleChange(value: typeof state.style) {
  setStyle(value)
  const defaults = styleDefaults[value]
  setLowGenAmount(defaults.lowGen)
  setHighGenAmount(defaults.highGen)

  if (state.isPlaying) {
    updateLiveChainParams()
  } else {
    rebuildMasteringChain()
  }
}

function handleLoudnessChange(value: typeof state.loudness) {
  setLoudness(value)

  if (state.isPlaying) {
    updateLiveChainParams()
  } else {
    rebuildMasteringChain()
  }
}

function handleGenChange(type: 'low' | 'high', value: number) {
  if (type === 'low') {
    setLowGenAmount(value)
  } else {
    setHighGenAmount(value)
  }

  if (state.isPlaying) {
    updateLiveChainParams()
  } else {
    rebuildMasteringChain()
  }
}

export function renderControls(container: HTMLElement) {
  const lowGen = state.lowGenAmount
  const highGen = state.highGenAmount
  const lowGenPercent = Math.round(lowGen * 100)
  const highGenPercent = Math.round(highGen * 100)

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

    <div class="mt-4 flex gap-6">
      <div class="flex-1">
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-xs font-semibold uppercase tracking-wider" style="color: var(--color-daw-muted);">
            <span style="color: #f97316;">●</span> LOW GENERATOR
          </h3>
          <span id="low-gen-value" class="text-xs font-mono" style="color: ${lowGenPercent > 100 ? '#ef4444' : '#f97316'};">${lowGenPercent}%${lowGenPercent > 100 ? ' ⚠' : ''}</span>
        </div>
        <input type="range" id="low-gen-slider" min="0" max="${SLIDER_MAX}" value="${lowGenPercent}" 
          class="w-full h-2 rounded-lg appearance-none cursor-pointer"
          style="background: linear-gradient(to right, ${lowGenPercent > 100 ? '#ef4444' : '#f97316'} ${Math.min(lowGenPercent / SLIDER_MAX * 100, 100)}%, var(--color-daw-panel) ${Math.min(lowGenPercent / SLIDER_MAX * 100, 100)}%);">
        <div class="flex justify-between text-xs mt-1" style="color: var(--color-daw-muted);">
          <span>OFF</span>
          <span>低音のハーモニック追加</span>
          <span>300%</span>
        </div>
      </div>

      <div class="flex-1">
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-xs font-semibold uppercase tracking-wider" style="color: var(--color-daw-muted);">
            <span style="color: #8b5cf6;">●</span> HIGH GENERATOR
          </h3>
          <span id="high-gen-value" class="text-xs font-mono" style="color: ${highGenPercent > 100 ? '#ef4444' : '#8b5cf6'};">${highGenPercent}%${highGenPercent > 100 ? ' ⚠' : ''}</span>
        </div>
        <input type="range" id="high-gen-slider" min="0" max="${SLIDER_MAX}" value="${highGenPercent}" 
          class="w-full h-2 rounded-lg appearance-none cursor-pointer"
          style="background: linear-gradient(to right, ${highGenPercent > 100 ? '#ef4444' : '#8b5cf6'} ${Math.min(highGenPercent / SLIDER_MAX * 100, 100)}%, var(--color-daw-panel) ${Math.min(highGenPercent / SLIDER_MAX * 100, 100)}%);">
        <div class="flex justify-between text-xs mt-1" style="color: var(--color-daw-muted);">
          <span>OFF</span>
          <span>高音のハーモニック追加</span>
          <span>300%</span>
        </div>
      </div>
    </div>
  `

  // スタイルボタン
  document.querySelectorAll('.style-option').forEach(btn => {
    btn.addEventListener('click', () => {
      const value = btn.getAttribute('data-style') as typeof state.style
      handleStyleChange(value)
    })
  })

  // 音圧ボタン
  document.querySelectorAll('.loudness-option').forEach(btn => {
    btn.addEventListener('click', () => {
      const value = btn.getAttribute('data-loudness') as typeof state.loudness
      handleLoudnessChange(value)
    })
  })

  // Low Generator スライダー
  const lowGenSlider = document.getElementById('low-gen-slider') as HTMLInputElement
  const lowGenValue = document.getElementById('low-gen-value')!
  lowGenSlider?.addEventListener('input', (e) => {
    const val = parseInt((e.target as HTMLInputElement).value) / 100
    handleGenChange('low', val)
    const percent = Math.round(val * 100)
    lowGenValue.textContent = `${percent}%${percent > 100 ? ' ⚠' : ''}`
    lowGenValue.style.color = percent > 100 ? '#ef4444' : '#f97316'
    const fillPercent = Math.min(percent / SLIDER_MAX * 100, 100)
    lowGenSlider.style.background = `linear-gradient(to right, ${percent > 100 ? '#ef4444' : '#f97316'} ${fillPercent}%, var(--color-daw-panel) ${fillPercent}%)`
  })

  // High Generator スライダー
  const highGenSlider = document.getElementById('high-gen-slider') as HTMLInputElement
  const highGenValue = document.getElementById('high-gen-value')!
  highGenSlider?.addEventListener('input', (e) => {
    const val = parseInt((e.target as HTMLInputElement).value) / 100
    handleGenChange('high', val)
    const percent = Math.round(val * 100)
    highGenValue.textContent = `${percent}%${percent > 100 ? ' ⚠' : ''}`
    highGenValue.style.color = percent > 100 ? '#ef4444' : '#8b5cf6'
    const fillPercent = Math.min(percent / SLIDER_MAX * 100, 100)
    highGenSlider.style.background = `linear-gradient(to right, ${percent > 100 ? '#ef4444' : '#8b5cf6'} ${fillPercent}%, var(--color-daw-panel) ${fillPercent}%)`
  })
}
