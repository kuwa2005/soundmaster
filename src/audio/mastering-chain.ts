import { state, getActiveTrack, notify } from '../state'
import { getAudioContext } from './decoder'

interface StyleParams {
  eqLowFreq: number
  eqLowGain: number
  eqMidFreq: number
  eqMidGain: number
  eqMidQ: number
  eqHighFreq: number
  eqHighGain: number
  compThreshold: number
  compRatio: number
  compAttack: number
  compRelease: number
  compKnee: number
  stereoWidth: number
  limiterRelease: number
}

interface LoudnessParams {
  targetLufs: number
  limiterThreshold: number
  outputGain: number
}

const styleParams: Record<string, StyleParams> = {
  warmth: {
    eqLowFreq: 200, eqLowGain: 4,
    eqMidFreq: 800, eqMidGain: -1, eqMidQ: 0.7,
    eqHighFreq: 4000, eqHighGain: -2,
    compThreshold: -18, compRatio: 2, compAttack: 0.015, compRelease: 0.2, compKnee: 12,
    stereoWidth: 0.8, limiterRelease: 0.15,
  },
  balance: {
    eqLowFreq: 150, eqLowGain: 2,
    eqMidFreq: 1000, eqMidGain: 0, eqMidQ: 1,
    eqHighFreq: 6000, eqHighGain: 0,
    compThreshold: -16, compRatio: 3, compAttack: 0.01, compRelease: 0.15, compKnee: 8,
    stereoWidth: 1.0, limiterRelease: 0.1,
  },
  openness: {
    eqLowFreq: 100, eqLowGain: -1,
    eqMidFreq: 2500, eqMidGain: 2, eqMidQ: 1.2,
    eqHighFreq: 8000, eqHighGain: 3,
    compThreshold: -14, compRatio: 4, compAttack: 0.005, compRelease: 0.1, compKnee: 6,
    stereoWidth: 1.2, limiterRelease: 0.08,
  },
}

const loudnessParams: Record<string, LoudnessParams> = {
  low: { targetLufs: -16, limiterThreshold: -3, outputGain: -2 },
  medium: { targetLufs: -14, limiterThreshold: -1.5, outputGain: 0 },
  high: { targetLufs: -12, limiterThreshold: -0.3, outputGain: 2 },
}

export async function rebuildMasteringChain() {
  const track = getActiveTrack()
  if (!track?.originalBuffer) return

  track.status = 'mastering'
  notify()

  try {
    const ctx = getAudioContext()
    const buffer = track.originalBuffer
    const offlineCtx = new OfflineAudioContext(
      buffer.numberOfChannels,
      buffer.length,
      buffer.sampleRate
    )

    const source = offlineCtx.createBufferSource()
    source.buffer = buffer

    const chain = createDSPChain(offlineCtx, state.style, state.loudness)
    source.connect(chain.input)
    chain.output.connect(offlineCtx.destination)
    source.start(0)

    const rendered = await offlineCtx.startRendering()
    track.masteredBuffer = rendered
    track.status = 'done'
    notify()
  } catch (e) {
    console.error('Mastering failed:', e)
    track.status = 'error'
    notify()
  }
}

function createDSPChain(ctx: OfflineAudioContext | AudioContext, style: string, loudness: string) {
  const sp = styleParams[style]
  const lp = loudnessParams[loudness]

  const input = ctx.createGain()
  const output = ctx.createGain()

  // EQ: Low Shelf
  const eqLow = ctx.createBiquadFilter()
  eqLow.type = 'lowshelf'
  eqLow.frequency.value = sp.eqLowFreq
  eqLow.gain.value = sp.eqLowGain

  // EQ: Mid Peak
  const eqMid = ctx.createBiquadFilter()
  eqMid.type = 'peaking'
  eqMid.frequency.value = sp.eqMidFreq
  eqMid.gain.value = sp.eqMidGain
  eqMid.Q.value = sp.eqMidQ

  // EQ: High Shelf
  const eqHigh = ctx.createBiquadFilter()
  eqHigh.type = 'highshelf'
  eqHigh.frequency.value = sp.eqHighFreq
  eqHigh.gain.value = sp.eqHighGain

  // Compressor
  const compressor = ctx.createDynamicsCompressor()
  compressor.threshold.value = sp.compThreshold
  compressor.ratio.value = sp.compRatio
  compressor.attack.value = sp.compAttack
  compressor.release.value = sp.compRelease
  compressor.knee.value = sp.compKnee

  // Limiter (high ratio compressor)
  const limiter = ctx.createDynamicsCompressor()
  limiter.threshold.value = lp.limiterThreshold
  limiter.ratio.value = 20
  limiter.attack.value = 0.001
  limiter.release.value = sp.limiterRelease
  limiter.knee.value = 0

  // Output gain
  output.gain.value = Math.pow(10, lp.outputGain / 20)

  // Connect chain
  input.connect(eqLow)
  eqLow.connect(eqMid)
  eqMid.connect(eqHigh)
  eqHigh.connect(compressor)
  compressor.connect(limiter)
  limiter.connect(output)

  return { input, output }
}

export function createLiveDSPChain(ctx: AudioContext, style: string, loudness: string) {
  const sp = styleParams[style]
  const lp = loudnessParams[loudness]

  const input = ctx.createGain()
  const output = ctx.createGain()

  const eqLow = ctx.createBiquadFilter()
  eqLow.type = 'lowshelf'
  eqLow.frequency.value = sp.eqLowFreq
  eqLow.gain.value = sp.eqLowGain

  const eqMid = ctx.createBiquadFilter()
  eqMid.type = 'peaking'
  eqMid.frequency.value = sp.eqMidFreq
  eqMid.gain.value = sp.eqMidGain
  eqMid.Q.value = sp.eqMidQ

  const eqHigh = ctx.createBiquadFilter()
  eqHigh.type = 'highshelf'
  eqHigh.frequency.value = sp.eqHighFreq
  eqHigh.gain.value = sp.eqHighGain

  const compressor = ctx.createDynamicsCompressor()
  compressor.threshold.value = sp.compThreshold
  compressor.ratio.value = sp.compRatio
  compressor.attack.value = sp.compAttack
  compressor.release.value = sp.compRelease
  compressor.knee.value = sp.compKnee

  const limiter = ctx.createDynamicsCompressor()
  limiter.threshold.value = lp.limiterThreshold
  limiter.ratio.value = 20
  limiter.attack.value = 0.001
  limiter.release.value = sp.limiterRelease
  limiter.knee.value = 0

  output.gain.value = Math.pow(10, lp.outputGain / 20)

  input.connect(eqLow)
  eqLow.connect(eqMid)
  eqMid.connect(eqHigh)
  eqHigh.connect(compressor)
  compressor.connect(limiter)
  limiter.connect(output)

  return { input, output }
}
