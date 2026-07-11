import { state, getActiveTrack } from '../state'

let canvas: HTMLCanvasElement | null = null
let animationFrame: number | null = null

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
  drawWaveform(canvas, track.originalBuffer)

  // ウィンドウリサイズ時に再描画
  const resizeObserver = new ResizeObserver(() => {
    if (canvas && track.originalBuffer) {
      drawWaveform(canvas, track.originalBuffer)
    }
  })
  resizeObserver.observe(container)
}

function drawWaveform(canvas: HTMLCanvasElement, buffer: AudioBuffer) {
  const ctx = canvas.getContext('2d')!
  const rect = canvas.getBoundingClientRect()
  const dpr = window.devicePixelRatio || 1

  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr
  ctx.scale(dpr, dpr)

  const width = rect.width
  const height = rect.height
  const centerY = height / 2

  // 背景をクリア
  ctx.fillStyle = state.theme === 'dark' ? '#1e1e2e' : '#f8fafc'
  ctx.fillRect(0, 0, width, height)

  // 中心線
  ctx.strokeStyle = state.theme === 'dark' ? '#3d3d5c' : '#e2e8f0'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(0, centerY)
  ctx.lineTo(width, centerY)
  ctx.stroke()

  // 波形データを間引いて描画
  const data = buffer.getChannelData(0)
  const step = Math.ceil(data.length / width)
  const amp = height / 2

  ctx.fillStyle = state.theme === 'dark' ? '#7c3aed' : '#6d28d9'
  ctx.beginPath()

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

    const yMin = (1 + min) * amp
    const yMax = (1 + max) * amp

    ctx.fillRect(i, yMax, 1, yMin - yMax || 1)
  }

  ctx.fill()
}

export function updateWaveformProgress(progress: number) {
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  const width = rect.width

  // 再生位置に合わせてプログレスを再描画
  drawWaveform(canvas, getActiveTrack()!.originalBuffer!)

  // プログレスオーバーレイ
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = state.theme === 'dark' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)'
  ctx.fillRect(0, 0, width * progress, canvas.height / (window.devicePixelRatio || 1))
}

export function clearWaveform() {
  if (animationFrame) {
    cancelAnimationFrame(animationFrame)
    animationFrame = null
  }
  canvas = null
}
