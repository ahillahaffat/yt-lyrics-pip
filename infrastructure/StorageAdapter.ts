export const StorageAdapter = {
  async get<T>(key: string, defaultValue?: T): Promise<T | null> {
    const result = await chrome.storage.local.get(key)
    const value = result[key]
    if (value !== undefined) return value as T
    if (defaultValue !== undefined) return defaultValue as T
    return null
  },

  async set<T>(key: string, value: T): Promise<void> {
    await chrome.storage.local.set({ [key]: value })
  },

  async clear(): Promise<void> {
    await chrome.storage.local.clear()
  }
}
