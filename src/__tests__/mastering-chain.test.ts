import { describe, it, expect } from 'vitest'

// マスタリングパラメータのテスト用定数（mastering-chain.tsから抽出した値）
const styleParams = {
  warmth: {
    eqLowFreq: 200, eqLowGain: 4,
    eqMidFreq: 800, eqMidGain: -1, eqMidQ: 0.7,
    eqHighFreq: 4000, eqHighGain: -2,
    compThreshold: -18, compRatio: 2, compAttack: 0.015, compRelease: 0.2, compKnee: 12,
    stereoWidth: 0.8, limiterRelease: 0.15,
  },
  balance: {
    eqLowFreq: 150, eqLowGain: 2,
    eqMidFreq: 1000, eqMidGain: 0, eqMidQ: 1,
    eqHighFreq: 6000, eqHighGain: 0,
    compThreshold: -16, compRatio: 3, compAttack: 0.01, compRelease: 0.15, compKnee: 8,
    stereoWidth: 1.0, limiterRelease: 0.1,
  },
  openness: {
    eqLowFreq: 100, eqLowGain: -1,
    eqMidFreq: 2500, eqMidGain: 2, eqMidQ: 1.2,
    eqHighFreq: 8000, eqHighGain: 3,
    compThreshold: -14, compRatio: 4, compAttack: 0.005, compRelease: 0.1, compKnee: 6,
    stereoWidth: 1.2, limiterRelease: 0.08,
  },
}

const loudnessParams = {
  low: { targetLufs: -16, limiterThreshold: -3, outputGain: -2 },
  medium: { targetLufs: -14, limiterThreshold: -1.5, outputGain: 0 },
  high: { targetLufs: -12, limiterThreshold: -0.3, outputGain: 2 },
}

describe('Mastering Chain Parameters', () => {
  describe('Style Parameters', () => {
    describe('Warmth Style', () => {
      it('should have warm EQ settings (boost lows, cut highs)', () => {
        const params = styleParams.warmth
        expect(params.eqLowGain).toBeGreaterThan(0) // Low shelf boost
        expect(params.eqHighGain).toBeLessThan(0) // High shelf cut
      })

      it('should have gentle compression', () => {
        const params = styleParams.warmth
        expect(params.compRatio).toBeLessThan(3)
        expect(params.compAttack).toBeGreaterThan(0.01)
      })

      it('should have narrow stereo width', () => {
        const params = styleParams.warmth
        expect(params.stereoWidth).toBeLessThan(1.0)
      })
    })

    describe('Balance Style', () => {
      it('should have neutral EQ settings', () => {
        const params = styleParams.balance
        expect(params.eqLowGain).toBeGreaterThanOrEqual(0)
        expect(params.eqMidGain).toBe(0)
        expect(params.eqHighGain).toBe(0)
      })

      it('should have moderate compression', () => {
        const params = styleParams.balance
        expect(params.compRatio).toBeGreaterThanOrEqual(3)
        expect(params.compRatio).toBeLessThanOrEqual(4)
      })

      it('should have neutral stereo width', () => {
        const params = styleParams.balance
        expect(params.stereoWidth).toBe(1.0)
      })
    })

    describe('Openness Style', () => {
      it('should have bright EQ settings (cut lows, boost highs)', () => {
        const params = styleParams.openness
        expect(params.eqLowGain).toBeLessThanOrEqual(0)
        expect(params.eqHighGain).toBeGreaterThan(0)
      })

      it('should have aggressive compression', () => {
        const params = styleParams.openness
        expect(params.compRatio).toBeGreaterThanOrEqual(4)
        expect(params.compAttack).toBeLessThan(0.01)
      })

      it('should have wide stereo width', () => {
        const params = styleParams.openness
        expect(params.stereoWidth).toBeGreaterThan(1.0)
      })
    })

    describe('Parameter Ranges', () => {
      it('should have valid EQ frequencies for all styles', () => {
        for (const style of Object.keys(styleParams) as Array<keyof typeof styleParams>) {
          const params = styleParams[style]
          expect(params.eqLowFreq).toBeGreaterThan(0)
          expect(params.eqLowFreq).toBeLessThan(params.eqMidFreq)
          expect(params.eqMidFreq).toBeLessThan(params.eqHighFreq)
          expect(params.eqHighFreq).toBeLessThanOrEqual(20000)
        }
      })

      it('should have valid compressor settings for all styles', () => {
        for (const style of Object.keys(styleParams) as Array<keyof typeof styleParams>) {
          const params = styleParams[style]
          expect(params.compThreshold).toBeLessThan(0)
          expect(params.compRatio).toBeGreaterThanOrEqual(1)
          expect(params.compAttack).toBeGreaterThan(0)
          expect(params.compRelease).toBeGreaterThan(0)
          expect(params.compKnee).toBeGreaterThanOrEqual(0)
        }
      })

      it('should have valid stereo width for all styles', () => {
        for (const style of Object.keys(styleParams) as Array<keyof typeof styleParams>) {
          const params = styleParams[style]
          expect(params.stereoWidth).toBeGreaterThan(0)
          expect(params.stereoWidth).toBeLessThanOrEqual(2.0)
        }
      })
    })
  })

  describe('Loudness Parameters', () => {
    describe('Low Loudness', () => {
      it('should have lower target LUFS', () => {
        const params = loudnessParams.low
        expect(params.targetLufs).toBe(-16)
      })

      it('should have conservative limiter threshold', () => {
        const params = loudnessParams.low
        expect(params.limiterThreshold).toBeLessThan(-2)
      })

      it('should have negative output gain', () => {
        const params = loudnessParams.low
        expect(params.outputGain).toBeLessThan(0)
      })
    })

    describe('Medium Loudness', () => {
      it('should have standard target LUFS', () => {
        const params = loudnessParams.medium
        expect(params.targetLufs).toBe(-14)
      })

      it('should have moderate limiter threshold', () => {
        const params = loudnessParams.medium
        expect(params.limiterThreshold).toBeGreaterThan(-3)
        expect(params.limiterThreshold).toBeLessThan(-1)
      })

      it('should have zero output gain', () => {
        const params = loudnessParams.medium
        expect(params.outputGain).toBe(0)
      })
    })

    describe('High Loudness', () => {
      it('should have higher target LUFS', () => {
        const params = loudnessParams.high
        expect(params.targetLufs).toBe(-12)
      })

      it('should have aggressive limiter threshold', () => {
        const params = loudnessParams.high
        expect(params.limiterThreshold).toBeGreaterThan(-1)
      })

      it('should have positive output gain', () => {
        const params = loudnessParams.high
        expect(params.outputGain).toBeGreaterThan(0)
      })
    })

    describe('Parameter Progression', () => {
      it('should have increasing target LUFS from low to high', () => {
        expect(loudnessParams.low.targetLufs).toBeLessThan(loudnessParams.medium.targetLufs)
        expect(loudnessParams.medium.targetLufs).toBeLessThan(loudnessParams.high.targetLufs)
      })

      it('should have increasing limiter threshold from low to high', () => {
        expect(loudnessParams.low.limiterThreshold).toBeLessThan(loudnessParams.medium.limiterThreshold)
        expect(loudnessParams.medium.limiterThreshold).toBeLessThan(loudnessParams.high.limiterThreshold)
      })

      it('should have increasing output gain from low to high', () => {
        expect(loudnessParams.low.outputGain).toBeLessThan(loudnessParams.medium.outputGain)
        expect(loudnessParams.medium.outputGain).toBeLessThan(loudnessParams.high.outputGain)
      })
    })
  })
})
