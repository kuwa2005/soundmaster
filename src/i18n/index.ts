export type Locale = 'ja' | 'en'

export const translations: Record<Locale, Record<string, string>> = {
  ja: {
    // Header
    'app.title': 'SoundMaster',
    'app.subtitle': 'Web Mastering Tool',

    // Track List
    'tracks.title': 'TRACKS',
    'tracks.empty': 'ファイルをドロップしてください',
    'tracks.dropHint': 'または下のドロップゾーン',
    'tracks.addHint': '+ ここにファイルドロップで追加',

    // Controls
    'style.title': 'STYLE',
    'style.warmth': '温もり',
    'style.warmth.desc': '低音ブースト・高音カット',
    'style.balance': 'バランス',
    'style.balance.desc': '均一で自然な調整',
    'style.openness': '開く',
    'style.openness.desc': '高音ブースト・広がり',

    'loudness.title': 'LOUDNESS',
    'loudness.low': '低',
    'loudness.low.desc': '-18 LUFS',
    'loudness.medium': '中',
    'loudness.medium.desc': '-14 LUFS',
    'loudness.high': '高',
    'loudness.high.desc': '-10 LUFS',

    'samplerate.title': 'SAMPLE RATE',
    'samplerate.hires': 'Hi-Res',
    'samplerate.cd': 'CD品質',
    'samplerate.video': '映像標準',

    'generator.low': 'LOW GENERATOR',
    'generator.low.desc': '低音のハーモニック追加',
    'generator.high': 'HIGH GENERATOR',
    'generator.high.desc': '高音のハーモニック追加',
    'generator.off': 'OFF',
    'generator.max': '300%',

    // Transport
    'transport.play': '▶ Play',
    'transport.pause': '⏸ Pause',
    'transport.stop': '⏹ Stop',
    'transport.original': 'Original',
    'transport.mastered': 'Mastered',

    // Export
    'export.download': '📥 Download',
    'export.downloadAll': '📦 Download All as ZIP',
    'export.rendering': '⏳ Exporting...',
    'export.packing': '⏳ Packing...',
    'export.done': '✓ Done!',
    'export.failed': '✗ Export failed',

    // Rendering Dialog
    'rendering.title': 'レンダリング中...',
    'rendering.desc': 'マスタリング処理を実行しています。\n完了後、自動的にダウンロードが開始されます。',
    'rendering.cancel': 'キャンセル',

    // Dropzone
    'dropzone.label': '音声・動画ファイルをドロップ',
    'dropzone.formats': 'WAV, MP3, FLAC, OGG, AIFF, MP4, MOV, AVI',

    // Waveform
    'waveform.empty': 'ファイルを読み込んでください',

    // Status
    'status.loading': '読み込み中...',
    'status.ready': '準備完了',
    'status.mastering': 'マスタリング中...',
    'status.done': '完了',
    'status.error': 'エラー',
  },
  en: {
    // Header
    'app.title': 'SoundMaster',
    'app.subtitle': 'Web Mastering Tool',

    // Track List
    'tracks.title': 'TRACKS',
    'tracks.empty': 'Drop files here',
    'tracks.dropHint': 'or use the dropzone below',
    'tracks.addHint': '+ Drop files here to add',

    // Controls
    'style.title': 'STYLE',
    'style.warmth': 'Warmth',
    'style.warmth.desc': 'Low boost, high cut',
    'style.balance': 'Balance',
    'style.balance.desc': 'Flat and natural',
    'style.openness': 'Open',
    'style.openness.desc': 'High boost, airiness',

    'loudness.title': 'LOUDNESS',
    'loudness.low': 'Low',
    'loudness.low.desc': '-18 LUFS',
    'loudness.medium': 'Med',
    'loudness.medium.desc': '-14 LUFS',
    'loudness.high': 'High',
    'loudness.high.desc': '-10 LUFS',

    'samplerate.title': 'SAMPLE RATE',
    'samplerate.hires': 'Hi-Res',
    'samplerate.cd': 'CD Quality',
    'samplerate.video': 'Video Standard',

    'generator.low': 'LOW GENERATOR',
    'generator.low.desc': 'Add low harmonics',
    'generator.high': 'HIGH GENERATOR',
    'generator.high.desc': 'Add high harmonics',
    'generator.off': 'OFF',
    'generator.max': '300%',

    // Transport
    'transport.play': '▶ Play',
    'transport.pause': '⏸ Pause',
    'transport.stop': '⏹ Stop',
    'transport.original': 'Original',
    'transport.mastered': 'Mastered',

    // Export
    'export.download': '📥 Download',
    'export.downloadAll': '📦 Download All as ZIP',
    'export.rendering': '⏳ Exporting...',
    'export.packing': '⏳ Packing...',
    'export.done': '✓ Done!',
    'export.failed': '✗ Export failed',

    // Rendering Dialog
    'rendering.title': 'Rendering...',
    'rendering.desc': 'Processing mastering.\nDownload will start automatically when complete.',
    'rendering.cancel': 'Cancel',

    // Dropzone
    'dropzone.label': 'Drop audio/video files here',
    'dropzone.formats': 'WAV, MP3, FLAC, OGG, AIFF, MP4, MOV, AVI',

    // Waveform
    'waveform.empty': 'Please load a file',

    // Status
    'status.loading': 'Loading...',
    'status.ready': 'Ready',
    'status.mastering': 'Mastering...',
    'status.done': 'Done',
    'status.error': 'Error',
  },
}

let currentLocale: Locale = 'ja'

export function detectLocale(): Locale {
  const browserLang = navigator.language || navigator.languages?.[0] || 'ja'
  if (browserLang.startsWith('en')) {
    return 'en'
  }
  return 'ja'
}

export function setLocale(locale: Locale) {
  currentLocale = locale
}

export function getLocale(): Locale {
  return currentLocale
}

export function t(key: string): string {
  return translations[currentLocale][key] || key
}

export function initI18n() {
  currentLocale = detectLocale()
}
