import { state, setMastered, notify } from '../state'
import { switchSource } from './playback'

export function switchToOriginal() {
  setMastered(false)
  switchSource()
}

export function switchToMastered() {
  setMastered(true)
  switchSource()
}
