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
  lowGenAmount: number
  highGenAmount: number
}

interface LoudnessParams {
  targetLufs: number
  limiterThreshold: number
  outputGain: number
}

const styleParams: Record<string, StyleParams> = {
  warmth: {
    eqLowFreq: 150, eqLowGain: 8,
    eqMidFreq: 600, eqMidGain: -3, eqMidQ: 0.8,
    eqHighFreq: 3000, eqHighGain: -5,
    compThreshold: -20, compRatio: 3, compAttack: 0.02, compRelease: 0.25, compKnee: 12,
    stereoWidth: 0.7, limiterRelease: 0.2,
    lowGenAmount: 0.4, highGenAmount: 0.1,
  },
  balance: {
    eqLowFreq: 100, eqLowGain: 3,
    eqMidFreq: 1000, eqMidGain: 0, eqMidQ: 1,
    eqHighFreq: 8000, eqHighGain: 3,
    compThreshold: -18, compRatio: 4, compAttack: 0.01, compRelease: 0.15, compKnee: 6,
    stereoWidth: 1.0, limiterRelease: 0.1,
    lowGenAmount: 0.2, highGenAmount: 0.2,
  },
  openness: {
    eqLowFreq: 80, eqLowGain: -4,
    eqMidFreq: 3000, eqMidGain: 4, eqMidQ: 1.5,
    eqHighFreq: 10000, eqHighGain: 6,
    compThreshold: -15, compRatio: 5, compAttack: 0.003, compRelease: 0.08, compKnee: 4,
    stereoWidth: 1.4, limiterRelease: 0.06,
    lowGenAmount: 0.1, highGenAmount: 0.4,
  },
}

const loudnessParams: Record<string, LoudnessParams> = {
  low: { targetLufs: -18, limiterThreshold: -6, outputGain: -4 },
  medium: { targetLufs: -14, limiterThreshold: -3, outputGain: 0 },
  high: { targetLufs: -10, limiterThreshold: -1, outputGain: 4 },
}

// Live chain node references for real-time updates
interface LiveChainNodes {
  eqLow: BiquadFilterNode
  eqMid: BiquadFilterNode
  eqHigh: BiquadFilterNode
  compressor: DynamicsCompressorNode
  limiter: DynamicsCompressorNode
  outputGain: GainNode
  lowGenMix: GainNode
  lowGenShaper: WaveShaperNode
  lowGenSmooth: BiquadFilterNode
  highGenMix: GainNode
  highGenShaper: WaveShaperNode
  highGenShelf: BiquadFilterNode
}

let liveChainNodes: LiveChainNodes | null = null

function generateWaveShaperCurve(amount: number): Float32Array {
  const samples = 44100
  const curve = new Float32Array(samples)
  const deg = Math.PI / 180
  const drive = 3 + amount * 20

  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1
    curve[i] = (drive * x * 20 * deg) / (Math.PI + drive * Math.abs(x))
  }

  return curve
}

function createWaveShaper(ctx: OfflineAudioContext | AudioContext, amount: number): WaveShaperNode {
  const shaper = ctx.createWaveShaper()
  shaper.curve = generateWaveShaperCurve(amount)
  shaper.oversample = '4x'
  return shaper
}

function createLowGenerator(ctx: OfflineAudioContext | AudioContext, amount: number, sampleRate: number) {
  const input = ctx.createGain()
  const output = ctx.createGain()
  const mix = ctx.createGain()
  mix.gain.value = amount

  const lowpass = ctx.createBiquadFilter()
  lowpass.type = 'lowpass'
  lowpass.frequency.value = 200
  lowpass.Q.value = 1

  const shaper = createWaveShaper(ctx, amount * 2)

  const smooth = ctx.createBiquadFilter()
  smooth.type = 'lowpass'
  smooth.frequency.value = 400
  smooth.Q.value = 0.7

  input.connect(lowpass)
  lowpass.connect(shaper)
  shaper.connect(smooth)
  smooth.connect(mix)
  mix.connect(output)

  return { input, output, shaper, smooth }
}

function createHighGenerator(ctx: OfflineAudioContext | AudioContext, amount: number, sampleRate: number) {
  const input = ctx.createGain()
  const output = ctx.createGain()
  const mix = ctx.createGain()
  mix.gain.value = amount

  const highpass = ctx.createBiquadFilter()
  highpass.type = 'highpass'
  highpass.frequency.value = 4000
  highpass.Q.value = 1

  const shaper = createWaveShaper(ctx, amount * 2)

  const shelf = ctx.createBiquadFilter()
  shelf.type = 'highshelf'
  shelf.frequency.value = 8000
  shelf.gain.value = amount * 6

  input.connect(highpass)
  highpass.connect(shaper)
  shaper.connect(shelf)
  shelf.connect(mix)
  mix.connect(output)

  return { input, output, shaper, shelf }
}

