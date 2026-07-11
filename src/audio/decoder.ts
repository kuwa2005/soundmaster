import { addTrack, Track, notify, getActiveTrack } from '../state'
import { rebuildMasteringChain } from './mastering-chain'

let audioContext: AudioContext | null = null

export function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext()
  }
  return audioContext
}

export async function handleFileDrop(files: FileList) {
  const fileArray = Array.from(files)

  // まず全てのトラックを即座にUIに追加
  const tracks: Track[] = fileArray.map(file => {
    const isVideo = file.type.startsWith('video/')
    const format = file.name.split('.').pop()?.toLowerCase() || 'unknown'

    return {
      id: crypto.randomUUID(),
      name: file.name,
      originalBuffer: null,
      masteredBuffer: null,
      status: 'loading' as const,
      format,
      isVideo,
      fileName: file.name,
    }
  })

  // 全トラックを一括追加してUI更新
  for (const track of tracks) {
    addTrack(track)
  }

  // 各ファイルを並列でデコード
  const decodePromises = fileArray.map(async (file, index) => {
    const track = tracks[index]
    try {
      let buffer: AudioBuffer

      if (track.isVideo) {
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
  })

  // デコード完了を待つ
  await Promise.all(decodePromises)

  // 最初のトラックをアクティブに設定
  if (tracks.length > 0 && tracks[0].originalBuffer) {
    // マスタリングを実行（非同期、ブロックしない）
    rebuildMasteringChain()
  }
}

async function decodeAudioFile(file: File): Promise<AudioBuffer> {
  const ctx = getAudioContext()
  const arrayBuffer = await file.arrayBuffer()

  try {
    return await ctx.decodeAudioData(arrayBuffer)
  } catch (e) {
    if (file.name.toLowerCase().endsWith('.flac')) {
      return await decodeFlacFallback(arrayBuffer)
    }
    throw e
  }
}

async function decodeFlacFallback(arrayBuffer: ArrayBuffer): Promise<AudioBuffer> {
  const ctx = getAudioContext()
  const response = await fetch(URL.createObjectURL(new Blob([arrayBuffer])))
  const audioData = await response.arrayBuffer()
  return await ctx.decodeAudioData(audioData)
}

async function extractAudioFromVideo(file: File): Promise<AudioBuffer> {
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
