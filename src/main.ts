import './style.css'
import { AppState, state } from './state'
import { renderApp } from './ui/app'
import { initTheme } from './ui/theme'

document.addEventListener('DOMContentLoaded', () => {
  initTheme()
  renderApp(document.getElementById('app')!)
})
