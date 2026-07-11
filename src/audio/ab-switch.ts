import { state, setMastered, notify } from '../state'
import { switchToOriginal as switchOriginal, switchToMastered as switchMastered } from './playback'

export function switchToOriginal() {
  setMastered(false)
  switchOriginal()
  notify()
}

export function switchToMastered() {
  setMastered(true)
  switchMastered()
  notify()
}
