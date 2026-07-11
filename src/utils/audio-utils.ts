export function getPeak(buffer: AudioBuffer): number {
  let peak = 0
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const data = buffer.getChannelData(ch)
    for (let i = 0; i < data.length; i++) {
      const abs = Math.abs(data[i])
      if (abs > peak) peak = abs
    }
  }
  return peak
}

export function getRms(buffer: AudioBuffer): number {
  let sumSquared = 0
  let totalSamples = 0
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const data = buffer.getChannelData(ch)
    for (let i = 0; i < data.length; i++) {
      sumSquared += data[i] * data[i]
    }
    totalSamples += data.length
  }
  return Math.sqrt(sumSquared / totalSamples)
}

export function normalizeBuffer(buffer: AudioBuffer, targetPeak: number = 0.95): AudioBuffer {
  const currentPeak = getPeak(buffer)
  if (currentPeak === 0) return buffer

  const gain = targetPeak / currentPeak
  const ctx = new OfflineAudioContext(buffer.numberOfChannels, buffer.length, buffer.sampleRate)
  const newBuffer = ctx.createBuffer(buffer.numberOfChannels, buffer.length, buffer.sampleRate)

  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const source = buffer.getChannelData(ch)
    const dest = newBuffer.getChannelData(ch)
    for (let i = 0; i < source.length; i++) {
      dest[i] = source[i] * gain
    }
  }

  return newBuffer
}
