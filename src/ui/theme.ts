import Cookies from 'js-cookie'
import { state, setTheme, notify } from '../state'

export function initTheme() {
  const saved = Cookies.get('theme') as 'light' | 'dark' | undefined
  if (saved) {
    state.theme = saved
  }
  applyTheme(state.theme)
}

export function toggleTheme() {
  const next = state.theme === 'light' ? 'dark' : 'light'
  setTheme(next)
  applyTheme(next)
  Cookies.set('theme', next, { expires: 365 })
}

function applyTheme(theme: 'light' | 'dark') {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}
