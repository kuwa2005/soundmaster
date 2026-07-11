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

export function renderApp(container: HTMLElement) {
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

      <footer id="dropzone" class="border-t p-4" style="border-color: var(--color-daw-border); background: var(--color-daw-surface);">
        <div id="dropzone-content" class="dropzone-content border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all" style="border-color: var(--color-daw-border);">
          <div class="flex flex-col items-center gap-2">
            <span class="text-3xl opacity-50">📁</span>
            <p style="color: var(--color-daw-text);">${t('dropzone.label')}</p>
            <p class="text-sm" style="color: var(--color-daw-muted);">${t('dropzone.formats')}</p>
          </div>
          <input type="file" id="file-input" multiple accept="audio/*,video/*" class="hidden" />
        </div>
      </footer>
    </div>
  `

  initDropzone()
  renderSubComponents()
  updateThemeIcon()

  // 言語切替ボタン
  document.getElementById('lang-toggle')!.addEventListener('click', () => {
    const newLocale: Locale = getLocale() === 'ja' ? 'en' : 'ja'
    setLocale(newLocale)
    renderApp(container)
  })

  subscribe(() => {
    // 再生中はコントロール以外を更新（オーディオチェーンを壊さないため）
    if (!state.isPlaying) {
      renderSubComponents()
    } else {
      // 再生中は最小限の更新のみ
      renderTrackList(document.getElementById('track-list')!)
      renderTransport(document.getElementById('transport-area')!)
      renderExportPanel(document.getElementById('export-area')!)
    }
    updateThemeIcon()
  })
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
  const dropzone = document.getElementById('dropzone-content')!
  const fileInput = document.getElementById('file-input') as HTMLInputElement

  dropzone.addEventListener('click', () => fileInput.click())

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault()
    dropzone.classList.add('dropzone-active')
  })

  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('dropzone-active')
  })

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault()
    dropzone.classList.remove('dropzone-active')
    handleFileDrop(e.dataTransfer!.files)
  })

  fileInput.addEventListener('change', (e) => {
    const files = (e.target as HTMLInputElement).files
    if (files) handleFileDrop(files)
    fileInput.value = ''
  })

  document.getElementById('theme-toggle')!.addEventListener('click', toggleTheme)
}
