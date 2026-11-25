import browser from 'webextension-polyfill';
import type { ContentToPopupMessage, PopupToContentMessage } from './types';
import { hasAcceptedDisclaimer } from '../utils/disclaimer';

// Some APIs are missing on some browsers: Safari has no notifications API, and
// iOS/Android have no keyboard commands. Every optional API is feature-checked.

const notify = (message: string): void => {
  if (!browser.notifications?.create) return;
  browser.notifications
    .create({
      type: 'basic',
      iconUrl: browser.runtime.getURL('public/icons/icon48.png'),
      title: 'ChaseCatcher',
      message,
    })
    .catch(() => {});
};

browser.runtime.onInstalled.addListener(() => {
  console.log('Chase Offers Automation extension installed.');
});

/**
 * Keyboard shortcut: toggle hunting on the active tab.
 * Exported for tests.
 */
export const handleCommand = async (command: string): Promise<void> => {
  if (command !== 'toggle-hunting') return;

  try {
    if (!(await hasAcceptedDisclaimer())) {
      notify('Open the Chase Catcher popup and accept the disclaimer first.');
      return;
    }

    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;
    const raw = await browser.tabs.sendMessage(tab.id, {
      action: 'getStatus',
    } as PopupToContentMessage);
    const status = (raw ?? {}) as Record<string, unknown>;
    await browser.tabs.sendMessage(tab.id, {
      action: status.isRunning ? 'stopHunting' : 'startHunting',
    } as PopupToContentMessage);
  } catch {
    // Not a Chase tab, or the content script is not loaded yet.
  }
};

browser.commands?.onCommand?.addListener(handleCommand);

// Show desktop notification when hunting completes
browser.runtime.onMessage.addListener((message: unknown) => {
  const msg = message as ContentToPopupMessage;
  if (msg.action === 'huntingComplete') {
    notify(`✨ Activated ${msg.count} offers!`);
  }
});
