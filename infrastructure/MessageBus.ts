import { MessageType } from "@/types";

export const MessageBus = {
  send(message: MessageType): void {
    chrome.runtime.sendMessage(message)
  },

  sendToTab(tabId: number, message: MessageType): void {
    chrome.tabs.sendMessage(tabId, message)
  },

  listen(handler: (message: MessageType) => void): void {
    chrome.runtime.onMessage.addListener((message) => {
      handler(message as MessageType)
    })
  }
}
