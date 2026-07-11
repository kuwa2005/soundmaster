import { state, getActiveTrack, setPlaying, setCurrentTime, notify } from '../state'
import { getAudioContext } from './decoder'
import { createLiveDSPChain } from './mastering-chain'
import { startMeterUpdates, stopMeterUpdates } from '../ui/meters'

let sourceNode: AudioBufferSourceNode | null = null
let analyserNode: AnalyserNode | null = null
let startTime = 0
let startOffset = 0
let animationFrame: number | null = null

export function playAudio(offset?: number) {
  const track = getActiveTrack()
  if (!track?.originalBuffer) return

  // 引数で指定された場合はそれを使用、そうでなければ現在のstartOffsetを使用
  const playOffset = offset !== undefined ? offset : startOffset

  stopAudio()

  const ctx = getAudioContext()
  const buffer = state.isMastered ? track.masteredBuffer : track.originalBuffer
  if (!buffer) return

  sourceNode = ctx.createBufferSource()
  sourceNode.buffer = buffer

  // Create analyser for metering
  analyserNode = ctx.createAnalyser()
  analyserNode.fftSize = 2048

  if (state.isMastered) {
    const chain = createLiveDSPChain(ctx, state.style, state.loudness)
    sourceNode.connect(chain.input)
    chain.output.connect(analyserNode)
    analyserNode.connect(ctx.destination)
  } else {
    sourceNode.connect(analyserNode)
    analyserNode.connect(ctx.destination)
  }

  sourceNode.start(0, playOffset)
  startTime = ctx.currentTime - playOffset
  startOffset = playOffset

  setPlaying(true)
  startMeterUpdates()
  updateTimeDisplay()

  sourceNode.onended = () => {
    if (state.isPlaying) {
      setPlaying(false)
      startOffset = 0
      stopMeterUpdates()
      cancelAnimationFrame(animationFrame!)
      updateTimeDisplay()
    }
  }
}

export function stopAudio() {
  if (sourceNode) {
    sourceNode.onended = null
    sourceNode.stop()
    sourceNode.disconnect()
    sourceNode = null
  }

  if (analyserNode) {
    analyserNode.disconnect()
    analyserNode = null
  }

  if (animationFrame) {
    cancelAnimationFrame(animationFrame)
    animationFrame = null
  }

  startOffset = 0
  setPlaying(false)
  setCurrentTime(0)
  stopMeterUpdates()
  updateTimeDisplay()
}

export function pauseAudio() {
  if (!sourceNode) return

  const ctx = getAudioContext()
  startOffset = ctx.currentTime - startTime

  sourceNode.onended = null
  sourceNode.stop()
  sourceNode.disconnect()
  sourceNode = null

  if (analyserNode) {
    analyserNode.disconnect()
    analyserNode = null
  }

  setPlaying(false)
  cancelAnimationFrame(animationFrame!)
  animationFrame = null
  stopMeterUpdates()
}

export function switchSource() {
  if (!state.isPlaying) return

  const ctx = getAudioContext()
  const currentOffset = ctx.currentTime - startTime

  if (sourceNode) {
    sourceNode.onended = null
    sourceNode.stop()
    sourceNode.disconnect()
    sourceNode = null
  }

  if (analyserNode) {
    analyserNode.disconnect()
    analyserNode = null
  }

  // 現在の再生位置を保持したまま切り替え
  playAudio(currentOffset)
}

export function getCurrentPlaybackTime(): number {
  if (!state.isPlaying || !sourceNode) return startOffset
  const ctx = getAudioContext()
  return ctx.currentTime - startTime
}

function updateTimeDisplay() {
  const display = document.getElementById('time-display')
  if (!display) return

  const time = getCurrentPlaybackTime()
  const minutes = Math.floor(time / 60)
  const seconds = Math.floor(time % 60)
  const ms = Math.floor((time % 1) * 1000)
  display.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(ms).padStart(3, '0')}`

  if (state.isPlaying) {
    animationFrame = requestAnimationFrame(updateTimeDisplay)
  }
}
