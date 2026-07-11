import { state, setOutputSampleRate, OutputSampleRate } from '../state'
import { rebuildMasteringChain, updateLiveChainParams } from '../audio/mastering-chain'
import { t } from '../i18n'

const styles = [
  { value: 'warmth' as const, labelKey: 'style.warmth', descKey: 'style.warmth.desc', icon: '🔥', color: '#f97316' },
  { value: 'balance' as const, labelKey: 'style.balance', descKey: 'style.balance.desc', icon: '⚖️', color: '#3b82f6' },
  { value: 'openness' as const, labelKey: 'style.openness', descKey: 'style.openness.desc', icon: '✨', color: '#8b5cf6' },
]

const loudnessLevels = [
  { value: 'low' as const, labelKey: 'loudness.low', descKey: 'loudness.low.desc', color: '#22c55e', bars: 1 },
  { value: 'medium' as const, labelKey: 'loudness.medium', descKey: 'loudness.medium.desc', color: '#eab308', bars: 2 },
  { value: 'high' as const, labelKey: 'loudness.high', descKey: 'loudness.high.desc', color: '#ef4444', bars: 3 },
]

const sampleRates: { value: OutputSampleRate; label: string; descKey: string; isHiRes: boolean }[] = [
  { value: 44100, label: '44.1kHz', descKey: 'samplerate.cd', isHiRes: false },
  { value: 48000, label: '48kHz', descKey: 'samplerate.video', isHiRes: false },
  { value: 88200, label: '88.2kHz', descKey: 'samplerate.hires', isHiRes: true },
  { value: 96000, label: '96kHz', descKey: 'samplerate.hires', isHiRes: true },
  { value: 192000, label: '192kHz', descKey: 'samplerate.hires', isHiRes: true },
]

const SLIDER_MAX = 300

function handleStyleChange(value: typeof state.style) {
  state.style = value

  if (state.isPlaying) {
    updateLiveChainParams()
    updateStyleButtonStyles()
  } else {
    rebuildMasteringChain()
  }
}

function handleLoudnessChange(value: typeof state.loudness) {
  state.loudness = value

  if (state.isPlaying) {
    updateLiveChainParams()
    updateLoudnessButtonStyles()
  } else {
    rebuildMasteringChain()
  }
}

function updateStyleButtonStyles() {
  document.querySelectorAll('.style-option').forEach((btn: Element) => {
    const el = btn as HTMLElement
    const btnStyle = el.getAttribute('data-style')
    const s = styles.find(s => s.value === btnStyle)
    if (!s) return
    const isSelected = state.style === btnStyle
    el.style.borderColor = isSelected ? s.color : 'var(--color-daw-border)'
    el.style.background = isSelected ? s.color + '15' : 'var(--color-daw-panel)'
    const label = el.querySelector('.text-sm.font-bold') as HTMLElement
    if (label) label.style.color = isSelected ? s.color : 'var(--color-daw-text)'
  })
}

function updateLoudnessButtonStyles() {
  document.querySelectorAll('.loudness-option').forEach((btn: Element) => {
    const el = btn as HTMLElement
    const btnLoudness = el.getAttribute('data-loudness')
    const l = loudnessLevels.find(l => l.value === btnLoudness)
    if (!l) return
    const isSelected = state.loudness === btnLoudness
    el.style.borderColor = isSelected ? l.color : 'var(--color-daw-border)'
    el.style.background = isSelected ? l.color + '15' : 'var(--color-daw-panel)'
    const label = el.querySelector('.text-sm.font-bold') as HTMLElement
    if (label) label.style.color = isSelected ? l.color : 'var(--color-daw-text)'
  })
}

function handleGenChange(type: 'low' | 'high', value: number) {
  if (type === 'low') {
    state.lowGenAmount = value
  } else {
    state.highGenAmount = value
  }
  state.settingsVersion++

  if (state.isPlaying) {
    updateLiveChainParams()
  } else {
    rebuildMasteringChain()
  }
}

function handleSampleRateChange(value: OutputSampleRate) {
  setOutputSampleRate(value)
  state.settingsVersion++
  rebuildMasteringChain()
}

