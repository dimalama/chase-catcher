import browser from 'webextension-polyfill';
import { handleCommand } from '../js/background';

type Listener = (msg: unknown) => void;

// Jest provides require at runtime; the project has no Node typings.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const require: (id: string) => any;

// Captured once at import time, before clearAllMocks wipes the call record.
const addListener = browser.runtime.onMessage.addListener as jest.Mock;
const messageListener: Listener = addListener.mock.calls[0][0];
const commandListener = (browser.commands.onCommand.addListener as jest.Mock).mock.calls[0][0];

const flush = () => new Promise(resolve => setTimeout(resolve, 0));

beforeEach(() => {
  jest.clearAllMocks();
  (browser.storage.local.get as jest.Mock).mockResolvedValue({
    disclaimerAccepted: { version: 1, acceptedAt: '2026-01-01T00:00:00.000Z' },
  });
  (browser.tabs.query as jest.Mock).mockResolvedValue([{ id: 7 }]);
  (browser.tabs.sendMessage as jest.Mock).mockResolvedValue({ success: true, isRunning: false });
});

describe('background', () => {
  it('registers the keyboard shortcut handler', () => {
    expect(commandListener).toBe(handleCommand);
  });

  it('shows a notification when hunting completes', () => {
    messageListener({ action: 'huntingComplete', success: true, count: 3 });
    expect(browser.notifications.create).toHaveBeenCalledWith(
      expect.objectContaining({ message: '✨ Activated 3 offers!' })
    );
  });

  it('does not crash when the notifications API is missing (Safari)', () => {
    const original = browser.notifications;
    // @ts-expect-error simulate Safari
    delete browser.notifications;
    try {
      expect(() =>
        messageListener({ action: 'huntingComplete', success: true, count: 1 })
      ).not.toThrow();
    } finally {
      Object.assign(browser, { notifications: original });
    }
  });

  it('loads when the commands API is missing (iOS, Android)', () => {
    jest.isolateModules(() => {
      const isolated = require('webextension-polyfill').default;
      delete isolated.commands;
      expect(() => require('../js/background')).not.toThrow();
    });
  });

  it('toggles hunting from the keyboard shortcut', async () => {
    await handleCommand('toggle-hunting');
    expect(browser.tabs.sendMessage).toHaveBeenLastCalledWith(7, { action: 'startHunting' });
  });

  it('refuses the shortcut until the disclaimer is accepted', async () => {
    (browser.storage.local.get as jest.Mock).mockResolvedValue({});
    await handleCommand('toggle-hunting');
    await flush();
    expect(browser.tabs.sendMessage).not.toHaveBeenCalled();
    expect(browser.notifications.create).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('disclaimer') })
    );
  });

  it('swallows errors when the active tab has no content script', async () => {
    (browser.tabs.sendMessage as jest.Mock).mockRejectedValue(new Error('No receiver'));
    await expect(handleCommand('toggle-hunting')).resolves.toBeUndefined();
  });
});
