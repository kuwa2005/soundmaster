import { getCurrentAnalyser } from './playback'

let dataArray: Float32Array | null = null

export function getCurrentLufs(): number {
  const analyserNode = getCurrentAnalyser()
  if (!analyserNode) return -Infinity

  if (!dataArray || dataArray.length !== analyserNode.fftSize) {
    dataArray = new Float32Array(analyserNode.fftSize)
  }

  analyserNode.getFloatTimeDomainData(dataArray)

  let sumSquared = 0
  for (let i = 0; i < dataArray.length; i++) {
    sumSquared += dataArray[i] * dataArray[i]
  }
  const rms = Math.sqrt(sumSquared / dataArray.length)

  if (rms === 0) return -Infinity

  // Simplified LUFS approximation
  const lufs = -0.691 + 10 * Math.log10(rms)
  return Math.max(-70, Math.min(0, lufs))
}

export function getCurrentRms(): number {
  const analyserNode = getCurrentAnalyser()
  if (!analyserNode) return -Infinity

  if (!dataArray || dataArray.length !== analyserNode.fftSize) {
    dataArray = new Float32Array(analyserNode.fftSize)
  }

  analyserNode.getFloatTimeDomainData(dataArray)

  let sumSquared = 0
  for (let i = 0; i < dataArray.length; i++) {
    sumSquared += dataArray[i] * dataArray[i]
  }
  const rms = Math.sqrt(sumSquared / dataArray.length)

  if (rms === 0) return -Infinity

  return Math.max(-70, Math.min(0, 20 * Math.log10(rms)))
}

export function getCurrentPeak(): number {
  const analyserNode = getCurrentAnalyser()
  if (!analyserNode) return -Infinity

  if (!dataArray || dataArray.length !== analyserNode.fftSize) {
    dataArray = new Float32Array(analyserNode.fftSize)
  }

  analyserNode.getFloatTimeDomainData(dataArray)

  let peak = 0
  for (let i = 0; i < dataArray.length; i++) {
    const abs = Math.abs(dataArray[i])
    if (abs > peak) peak = abs
  }

  if (peak === 0) return -Infinity

  return Math.max(-70, Math.min(0, 20 * Math.log10(peak)))
}
