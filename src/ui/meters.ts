import { state } from '../state'
import { getCurrentLufs, getCurrentRms, getCurrentPeak } from '../audio/loudness-meter'

export function renderMeters(container: HTMLElement) {
  container.innerHTML = `
    <div class="meter-row flex gap-6 items-end">
      <div class="flex-1 min-w-0">
        <div class="flex justify-between text-xs mb-1.5" style="color: var(--color-daw-muted);">
          <span class="font-medium">LUFS</span>
          <span id="lufs-value" class="font-mono tabular-nums">-∞</span>
        </div>
        <div class="h-2.5 rounded-full overflow-hidden" style="background: var(--color-daw-panel);">
          <div id="lufs-bar" class="meter-bar h-full rounded-full transition-all duration-75" style="width: 0%; background: linear-gradient(90deg, #10b981, #f59e0b, #ef4444);"></div>
        </div>
      </div>

      <div class="flex-1 min-w-0">
        <div class="flex justify-between text-xs mb-1.5" style="color: var(--color-daw-muted);">
          <span class="font-medium">RMS</span>
          <span id="rms-value" class="font-mono tabular-nums">-∞</span>
        </div>
        <div class="h-2.5 rounded-full overflow-hidden" style="background: var(--color-daw-panel);">
          <div id="rms-bar" class="meter-bar h-full rounded-full transition-all duration-75" style="width: 0%; background: linear-gradient(90deg, #10b981, #f59e0b, #ef4444);"></div>
        </div>
      </div>

      <div class="flex-1 min-w-0">
        <div class="flex justify-between text-xs mb-1.5" style="color: var(--color-daw-muted);">
          <span class="font-medium">Peak</span>
          <span id="peak-value" class="font-mono tabular-nums">-∞</span>
        </div>
        <div class="h-2.5 rounded-full overflow-hidden" style="background: var(--color-daw-panel);">
          <div id="peak-bar" class="meter-bar h-full rounded-full transition-all duration-75" style="width: 0%; background: linear-gradient(90deg, #10b981, #f59e0b, #ef4444);"></div>
        </div>
      </div>
    </div>
  `

  if (state.isPlaying) {
    startMeterUpdates()
  }
}

let meterInterval: number | null = null

export function startMeterUpdates() {
  if (meterInterval) return
  meterInterval = window.setInterval(updateMeters, 50)
}

export function stopMeterUpdates() {
  if (meterInterval) {
    clearInterval(meterInterval)
    meterInterval = null
  }
  updateMeterDisplay(-Infinity, -Infinity, -Infinity)
}

function updateMeters() {
  const lufs = getCurrentLufs()
  const rms = getCurrentRms()
  const peak = getCurrentPeak()
  updateMeterDisplay(lufs, rms, peak)
}

function updateMeterDisplay(lufs: number, rms: number, peak: number) {
  const lufsEl = document.getElementById('lufs-value')
  const rmsEl = document.getElementById('rms-value')
  const peakEl = document.getElementById('peak-value')
  const lufsBar = document.getElementById('lufs-bar')
  const rmsBar = document.getElementById('rms-bar')
  const peakBar = document.getElementById('peak-bar')

  if (lufsEl) lufsEl.textContent = lufs === -Infinity ? '-∞' : `${lufs.toFixed(1)}`
  if (rmsEl) rmsEl.textContent = rms === -Infinity ? '-∞' : `${rms.toFixed(1)}`
  if (peakEl) peakEl.textContent = peak === -Infinity ? '-∞' : `${peak.toFixed(1)}`

  if (lufsBar) lufsBar.style.width = `${dbToPercent(lufs)}%`
  if (rmsBar) rmsBar.style.width = `${dbToPercent(rms)}%`
  if (peakBar) peakBar.style.width = `${dbToPercent(peak)}%`
}

function dbToPercent(db: number): number {
  if (db === -Infinity) return 0
  const minDb = -60
  const maxDb = 0
  return Math.max(0, Math.min(100, ((db - minDb) / (maxDb - minDb)) * 100))
}
