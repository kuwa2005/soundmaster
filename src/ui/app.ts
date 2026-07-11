import { state, subscribe, notify } from '../state'
import { toggleTheme } from './theme'
import { handleFileDrop } from '../audio/decoder'
import { renderTrackList } from './track-list'
import { renderControls } from './controls'
import { renderTransport } from './transport'
import { renderMeters } from './meters'
import { renderExportPanel } from './export-panel'
import { renderWaveform } from './waveform'
import { t, initI18n, getLocale, setLocale, Locale } from '../i18n'

let appContainer: HTMLElement | null = null

export function renderApp(container: HTMLElement) {
  appContainer = container
  initI18n()

  container.innerHTML = `
    <div class="h-screen flex flex-col overflow-hidden">
      <header class="header-content flex items-center justify-between px-6 py-3 border-b" style="border-color: var(--color-daw-border); background: var(--color-daw-surface);">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background: var(--color-daw-accent);">
            <span class="text-white font-bold">♪</span>
          </div>
          <h1 class="text-xl font-bold" style="color: var(--color-daw-text);">${t('app.title')}</h1>
          <span class="hidden sm:inline text-xs px-2 py-0.5 rounded" style="background: var(--color-daw-panel); color: var(--color-daw-muted);">${t('app.subtitle')}</span>
        </div>
        <div class="flex items-center gap-4">
          <button id="lang-toggle" class="px-2 py-1 rounded text-xs font-medium" style="background: var(--color-daw-panel); color: var(--color-daw-text); border: 1px solid var(--color-daw-border);">
            ${getLocale() === 'ja' ? 'JA' : 'EN'}
          </button>
          <button id="theme-toggle" class="p-2 rounded-lg transition-all hover:scale-110" style="background: var(--color-daw-panel);" title="Toggle theme">
            <span id="theme-icon" class="text-xl"></span>
          </button>
        </div>
      </header>

      <div class="main-content flex flex-1 overflow-hidden">
        <aside id="track-list" class="sidebar w-72 overflow-y-auto border-r" style="border-color: var(--color-daw-border); background: var(--color-daw-surface);">
        </aside>

        <main class="flex-1 flex flex-col overflow-hidden min-w-0">
          <div id="waveform-area" class="flex-1 min-h-[150px] border-b" style="border-color: var(--color-daw-border); background: var(--color-daw-bg);">
          </div>

          <div id="controls-area" class="p-4 border-b" style="border-color: var(--color-daw-border); background: var(--color-daw-surface);">
          </div>

          <div id="meters-area" class="px-4 py-3 border-b" style="border-color: var(--color-daw-border); background: var(--color-daw-surface);">
          </div>

          <div id="transport-area" class="px-4 py-3 border-b" style="border-color: var(--color-daw-border); background: var(--color-daw-surface);">
          </div>

          <div id="export-area" class="px-4 py-3" style="background: var(--color-daw-surface);">
          </div>
        </main>
      </div>

      <footer class="border-t px-6 py-2 flex items-center justify-between text-xs" style="border-color: var(--color-daw-border); background: var(--color-daw-surface); color: var(--color-daw-muted);">
        <span>© 2026 SoundMaster</span>
        <a href="https://github.com/kuwa2005/soundmaster" target="_blank" rel="noopener noreferrer" class="hover:underline" style="color: var(--color-daw-accent);">
          GitHub
        </a>
      </footer>
    </div>
  `

  initDropzone()
  initLangToggle()
  renderSubComponents()
  updateThemeIcon()

  subscribe(() => {
    if (!state.isPlaying) {
      renderSubComponents()
    } else {
      renderTrackList(document.getElementById('track-list')!)
      renderTransport(document.getElementById('transport-area')!)
      renderExportPanel(document.getElementById('export-area')!)
    }
    updateThemeIcon()
  })
}

function initLangToggle() {
  document.getElementById('lang-toggle')?.addEventListener('click', () => {
    const newLocale: Locale = getLocale() === 'ja' ? 'en' : 'ja'
    setLocale(newLocale)
    updateAllText()
  })
}

function updateAllText() {
  if (!appContainer) return

  const titleEl = appContainer.querySelector('h1')
  const subtitleEl = appContainer.querySelector('.hidden.sm\\:inline')
  const langBtn = document.getElementById('lang-toggle')

  if (titleEl) titleEl.textContent = t('app.title')
  if (subtitleEl) subtitleEl.textContent = t('app.subtitle')
  if (langBtn) langBtn.textContent = getLocale() === 'ja' ? 'JA' : 'EN'

  renderSubComponents()
  updateThemeIcon()
}

function renderSubComponents() {
  renderTrackList(document.getElementById('track-list')!)
  renderWaveform(document.getElementById('waveform-area')!)
  renderControls(document.getElementById('controls-area')!)
  renderMeters(document.getElementById('meters-area')!)
  renderTransport(document.getElementById('transport-area')!)
  renderExportPanel(document.getElementById('export-area')!)
}

function updateThemeIcon() {
  const icon = document.getElementById('theme-icon')
  if (icon) {
    icon.textContent = state.theme === 'dark' ? '🌙' : '☀️'
    icon.classList.toggle('glow-active', state.theme === 'dark')
  }
}

function initDropzone() {
  document.getElementById('theme-toggle')!.addEventListener('click', toggleTheme)
}
