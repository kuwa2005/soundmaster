import { state, getActiveTrack } from '../state'
import JSZip from 'jszip'

export async function exportWav(): Promise<void> {
  const track = getActiveTrack()
  if (!track?.masteredBuffer) return

  const blob = audioBufferToWav(track.masteredBuffer)
  const sampleRateLabel = getSampleRateLabel(track.masteredBuffer.sampleRate)
  downloadBlob(blob, `${track.name.replace(/\.[^.]+$/, '')}_mastered_${sampleRateLabel}.wav`)
}

export async function exportAllAsZip(): Promise<void> {
  const zip = new JSZip()
  let count = 0

  for (const track of state.tracks) {
    if (track.masteredBuffer) {
      const blob = audioBufferToWav(track.masteredBuffer)
      const sampleRateLabel = getSampleRateLabel(track.masteredBuffer.sampleRate)
      const fileName = `${track.name.replace(/\.[^.]+$/, '')}_mastered_${sampleRateLabel}.wav`
      zip.file(fileName, blob)
      count++
    }
  }

  if (count === 0) return

  const zipBlob = await zip.generateAsync({ type: 'blob' })
  downloadBlob(zipBlob, 'soundmaster_export.zip')
}

function getSampleRateLabel(sampleRate: number): string {
  if (sampleRate >= 176400) return '176k4'
  if (sampleRate >= 96000) return '96k'
  if (sampleRate >= 88200) return '88k2'
  if (sampleRate >= 48000) return '48k'
  return '44k1'
}

function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels
  const sampleRate = buffer.sampleRate
  // ハイレゾ対応: 24bitで出力
  const bitDepth = sampleRate > 48000 ? 24 : 16
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

      if (bitDepth === 24) {
        // 24bit
        const intSample = Math.round(clamped * 0x7FFFFF)
        const bytes = new Uint8Array([
          intSample & 0xFF,
          (intSample >> 8) & 0xFF,
          (intSample >> 16) & 0xFF,
        ])
        new Uint8Array(arrayBuffer, offset, 3).set(bytes)
        offset += 3
      } else {
        // 16bit
        const intSample = clamped < 0 ? clamped * 0x8000 : clamped * 0x7FFF
        view.setInt16(offset, intSample, true)
        offset += 2
      }
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' })
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i))
  }
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
