import { StorageAdapter } from '@/infrastructure/StorageAdapter'

const toggleBtn = document.getElementById('toggleBtn') as HTMLButtonElement
const statusEl = document.getElementById('status') as HTMLElement

async function updateUI() {
  const isEnabled = await StorageAdapter.get('extensionEnabled')
  
  if (isEnabled) {
    toggleBtn.classList.add('active')
    toggleBtn.textContent = 'Disable Extension'
    statusEl.classList.add('active')
    statusEl.textContent = '✓ Extension is ON'
  } else {
    toggleBtn.classList.remove('active')
    toggleBtn.textContent = 'Enable Extension'
    statusEl.classList.remove('active')
    statusEl.textContent = '○ Extension is OFF'
  }
}

toggleBtn.addEventListener('click', async () => {
  const currentState = await StorageAdapter.get('extensionEnabled')
  const newState = !currentState
  
  await StorageAdapter.set('extensionEnabled', newState)
  
  const tabs = await chrome.tabs.query({ url: 'https://www.youtube.com/*' })
  for (const tab of tabs) {
    if (tab.id) {
      chrome.tabs.sendMessage(tab.id, {
        type: 'EXTENSION_TOGGLED',
        payload: { active: newState }
      }).catch(() => {
      })
    }
  }
  
  updateUI()
})

updateUI()
