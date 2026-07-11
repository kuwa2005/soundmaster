import { state, getActiveTrack, setPlaying, setCurrentTime, notify } from '../state'
import { getAudioContext } from './decoder'
import { createLiveDSPChain } from './mastering-chain'
import { startMeterUpdates, stopMeterUpdates } from '../ui/meters'
import { updateWaveformProgress } from '../ui/waveform'

let sourceNode: AudioBufferSourceNode | null = null
let originalGain: GainNode | null = null
let masteredGain: GainNode | null = null
let originalAnalyser: AnalyserNode | null = null
let masteredAnalyser: AnalyserNode | null = null
let originalChain: { input: AudioNode; output: AudioNode } | null = null
let masteredChain: { input: AudioNode; output: AudioNode } | null = null
let startTime = 0
let startOffset = 0
let animationFrame: number | null = null

export function playAudio(offset?: number) {
  const track = getActiveTrack()
  if (!track?.originalBuffer) return

  const playOffset = offset !== undefined ? offset : startOffset
  stopAudio()

  const ctx = getAudioContext()
  if (!track.originalBuffer) return

  // Create source
  sourceNode = ctx.createBufferSource()
  sourceNode.buffer = track.originalBuffer

  // Create gain nodes for crossfading
  originalGain = ctx.createGain()
  masteredGain = ctx.createGain()
  originalGain.gain.value = state.isMastered ? 0 : 1
  masteredGain.gain.value = state.isMastered ? 1 : 0

  // Create analysers for metering
  originalAnalyser = ctx.createAnalyser()
  originalAnalyser.fftSize = 2048
  masteredAnalyser = ctx.createAnalyser()
  masteredAnalyser.fftSize = 2048

  // Original path: source → originalGain → originalAnalyser → destination
  sourceNode.connect(originalGain)
  originalGain.connect(originalAnalyser)
  originalAnalyser.connect(ctx.destination)

  // Mastered path: source → masteredChain → masteredGain → masteredAnalyser → destination
  masteredChain = createLiveDSPChain(ctx, state.style, state.loudness)
  sourceNode.connect(masteredChain.input)
  masteredChain.output.connect(masteredGain)
  masteredGain.connect(masteredAnalyser)
  masteredAnalyser.connect(ctx.destination)

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

  originalGain?.disconnect()
  masteredGain?.disconnect()
  originalAnalyser?.disconnect()
  masteredAnalyser?.disconnect()

  originalGain = null
  masteredGain = null
  originalAnalyser = null
  masteredAnalyser = null
  originalChain = null
  masteredChain = null

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

  originalGain?.disconnect()
  masteredGain?.disconnect()
  originalAnalyser?.disconnect()
  masteredAnalyser?.disconnect()

  originalGain = null
  masteredGain = null
  originalAnalyser = null
  masteredAnalyser = null
  originalChain = null
  masteredChain = null

  setPlaying(false)
  cancelAnimationFrame(animationFrame!)
  animationFrame = null
  stopMeterUpdates()
}

export function switchToOriginal() {
  if (!originalGain || !masteredGain) return
  const ctx = getAudioContext()
  const now = ctx.currentTime
  originalGain.gain.setValueAtTime(originalGain.gain.value, now)
  masteredGain.gain.setValueAtTime(masteredGain.gain.value, now)
  originalGain.gain.linearRampToValueAtTime(1, now + 0.02)
  masteredGain.gain.linearRampToValueAtTime(0, now + 0.02)
}

export function switchToMastered() {
  if (!originalGain || !masteredGain) return
  const ctx = getAudioContext()
  const now = ctx.currentTime
  originalGain.gain.setValueAtTime(originalGain.gain.value, now)
  masteredGain.gain.setValueAtTime(masteredGain.gain.value, now)
  originalGain.gain.linearRampToValueAtTime(0, now + 0.02)
  masteredGain.gain.linearRampToValueAtTime(1, now + 0.02)
}

export function getCurrentAnalyser(): AnalyserNode | null {
  return state.isMastered ? masteredAnalyser : originalAnalyser
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

  // 波形の進行ゲージを更新
  const track = getActiveTrack()
  if (track?.originalBuffer) {
    const progress = time / track.originalBuffer.duration
    updateWaveformProgress(Math.min(1, Math.max(0, progress)))
  }

  if (state.isPlaying) {
    animationFrame = requestAnimationFrame(updateTimeDisplay)
  }
}
