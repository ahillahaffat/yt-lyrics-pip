import { MessageBus } from '@/infrastructure/MessageBus'
import { StorageAdapter } from '@/infrastructure/StorageAdapter'

const toggleBtn = document.getElementById('toggle-btn') as HTMLButtonElement
const statusEl = document.getElementById('status') as HTMLElement

async function init(): Promise<void> {
  const active = await StorageAdapter.get<boolean>('extension_active') ?? false
  updateUI(active)
}

function updateUI(active: boolean): void {
  if (active) {
    toggleBtn.textContent = 'Disable Lyrics'
    toggleBtn.className = 'on'
    statusEl.textContent = 'Lyrics overlay is active.'
  } else {
    toggleBtn.textContent = 'Enable Lyrics'
    toggleBtn.className = 'off'
    statusEl.textContent = 'Open YouTube and play a song.'
  }
}

toggleBtn.addEventListener('click', async () => {
  const current = await StorageAdapter.get<boolean>('extension_active') ?? false
  const next = !current
  await StorageAdapter.set('extension_active', next)
  updateUI(next)
  MessageBus.send({ type: 'EXTENSION_TOGGLED', payload: { active: next } })
})

init()