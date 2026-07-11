import { state, getActiveTrack, subscribe } from '../state'
import WaveSurfer from 'wavesurfer.js'

let wavesurfer: WaveSurfer | null = null

export function renderWaveform(container: HTMLElement) {
  const track = getActiveTrack()

  if (!track) {
    container.innerHTML = `
      <div class="h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
        <p>ファイルを読み込んでください</p>
      </div>
    `
    return
  }

  container.innerHTML = `
    <div id="waveform" class="h-full"></div>
  `

  if (wavesurfer) {
    wavesurfer.destroy()
  }

  const waveformEl = document.getElementById('waveform')!
  wavesurfer = WaveSurfer.create({
    container: waveformEl,
    waveColor: '#94a3b8',
    progressColor: '#3b82f6',
    cursorColor: '#ef4444',
    height: 200,
    normalize: true,
  })

  if (track.originalBuffer) {
    wavesurfer.loadBlob(bufferToBlob(track.originalBuffer))
  }
}

function bufferToBlob(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels
  const sampleRate = buffer.sampleRate
  const format = 1 // PCM
  const bitDepth = 16

  const bytesPerSample = bitDepth / 8
  const blockAlign = numChannels * bytesPerSample
  const dataSize = buffer.length * blockAlign
  const headerSize = 44
  const arrayBuffer = new ArrayBuffer(headerSize + dataSize)
  const view = new DataView(arrayBuffer)

  writeString(view, 0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  writeString(view, 8, 'WAVE')
  writeString(view, 12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, format, true)
  view.setUint16(22, numChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * blockAlign, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, bitDepth, true)
  writeString(view, 36, 'data')
  view.setUint32(40, dataSize, true)

  let offset = 44
  for (let i = 0; i < buffer.length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = buffer.getChannelData(ch)[i]
      const clamped = Math.max(-1, Math.min(1, sample))
      view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7FFF, true)
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

export function getWaveSurfer(): WaveSurfer | null {
  return wavesurfer
}
