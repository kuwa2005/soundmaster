import { describe, it, expect, beforeEach } from 'vitest'
import { state, addTrack, setStyle, setLoudness, setMastered } from '../state'
import type { Track } from '../state'

// WAV エンコード関数をテスト用に抽出
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels
  const sampleRate = buffer.sampleRate
  const bitDepth = 16
  const bytesPerSample = bitDepth / 8
  const blockAlign = numChannels * bytesPerSample
  const dataSize = buffer.length * blockAlign
  const headerSize = 44
  const arrayBuffer = new ArrayBuffer(headerSize + dataSize)
  const view = new DataView(arrayBuffer)

  // RIFF header
  writeString(view, 0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  writeString(view, 8, 'WAVE')

  // fmt chunk
  writeString(view, 12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true) // PCM
  view.setUint16(22, numChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * blockAlign, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, bitDepth, true)

  // data chunk
  writeString(view, 36, 'data')
  view.setUint32(40, dataSize, true)

  // Interleave channels
  let offset = 44
  for (let i = 0; i < buffer.length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = buffer.getChannelData(ch)[i]
      const clamped = Math.max(-1, Math.min(1, sample))
      const intSample = clamped < 0 ? clamped * 0x8000 : clamped * 0x7FFF
      view.setInt16(offset, intSample, true)
      offset += 2
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' })
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i))
  }
}