let renderVersion = 0

export async function rebuildMasteringChain() {
  const track = getActiveTrack()
  if (!track?.originalBuffer) return

  // 新しいレンダリング開始時にカウンターをインクリメント
  const thisVersion = ++renderVersion

  track.status = 'mastering'
  notify()

  try {
    const buffer = track.originalBuffer
    const targetSampleRate = state.outputSampleRate

    const oversampleRate = targetSampleRate > buffer.sampleRate ? 2 : 1
    const renderSampleRate = buffer.sampleRate * oversampleRate

    const offlineCtx = new OfflineAudioContext(
      buffer.numberOfChannels,
      Math.ceil(buffer.length * (renderSampleRate / buffer.sampleRate)),
      renderSampleRate
    )

    const source = offlineCtx.createBufferSource()
    source.buffer = buffer

    const chain = createDSPChain(offlineCtx, state.style, state.loudness)
    source.connect(chain.input)
    chain.output.connect(offlineCtx.destination)
    source.start(0)

    let rendered = await offlineCtx.startRendering()

    // 古いレンダリング結果は無視
    if (thisVersion !== renderVersion) return

    if (renderSampleRate !== targetSampleRate) {
      rendered = await downsampleBuffer(rendered, targetSampleRate)
    }

    // ダウンサンプル後にもう一度チェック
    if (thisVersion !== renderVersion) return

    track.masteredBuffer = rendered
    track.status = 'done'
    notify()
  } catch (e) {
    console.error('Mastering failed:', e)
    if (thisVersion === renderVersion) {
      track.status = 'error'
      notify()
    }
  }
}

async function downsampleBuffer(buffer: AudioBuffer, targetSampleRate: number): Promise<AudioBuffer> {
  const offlineCtx = new OfflineAudioContext(
    buffer.numberOfChannels,
    Math.ceil(buffer.length * (targetSampleRate / buffer.sampleRate)),
    targetSampleRate
  )

  const source = offlineCtx.createBufferSource()
  source.buffer = buffer
  source.connect(offlineCtx.destination)
  source.start(0)

  return offlineCtx.startRendering()
}

function createDSPChain(ctx: OfflineAudioContext | AudioContext, style: string, loudness: string) {
  const sp = styleParams[style]
  const lp = loudnessParams[loudness]
  const sampleRate = ctx.sampleRate || 44100

  const lowGenAmount = state.lowGenAmount
  const highGenAmount = state.highGenAmount

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

  const lowGen = createLowGenerator(ctx, lowGenAmount, sampleRate)
  const lowGenMix = ctx.createGain()
  lowGenMix.gain.value = Math.min(lowGenAmount, 1.0) // Cap at 1.0 for mix level

  const highGen = createHighGenerator(ctx, highGenAmount, sampleRate)
  const highGenMix = ctx.createGain()
  highGenMix.gain.value = Math.min(highGenAmount, 1.0) // Cap at 1.0 for mix level

  // Generator dynamics control - prevents harsh distortion at high amounts
  const genCompressor = ctx.createDynamicsCompressor()
  genCompressor.threshold.value = -12
  genCompressor.ratio.value = 4
  genCompressor.attack.value = 0.003
  genCompressor.release.value = 0.1
  genCompressor.knee.value = 6

  // Soft limiter for generators - prevents hard clipping
  const genLimiter = ctx.createDynamicsCompressor()
  genLimiter.threshold.value = -3
  genLimiter.ratio.value = 20
  genLimiter.attack.value = 0.001
  genLimiter.release.value = 0.05
  genLimiter.knee.value = 0

  // Auto-normalization gain for high generator amounts
  const genNormGain = ctx.createGain()
  // Calculate normalization: reduce gain when amount > 100%
  const maxGenAmount = Math.max(lowGenAmount, highGenAmount)
  const normFactor = maxGenAmount > 1.0 ? 1.0 / (1.0 + (maxGenAmount - 1.0) * 0.5) : 1.0
  genNormGain.gain.value = normFactor

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

  // Store node references for real-time updates
  liveChainNodes = {
    eqLow,
    eqMid,
    eqHigh,
    compressor,
    limiter,
    outputGain: output,
    lowGenMix,
    lowGenShaper: lowGen.shaper,
    lowGenSmooth: lowGen.smooth,
    highGenMix,
    highGenShaper: highGen.shaper,
    highGenShelf: highGen.shelf,
  }

  // Main EQ chain
  input.connect(eqLow)
  eqLow.connect(eqMid)
  eqMid.connect(eqHigh)

  // Low Generator parallel path
  input.connect(lowGen.input)
  lowGen.output.connect(lowGenMix)

  // High Generator parallel path
  input.connect(highGen.input)
  highGen.output.connect(highGenMix)

  // Combine generators through dynamics control to prevent harsh distortion
  lowGenMix.connect(genCompressor)
  highGenMix.connect(genCompressor)
  genCompressor.connect(genLimiter)
  genLimiter.connect(genNormGain)
  genNormGain.connect(eqHigh)

  // To compressor and limiter
  eqHigh.connect(compressor)
  compressor.connect(limiter)
  limiter.connect(output)

  return { input, output }
}

