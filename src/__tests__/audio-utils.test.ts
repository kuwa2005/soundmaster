import { describe, it, expect } from 'vitest'

// audio-utils の関数をテスト用に抽出
function getPeak(buffer: AudioBuffer): number {
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

function getRms(buffer: AudioBuffer): number {
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

// テスト用のAudioBufferを作成するヘルパー
function createTestBuffer(channels: number, length: number, sampleRate: number = 44100): AudioBuffer {
  const channelData: Float32Array[] = []
  for (let ch = 0; ch < channels; ch++) {
    channelData.push(new Float32Array(length))
  }

  const buffer = {
    numberOfChannels: channels,
    length: length,
    sampleRate: sampleRate,
    duration: length / sampleRate,
    getChannelData: function(channel: number): Float32Array {
      return channelData[channel]
    },
  } as unknown as AudioBuffer

  return buffer
}

describe('Audio Utilities', () => {
  describe('Peak Detection', () => {
    it('should detect peak in single channel audio', () => {
      const buffer = createTestBuffer(1, 100)
      const data = buffer.getChannelData(0)
      data[50] = 0.8
      data[51] = -0.9

      const peak = getPeak(buffer)
      expect(peak).toBeCloseTo(0.9, 5)
    })

    it('should detect peak across multiple channels', () => {
      const buffer = createTestBuffer(2, 100)
      const ch0 = buffer.getChannelData(0)
      const ch1 = buffer.getChannelData(1)
      ch0[50] = 0.5
      ch1[50] = -0.7

      const peak = getPeak(buffer)
      expect(peak).toBeCloseTo(0.7, 5)
    })

    it('should return 0 for silent audio', () => {
      const buffer = createTestBuffer(1, 100)
      const peak = getPeak(buffer)
      expect(peak).toBe(0)
    })

    it('should handle DC offset', () => {
      const buffer = createTestBuffer(1, 100)
      const data = buffer.getChannelData(0)
      data.fill(0.5)

      const peak = getPeak(buffer)
      expect(peak).toBeCloseTo(0.5, 5)
    })

    it('should handle full scale audio', () => {
      const buffer = createTestBuffer(1, 100)
      const data = buffer.getChannelData(0)
      data[0] = 1.0
      data[1] = -1.0

      const peak = getPeak(buffer)
      expect(peak).toBe(1.0)
    })
  })

  describe('RMS Calculation', () => {
    it('should calculate RMS for sine wave', () => {
      const buffer = createTestBuffer(1, 44100)
      const data = buffer.getChannelData(0)
      const amplitude = 0.5

      // Generate sine wave
      for (let i = 0; i < 44100; i++) {
        data[i] = amplitude * Math.sin(2 * Math.PI * 440 * i / 44100)
      }

      const rms = getRms(buffer)
      // RMS of sine wave = amplitude / sqrt(2)
      expect(rms).toBeCloseTo(amplitude / Math.sqrt(2), 2)
    })

    it('should return 0 for silent audio', () => {
      const buffer = createTestBuffer(1, 100)
      const rms = getRms(buffer)
      expect(rms).toBe(0)
    })

    it('should calculate RMS for DC signal', () => {
      const buffer = createTestBuffer(1, 100)
      const data = buffer.getChannelData(0)
      data.fill(0.5)

      const rms = getRms(buffer)
      expect(rms).toBeCloseTo(0.5, 5)
    })

    it('should handle multi-channel audio', () => {
      const buffer = createTestBuffer(2, 100)
      const ch0 = buffer.getChannelData(0)
      const ch1 = buffer.getChannelData(1)
      ch0.fill(0.5)
      ch1.fill(-0.5)

      const rms = getRms(buffer)
      expect(rms).toBeCloseTo(0.5, 5)
    })

    it('should be less than or equal to peak', () => {
      const buffer = createTestBuffer(1, 100)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < 100; i++) {
        data[i] = Math.sin(i / 10)
      }

      const peak = getPeak(buffer)
      const rms = getRms(buffer)
      expect(rms).toBeLessThanOrEqual(peak)
    })
  })
})