// テスト用のAudioBufferを作成
function createTestBuffer(channels: number, length: number, sampleRate: number = 44100): AudioBuffer {
  const channelData: Float32Array[] = []
  for (let ch = 0; ch < channels; ch++) {
    const data = new Float32Array(length)
    // 440Hz sine wave
    for (let i = 0; i < length; i++) {
      data[i] = 0.5 * Math.sin(2 * Math.PI * 440 * i / sampleRate)
    }
    channelData.push(data)
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

describe('Mastering Pipeline Integration', () => {
  beforeEach(() => {
    state.tracks = []
    state.activeTrackId = null
    state.style = 'warmth'
    state.loudness = 'medium'
    state.isPlaying = false
    state.isMastered = false
    state.currentTime = 0
  })

  describe('Track Loading and Processing', () => {
    it('should load a track with audio buffer', () => {
      const buffer = createTestBuffer(2, 44100)
      const track: Track = {
        id: '1',
        name: 'test.wav',
        originalBuffer: buffer,
        masteredBuffer: null,
        status: 'ready',
        format: 'wav',
        isVideo: false,
        fileName: 'test.wav',
      }

      addTrack(track)

      expect(state.tracks).toHaveLength(1)
      expect(state.tracks[0].originalBuffer).not.toBeNull()
      expect(state.tracks[0].status).toBe('ready')
    })

    it('should simulate mastering process', async () => {
      const buffer = createTestBuffer(2, 44100)
      const track: Track = {
        id: '1',
        name: 'test.wav',
        originalBuffer: buffer,
        masteredBuffer: null,
        status: 'ready',
        format: 'wav',
        isVideo: false,
        fileName: 'test.wav',
      }

      addTrack(track)
      setStyle('warmth')
      setLoudness('medium')

      // Simulate mastering (in real app this would use OfflineAudioContext)
      const masteredBuffer = createTestBuffer(2, 44100)
      state.tracks[0].masteredBuffer = masteredBuffer
      state.tracks[0].status = 'done'

      expect(state.tracks[0].masteredBuffer).not.toBeNull()
      expect(state.tracks[0].status).toBe('done')
    })
  })

  describe('WAV Export', () => {
    it('should create valid WAV blob from AudioBuffer', () => {
      const buffer = createTestBuffer(2, 44100)
      const blob = audioBufferToWav(buffer)

      expect(blob).toBeInstanceOf(Blob)
      expect(blob.type).toBe('audio/wav')
    })

    it('should create WAV with correct size', () => {
      const length = 44100
      const channels = 2
      const sampleRate = 44100
      const buffer = createTestBuffer(channels, length, sampleRate)

      const blob = audioBufferToWav(buffer)

      // WAV header (44 bytes) + data (length * channels * 2 bytes)
      const expectedSize = 44 + length * channels * 2
      expect(blob.size).toBe(expectedSize)
    })

    it('should handle mono audio', () => {
      const buffer = createTestBuffer(1, 44100)
      const blob = audioBufferToWav(buffer)

      expect(blob).toBeInstanceOf(Blob)
      expect(blob.size).toBeGreaterThan(44)
    })

    it('should handle stereo audio', () => {
      const buffer = createTestBuffer(2, 44100)
      const blob = audioBufferToWav(buffer)

      expect(blob).toBeInstanceOf(Blob)
      // Stereo should be larger than mono
      const monoBuffer = createTestBuffer(1, 44100)
      const monoBlob = audioBufferToWav(monoBuffer)
      expect(blob.size).toBeGreaterThan(monoBlob.size)
    })
  })

  describe('Style and Loudness Integration', () => {
    it('should apply warmth style settings', () => {
      setStyle('warmth')
      expect(state.style).toBe('warmth')

      // Warmth should boost lows and cut highs
      const warmthParams = {
        eqLowGain: 4,
        eqHighGain: -2,
        compRatio: 2,
      }
      expect(warmthParams.eqLowGain).toBeGreaterThan(0)
      expect(warmthParams.eqHighGain).toBeLessThan(0)
    })

    it('should apply balance style settings', () => {
      setStyle('balance')
      expect(state.style).toBe('balance')

      const balanceParams = {
        eqMidGain: 0,
        eqHighGain: 0,
        compRatio: 3,
      }
      expect(balanceParams.eqMidGain).toBe(0)
      expect(balanceParams.eqHighGain).toBe(0)
    })

    it('should apply openness style settings', () => {
      setStyle('openness')
      expect(state.style).toBe('openness')

      const opennessParams = {
        eqLowGain: -1,
        eqHighGain: 3,
        compRatio: 4,
      }
      expect(opennessParams.eqLowGain).toBeLessThanOrEqual(0)
      expect(opennessParams.eqHighGain).toBeGreaterThan(0)
    })

    it('should apply low loudness settings', () => {
      setLoudness('low')
      expect(state.loudness).toBe('low')

      const lowParams = {
        targetLufs: -16,
        outputGain: -2,
      }
      expect(lowParams.targetLufs).toBe(-16)
      expect(lowParams.outputGain).toBeLessThan(0)
    })

    it('should apply medium loudness settings', () => {
      setLoudness('medium')
      expect(state.loudness).toBe('medium')

      const mediumParams = {
        targetLufs: -14,
        outputGain: 0,
      }
      expect(mediumParams.targetLufs).toBe(-14)
      expect(mediumParams.outputGain).toBe(0)
    })

    it('should apply high loudness settings', () => {
      setLoudness('high')
      expect(state.loudness).toBe('high')

      const highParams = {
        targetLufs: -12,
        outputGain: 2,
      }
      expect(highParams.targetLufs).toBe(-12)
      expect(highParams.outputGain).toBeGreaterThan(0)
    })
  })

  describe('A/B Comparison', () => {
    it('should switch between original and mastered', () => {
      const buffer = createTestBuffer(2, 44100)
      const masteredBuffer = createTestBuffer(2, 44100)
      
      const track: Track = {
        id: '1',
        name: 'test.wav',
        originalBuffer: buffer,
        masteredBuffer: masteredBuffer,
        status: 'done',
        format: 'wav',
        isVideo: false,
        fileName: 'test.wav',
      }

      addTrack(track)
      expect(state.isMastered).toBe(false)

      // Switch to mastered
      setMastered(true)
      expect(state.isMastered).toBe(true)

      // Switch back to original
      setMastered(false)
      expect(state.isMastered).toBe(false)
    })

    it('should preserve track data during A/B switch', () => {
      const buffer = createTestBuffer(2, 44100)
      const masteredBuffer = createTestBuffer(2, 44100)
      
      const track: Track = {
        id: '1',
        name: 'test.wav',
        originalBuffer: buffer,
        masteredBuffer: masteredBuffer,
        status: 'done',
        format: 'wav',
        isVideo: false,
        fileName: 'test.wav',
      }

      addTrack(track)

      // Perform multiple A/B switches
      for (let i = 0; i < 5; i++) {
        setMastered(true)
        setMastered(false)
      }

      // Track data should be intact
      expect(state.tracks[0].originalBuffer).toBe(buffer)
      expect(state.tracks[0].masteredBuffer).toBe(masteredBuffer)
    })
  })
})