export function createLiveDSPChain(ctx: AudioContext, style: string, loudness: string) {
  return createDSPChain(ctx, style, loudness)
}

// Real-time parameter update for live playback
export function updateLiveChainParams() {
  if (!liveChainNodes) return

  const sp = styleParams[state.style]
  const lp = loudnessParams[state.loudness]
  const now = getAudioContext().currentTime

  // Update EQ with smooth ramp
  liveChainNodes.eqLow.gain.setValueAtTime(liveChainNodes.eqLow.gain.value, now)
  liveChainNodes.eqLow.gain.linearRampToValueAtTime(sp.eqLowGain, now + 0.05)
  liveChainNodes.eqLow.frequency.setValueAtTime(sp.eqLowFreq, now)

  liveChainNodes.eqMid.gain.setValueAtTime(liveChainNodes.eqMid.gain.value, now)
  liveChainNodes.eqMid.gain.linearRampToValueAtTime(sp.eqMidGain, now + 0.05)
  liveChainNodes.eqMid.frequency.setValueAtTime(sp.eqMidFreq, now)
  liveChainNodes.eqMid.Q.setValueAtTime(sp.eqMidQ, now)

  liveChainNodes.eqHigh.gain.setValueAtTime(liveChainNodes.eqHigh.gain.value, now)
  liveChainNodes.eqHigh.gain.linearRampToValueAtTime(sp.eqHighGain, now + 0.05)
  liveChainNodes.eqHigh.frequency.setValueAtTime(sp.eqHighFreq, now)

  // Update compressor
  liveChainNodes.compressor.threshold.setValueAtTime(sp.compThreshold, now)
  liveChainNodes.compressor.ratio.setValueAtTime(sp.compRatio, now)
  liveChainNodes.compressor.attack.setValueAtTime(sp.compAttack, now)
  liveChainNodes.compressor.release.setValueAtTime(sp.compRelease, now)
  liveChainNodes.compressor.knee.setValueAtTime(sp.compKnee, now)

  // Update limiter
  liveChainNodes.limiter.threshold.setValueAtTime(lp.limiterThreshold, now)
  liveChainNodes.limiter.release.setValueAtTime(sp.limiterRelease, now)

  // Update output gain with smooth ramp
  const newGain = Math.pow(10, lp.outputGain / 20)
  liveChainNodes.outputGain.gain.setValueAtTime(liveChainNodes.outputGain.gain.value, now)
  liveChainNodes.outputGain.gain.linearRampToValueAtTime(newGain, now + 0.05)

  // Update Low Generator - mix level and shaper curve
  const lowGenAmount = state.lowGenAmount
  liveChainNodes.lowGenMix.gain.setValueAtTime(liveChainNodes.lowGenMix.gain.value, now)
  liveChainNodes.lowGenMix.gain.linearRampToValueAtTime(lowGenAmount, now + 0.02)
  liveChainNodes.lowGenShaper.curve = generateWaveShaperCurve(lowGenAmount * 2)

  // Update High Generator - mix level and shaper curve
  const highGenAmount = state.highGenAmount
  liveChainNodes.highGenMix.gain.setValueAtTime(liveChainNodes.highGenMix.gain.value, now)
  liveChainNodes.highGenMix.gain.linearRampToValueAtTime(highGenAmount, now + 0.02)
  liveChainNodes.highGenShaper.curve = generateWaveShaperCurve(highGenAmount * 2)
  liveChainNodes.highGenShelf.gain.setValueAtTime(highGenAmount * 6, now)
}

export function clearLiveChainNodes() {
  liveChainNodes = null
}
