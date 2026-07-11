import { addTrack, Track, notify } from '../state'

let audioContext: AudioContext | null = null

export function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext()
  }
  return audioContext
}

export async function handleFileDrop(files: FileList) {
  for (const file of Array.from(files)) {
    const isVideo = file.type.startsWith('video/')
    const format = file.name.split('.').pop()?.toLowerCase() || 'unknown'

    const track: Track = {
      id: crypto.randomUUID(),
      name: file.name,
      originalBuffer: null,
      masteredBuffer: null,
      status: 'loading',
      format,
      isVideo,
      fileName: file.name,
    }

    addTrack(track)

    try {
      let buffer: AudioBuffer

      if (isVideo) {
        buffer = await extractAudioFromVideo(file)
      } else {
        buffer = await decodeAudioFile(file)
      }

      track.originalBuffer = buffer
      track.status = 'ready'
      notify()
    } catch (e) {
      console.error('Failed to decode:', file.name, e)
      track.status = 'error'
      notify()
    }
  }
}

async function decodeAudioFile(file: File): Promise<AudioBuffer> {
  const ctx = getAudioContext()
  const arrayBuffer = await file.arrayBuffer()

  try {
    return await ctx.decodeAudioData(arrayBuffer)
  } catch (e) {
    // FLAC fallback: try with different approach
    if (file.name.toLowerCase().endsWith('.flac')) {
      return await decodeFlacFallback(arrayBuffer)
    }
    throw e
  }
}

async function decodeFlacFallback(arrayBuffer: ArrayBuffer): Promise<AudioBuffer> {
  const ctx = getAudioContext()
  // Try decoding with resampled context
  const tempCtx = new OfflineAudioContext(2, 44100 * 10, 44100)
  const response = await fetch(URL.createObjectURL(new Blob([arrayBuffer])))
  const audioData = await response.arrayBuffer()
  return await ctx.decodeAudioData(audioData)
}

async function extractAudioFromVideo(file: File): Promise<AudioBuffer> {
  // Dynamic import for ffmpeg.wasm (lazy load ~25MB)
  const { FFmpeg } = await import('@ffmpeg/ffmpeg')
  const { toBlobURL } = await import('@ffmpeg/util')

  const ffmpeg = new FFmpeg()

  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm'
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  })

  const inputName = `input.${file.name.split('.').pop()}`
  await ffmpeg.writeFile(inputName, new Uint8Array(await file.arrayBuffer()))
  await ffmpeg.exec(['-i', inputName, '-vn', '-acodec', 'pcm_s16le', '-ar', '44100', '-ac', '2', 'output.wav'])

  const data = await ffmpeg.readFile('output.wav')
  const ctx = getAudioContext()
  return await ctx.decodeAudioData(new Uint8Array(data).buffer)
}
