import browser from 'webextension-polyfill';
import type { ContentToPopupMessage, PopupToContentMessage } from './types';

browser.runtime.onInstalled.addListener(() => {
  console.log('Chase Offers Automation extension installed.');
});

// Keyboard shortcut: toggle hunting on active tab
browser.commands.onCommand.addListener(async (command: string) => {
  if (command !== 'toggle-hunting') return;
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  const raw = await browser.tabs.sendMessage(
    tab.id,
    { action: 'getStatus' } as PopupToContentMessage
  );
  const status = raw as Record<string, unknown>;
  await browser.tabs.sendMessage(tab.id, {
    action: status.isRunning ? 'stopHunting' : 'startHunting'
  } as PopupToContentMessage);
});

// Show desktop notification when hunting completes
browser.runtime.onMessage.addListener((message: unknown) => {
  const msg = message as ContentToPopupMessage;
  if (msg.action === 'huntingComplete') {
    browser.notifications.create({
      type: 'basic',
      iconUrl: browser.runtime.getURL('public/icons/icon48.png'),
      title: 'ChaseCatcher',
      message: `✨ Activated ${msg.count} offers!`
    });
  }
});