export function renderControls(container: HTMLElement) {
  const lowGen = state.lowGenAmount
  const highGen = state.highGenAmount
  const lowGenPercent = Math.round(lowGen * 100)
  const highGenPercent = Math.round(highGen * 100)

  container.innerHTML = `
    <div class="controls-row flex gap-6 items-start">
      <div class="flex-1 min-w-0">
        <h3 class="text-xs font-semibold uppercase tracking-wider mb-3" style="color: var(--color-daw-muted);">${t('style.title')}</h3>
        <div class="flex gap-2" id="style-buttons">
          ${styles.map(s => `
            <button
              class="style-option flex-1 px-3 py-3 rounded-lg text-left transition-all ${state.style === s.value ? 'style-selected' : ''}"
              data-style="${s.value}"
              style="border: 2px solid ${state.style === s.value ? s.color : 'var(--color-daw-border)'}; background: ${state.style === s.value ? s.color + '15' : 'var(--color-daw-panel)'};"
            >
              <div class="flex items-center gap-2 mb-1">
                <span class="text-xl">${s.icon}</span>
                <span class="text-sm font-bold" style="color: ${state.style === s.value ? s.color : 'var(--color-daw-text)'};">${t(s.labelKey)}</span>
              </div>
              <div class="text-xs hidden sm:block" style="color: ${state.style === s.value ? s.color : 'var(--color-daw-muted)'};">${t(s.descKey)}</div>
            </button>
          `).join('')}
        </div>
      </div>

      <div class="w-px self-stretch hidden md:block" style="background: var(--color-daw-border);"></div>

      <div class="flex-1 min-w-0">
        <h3 class="text-xs font-semibold uppercase tracking-wider mb-3" style="color: var(--color-daw-muted);">${t('loudness.title')}</h3>
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
              <div class="text-sm font-bold" style="color: ${state.loudness === l.value ? l.color : 'var(--color-daw-text)'};">${t(l.labelKey)}</div>
              <div class="text-xs hidden sm:block" style="color: ${state.loudness === l.value ? l.color : 'var(--color-daw-muted)'};">${t(l.descKey)}</div>
            </button>
          `).join('')}
        </div>
      </div>

      <div class="w-px self-stretch hidden md:block" style="background: var(--color-daw-border);"></div>

      <div class="flex-1 min-w-0">
        <h3 class="text-xs font-semibold uppercase tracking-wider mb-3" style="color: var(--color-daw-muted);">
          ${t('samplerate.title')}
          <span style="color: #10b981; font-size: 10px;">● ${t('samplerate.hires')}</span>
        </h3>
        <div class="samplerate-buttons flex flex-wrap gap-1" id="samplerate-buttons">
          ${sampleRates.map(sr => `
            <button
              class="samplerate-option px-2 py-1.5 rounded text-xs transition-all ${state.outputSampleRate === sr.value ? 'selected' : ''}"
              data-samplerate="${sr.value}"
              style="border: 1px solid ${state.outputSampleRate === sr.value ? (sr.isHiRes ? '#10b981' : '#3b82f6') : 'var(--color-daw-border)'}; background: ${state.outputSampleRate === sr.value ? (sr.isHiRes ? '#10b98115' : '#3b82f615') : 'var(--color-daw-panel)'};"
            >
              <div class="font-semibold" style="color: ${state.outputSampleRate === sr.value ? (sr.isHiRes ? '#10b981' : '#3b82f6') : 'var(--color-daw-text)'};">${sr.label}</div>
            </button>
          `).join('')}
        </div>
      </div>
    </div>

    <div class="generator-row mt-4 flex gap-6">
      <div class="flex-1 min-w-0">
        <div class="flex items-center justify-between mb-2">
          <h3 class="generator-label text-xs font-semibold uppercase tracking-wider" style="color: var(--color-daw-muted);">
            <span style="color: #f97316;">●</span> ${t('generator.low')}
          </h3>
          <span id="low-gen-value" class="generator-value text-xs font-mono" style="color: ${lowGenPercent > 100 ? '#ef4444' : '#f97316'};">${lowGenPercent}%${lowGenPercent > 100 ? ' ⚠' : ''}</span>
        </div>
        <input type="range" id="low-gen-slider" min="0" max="${SLIDER_MAX}" value="${lowGenPercent}"
          class="w-full h-2 rounded-lg appearance-none cursor-pointer"
          style="background: linear-gradient(to right, ${lowGenPercent > 100 ? '#ef4444' : '#f97316'} ${Math.min(lowGenPercent / SLIDER_MAX * 100, 100)}%, var(--color-daw-panel) ${Math.min(lowGenPercent / SLIDER_MAX * 100, 100)}%);">
        <div class="flex justify-between text-xs mt-1" style="color: var(--color-daw-muted);">
          <span>${t('generator.off')}</span>
          <span class="hidden sm:inline">${t('generator.low.desc')}</span>
          <span>${t('generator.max')}</span>
        </div>
      </div>

      <div class="flex-1 min-w-0">
        <div class="flex items-center justify-between mb-2">
          <h3 class="generator-label text-xs font-semibold uppercase tracking-wider" style="color: var(--color-daw-muted);">
            <span style="color: #8b5cf6;">●</span> ${t('generator.high')}
          </h3>
          <span id="high-gen-value" class="generator-value text-xs font-mono" style="color: ${highGenPercent > 100 ? '#ef4444' : '#8b5cf6'};">${highGenPercent}%${highGenPercent > 100 ? ' ⚠' : ''}</span>
        </div>
        <input type="range" id="high-gen-slider" min="0" max="${SLIDER_MAX}" value="${highGenPercent}"
          class="w-full h-2 rounded-lg appearance-none cursor-pointer"
          style="background: linear-gradient(to right, ${highGenPercent > 100 ? '#ef4444' : '#8b5cf6'} ${Math.min(highGenPercent / SLIDER_MAX * 100, 100)}%, var(--color-daw-panel) ${Math.min(highGenPercent / SLIDER_MAX * 100, 100)}%);">
        <div class="flex justify-between text-xs mt-1" style="color: var(--color-daw-muted);">
          <span>${t('generator.off')}</span>
          <span class="hidden sm:inline">${t('generator.high.desc')}</span>
          <span>${t('generator.max')}</span>
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

  // サンプルレートボタン
  document.querySelectorAll('.samplerate-option').forEach(btn => {
    btn.addEventListener('click', () => {
      const value = parseInt(btn.getAttribute('data-samplerate')!) as OutputSampleRate
      handleSampleRateChange(value)
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
