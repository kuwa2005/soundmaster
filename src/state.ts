export interface Track {
  id: string
  name: string
  originalBuffer: AudioBuffer | null
  masteredBuffer: AudioBuffer | null
  status: 'loading' | 'ready' | 'mastering' | 'done' | 'error'
  format: string
  isVideo: boolean
  fileName: string
}

export interface AppState {
  tracks: Track[]
  activeTrackId: string | null
  style: 'warmth' | 'balance' | 'openness'
  loudness: 'low' | 'medium' | 'high'
  isPlaying: boolean
  isMastered: boolean
  currentTime: number
  theme: 'light' | 'dark'
}

type StateListener = (state: AppState) => void

const listeners: StateListener[] = []

export const state: AppState = {
  tracks: [],
  activeTrackId: null,
  style: 'warmth',
  loudness: 'medium',
  isPlaying: false,
  isMastered: false,
  currentTime: 0,
  theme: 'light',
}

export function subscribe(listener: StateListener) {
  listeners.push(listener)
  return () => {
    const idx = listeners.indexOf(listener)
    if (idx >= 0) listeners.splice(idx, 1)
  }
}

export function notify() {
  for (const listener of listeners) {
    listener({ ...state })
  }
}

export function addTrack(track: Track) {
  state.tracks.push(track)
  if (!state.activeTrackId) {
    state.activeTrackId = track.id
  }
  notify()
}

export function removeTrack(id: string) {
  state.tracks = state.tracks.filter(t => t.id !== id)
  if (state.activeTrackId === id) {
    state.activeTrackId = state.tracks[0]?.id ?? null
  }
  notify()
}

export function setActiveTrack(id: string) {
  state.activeTrackId = id
  state.isPlaying = false
  state.isMastered = false
  state.currentTime = 0
  notify()
}

export function setStyle(style: AppState['style']) {
  state.style = style
  notify()
}

export function setLoudness(loudness: AppState['loudness']) {
  state.loudness = loudness
  notify()
}

export function setPlaying(playing: boolean) {
  state.isPlaying = playing
  notify()
}

export function setMastered(mastered: boolean) {
  state.isMastered = mastered
}

export function setMasteredAndNotify(mastered: boolean) {
  state.isMastered = mastered
  notify()
}

export function setCurrentTime(time: number) {
  state.currentTime = time
}

export function setTheme(theme: 'light' | 'dark') {
  state.theme = theme
  notify()
}

export function getActiveTrack(): Track | undefined {
  return state.tracks.find(t => t.id === state.activeTrackId)
}
