import { state, getActiveTrack } from '../state'

let canvas: HTMLCanvasElement | null = null
let animationFrame: number | null = null
let waveformData: Float32Array | null = null
let canvasWidth = 0
let canvasHeight = 0

export function renderWaveform(container: HTMLElement) {
  const track = getActiveTrack()

  if (animationFrame) {
    cancelAnimationFrame(animationFrame)
    animationFrame = null
  }

  if (!track?.originalBuffer) {
    container.innerHTML = `
      <div class="h-full flex items-center justify-center" style="color: var(--color-daw-muted);">
        <p>ファイルを読み込んでください</p>
      </div>
    `
    return
  }

  container.innerHTML = `
    <canvas id="waveform-canvas" class="w-full h-full"></canvas>
  `

  canvas = document.getElementById('waveform-canvas') as HTMLCanvasElement
  cacheWaveformData(track.originalBuffer)
  drawWaveform()

  const resizeObserver = new ResizeObserver(() => {
    if (canvas && track.originalBuffer) {
      cacheWaveformData(track.originalBuffer)
      drawWaveform()
    }
  })
  resizeObserver.observe(container)
}

function cacheWaveformData(buffer: AudioBuffer) {
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  const dpr = window.devicePixelRatio || 1

  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr
  canvasWidth = rect.width
  canvasHeight = rect.height

  const data = buffer.getChannelData(0)
  const width = canvasWidth

  // Min/Maxペアをキャッシュ（間引き済み）
  waveformData = new Float32Array(width * 2)
  const step = Math.ceil(data.length / width)

  for (let i = 0; i < width; i++) {
    const start = Math.floor(i * data.length / width)
    const end = Math.min(start + step, data.length)

    let min = 1.0
    let max = -1.0

    for (let j = start; j < end; j++) {
      const val = data[j]
      if (val < min) min = val
      if (val > max) max = val
    }

    waveformData[i * 2] = min
    waveformData[i * 2 + 1] = max
  }
}

function drawWaveform(progressX?: number) {
  if (!canvas || !waveformData) return

  const ctx = canvas.getContext('2d')!
  const dpr = window.devicePixelRatio || 1
  const width = canvasWidth
  const height = canvasHeight
  const centerY = height / 2
  const amp = height / 2

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  // 背景
  ctx.fillStyle = state.theme === 'dark' ? '#1e1e2e' : '#f8fafc'
  ctx.fillRect(0, 0, width, height)

  // 中心線
  ctx.strokeStyle = state.theme === 'dark' ? '#3d3d5c' : '#e2e8f0'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(0, centerY)
  ctx.lineTo(width, centerY)
  ctx.stroke()

  // 波形描画
  const waveformColor = state.theme === 'dark' ? '#7c3aed' : '#6d28d9'
  ctx.fillStyle = waveformColor

  for (let i = 0; i < width; i++) {
    const min = waveformData[i * 2]
    const max = waveformData[i * 2 + 1]
    const yMin = (1 + min) * amp
    const yMax = (1 + max) * amp

    ctx.fillRect(i, yMax, 1, yMin - yMax || 1)
  }

  // 進行ゲージ（垂直線）
  if (progressX !== undefined && progressX >= 0) {
    // ゲージの背景ハイライト
    ctx.fillStyle = state.theme === 'dark' ? 'rgba(124, 58, 237, 0.15)' : 'rgba(109, 40, 217, 0.1)'
    ctx.fillRect(0, 0, progressX, height)

    // 垂直ライン
    ctx.strokeStyle = state.theme === 'dark' ? '#ef4444' : '#dc2626'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(progressX, 0)
    ctx.lineTo(progressX, height)
    ctx.stroke()

    // ゲージ先端のドット
    ctx.fillStyle = state.theme === 'dark' ? '#ef4444' : '#dc2626'
    ctx.beginPath()
    ctx.arc(progressX, centerY, 4, 0, Math.PI * 2)
    ctx.fill()
  }
}

export function updateWaveformProgress(progress: number) {
  if (!canvas || !waveformData) return
  const x = canvasWidth * progress
  drawWaveform(x)
}

export function clearWaveform() {
  if (animationFrame) {
    cancelAnimationFrame(animationFrame)
    animationFrame = null
  }
  canvas = null
  waveformData = null
}
