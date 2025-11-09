import { MESSAGE_TYPE_TOGGLE_SEARCH } from '../types/messages';

chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'toggle-search') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab.id) return;
    chrome.tabs.sendMessage(tab.id, { type: MESSAGE_TYPE_TOGGLE_SEARCH });
  }
});
