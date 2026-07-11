import { state, setMastered } from '../state'
import { switchToOriginal as switchOriginal, switchToMastered as switchMastered } from './playback'

export function switchToOriginal() {
  setMastered(false)
  switchOriginal()
  updateABButtons()
}

export function switchToMastered() {
  setMastered(true)
  switchMastered()
  updateABButtons()
}

function updateABButtons() {
  const btnOriginal = document.getElementById('btn-original')
  const btnMastered = document.getElementById('btn-mastered')
  if (!btnOriginal || !btnMastered) return

  if (state.isMastered) {
    btnOriginal.style.background = 'var(--color-daw-panel)'
    btnOriginal.style.color = 'var(--color-daw-text)'
    btnMastered.style.background = 'var(--color-daw-accent)'
    btnMastered.style.color = 'white'
  } else {
    btnOriginal.style.background = 'var(--color-daw-accent)'
    btnOriginal.style.color = 'white'
    btnMastered.style.background = 'var(--color-daw-panel)'
    btnMastered.style.color = 'var(--color-daw-text)'
  }
}
