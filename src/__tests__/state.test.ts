import { describe, it, expect, beforeEach } from 'vitest'
import { state, subscribe, notify, addTrack, removeTrack, setActiveTrack, setStyle, setLoudness, setPlaying, setMastered, setTheme, getActiveTrack } from '../state'
import type { Track } from '../state'

describe('State Management', () => {
  beforeEach(() => {
    // Reset state before each test
    state.tracks = []
    state.activeTrackId = null
    state.style = 'warmth'
    state.loudness = 'medium'
    state.isPlaying = false
    state.isMastered = false
    state.currentTime = 0
    state.theme = 'light'
  })

  describe('Initial State', () => {
    it('should have correct default values', () => {
      expect(state.tracks).toEqual([])
      expect(state.activeTrackId).toBeNull()
      expect(state.style).toBe('warmth')
      expect(state.loudness).toBe('medium')
      expect(state.isPlaying).toBe(false)
      expect(state.isMastered).toBe(false)
      expect(state.currentTime).toBe(0)
      expect(state.theme).toBe('light')
    })
  })

  describe('Track Management', () => {
    const createMockTrack = (id: string, name: string): Track => ({
      id,
      name,
      originalBuffer: null,
      masteredBuffer: null,
      status: 'ready',
      format: 'wav',
      isVideo: false,
      fileName: `${name}.wav`,
    })

    it('should add a track', () => {
      const track = createMockTrack('1', 'test.wav')
      addTrack(track)

      expect(state.tracks).toHaveLength(1)
      expect(state.tracks[0].id).toBe('1')
      expect(state.activeTrackId).toBe('1')
    })

    it('should set first track as active automatically', () => {
      const track1 = createMockTrack('1', 'first.wav')
      const track2 = createMockTrack('2', 'second.wav')

      addTrack(track1)
      expect(state.activeTrackId).toBe('1')

      addTrack(track2)
      expect(state.activeTrackId).toBe('1') // Should remain first track
    })

    it('should remove a track', () => {
      const track1 = createMockTrack('1', 'first.wav')
      const track2 = createMockTrack('2', 'second.wav')

      addTrack(track1)
      addTrack(track2)
      removeTrack('1')

      expect(state.tracks).toHaveLength(1)
      expect(state.tracks[0].id).toBe('2')
    })

    it('should update activeTrackId when active track is removed', () => {
      const track1 = createMockTrack('1', 'first.wav')
      const track2 = createMockTrack('2', 'second.wav')

      addTrack(track1)
      addTrack(track2)
      removeTrack('1')

      expect(state.activeTrackId).toBe('2')
    })

    it('should set active track', () => {
      const track1 = createMockTrack('1', 'first.wav')
      const track2 = createMockTrack('2', 'second.wav')

      addTrack(track1)
      addTrack(track2)
      setActiveTrack('2')

      expect(state.activeTrackId).toBe('2')
      expect(state.isPlaying).toBe(false)
      expect(state.isMastered).toBe(false)
      expect(state.currentTime).toBe(0)
    })

    it('should get active track', () => {
      const track1 = createMockTrack('1', 'first.wav')
      addTrack(track1)

      const active = getActiveTrack()
      expect(active?.id).toBe('1')
    })

    it('should return undefined when no active track', () => {
      const active = getActiveTrack()
      expect(active).toBeUndefined()
    })
  })

  describe('Style and Loudness', () => {
    it('should set style', () => {
      setStyle('balance')
      expect(state.style).toBe('balance')

      setStyle('openness')
      expect(state.style).toBe('openness')
    })

    it('should set loudness', () => {
      setLoudness('low')
      expect(state.loudness).toBe('low')

      setLoudness('high')
      expect(state.loudness).toBe('high')
    })
  })

  describe('Playback State', () => {
    it('should set playing state', () => {
      setPlaying(true)
      expect(state.isPlaying).toBe(true)

      setPlaying(false)
      expect(state.isPlaying).toBe(false)
    })

    it('should set mastered state', () => {
      setMastered(true)
      expect(state.isMastered).toBe(true)

      setMastered(false)
      expect(state.isMastered).toBe(false)
    })
  })

  describe('Theme', () => {
    it('should set theme', () => {
      setTheme('dark')
      expect(state.theme).toBe('dark')

      setTheme('light')
      expect(state.theme).toBe('light')
    })
  })

  describe('Subscribers', () => {
    it('should notify subscribers on state change', () => {
      let notified = false
      subscribe(() => {
        notified = true
      })

      notify()
      expect(notified).toBe(true)
    })

    it('should allow unsubscribing', () => {
      let callCount = 0
      const unsubscribe = subscribe(() => {
        callCount++
      })

      notify()
      expect(callCount).toBe(1)

      unsubscribe()
      notify()
      expect(callCount).toBe(1) // Should not increase
    })
  })
})
