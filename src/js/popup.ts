import browser from 'webextension-polyfill';
import type { ContentToPopupMessage, PopupToContentMessage } from './types';

interface StoredStats {
  allTimeCount: number;
  lastRunDate: string;
  lastRunCount: number;
}

interface PopupDeps {
  startBtn: HTMLButtonElement;
  stopBtn: HTMLButtonElement;
  statusDiv: HTMLElement;
  progressBar: HTMLElement | null;
  progressFill: HTMLElement | null;
  offerCount: HTMLElement | null;
  statsDisplay: HTMLElement | null;
}

const updateUI = (
  running: boolean,
  deps: PopupDeps
): void => {
  deps.startBtn.style.display = running ? 'none' : 'block';
  deps.stopBtn.style.display = running ? 'block' : 'none';
  deps.statusDiv.textContent = running
    ? '🎯 Catching rewards...'
    : 'Ready to catch some rewards!';
  if (deps.progressBar) {
    deps.progressBar.style.display = running ? 'block' : 'none';
  }
};

const loadStats = async (statsDisplay: HTMLElement | null): Promise<void> => {
  if (!statsDisplay) return;
  const result = await browser.storage.local.get('stats');
  const stats = result.stats as StoredStats | undefined;
  if (stats) {
    statsDisplay.textContent = `All-time: ${stats.allTimeCount} offers caught`;
  }
};

const saveStats = async (count: number): Promise<void> => {
  const result = await browser.storage.local.get('stats');
  const existing = (result.stats as StoredStats | undefined) ?? {
    allTimeCount: 0,
    lastRunDate: '',
    lastRunCount: 0
  };
  const updated: StoredStats = {
    allTimeCount: existing.allTimeCount + count,
    lastRunDate: new Date().toISOString(),
    lastRunCount: count
  };
  await browser.storage.local.set({ stats: updated });
};

/**
 * Initialises the popup with injected DOM dependencies.
 * Exported for unit tests via dependency injection.
 */
export const initPopup = (deps: PopupDeps): void => {
  const { startBtn, stopBtn, statusDiv, progressFill, offerCount, statsDisplay } = deps;

  loadStats(statsDisplay);

  startBtn.addEventListener('click', async () => {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    if (!tabs[0]?.url?.includes('chase.com')) {
      statusDiv.textContent = '❌ Error: Please open Chase offers page';
      return;
    }

    try {
      const raw = await browser.tabs.sendMessage(
        tabs[0].id!,
        { action: 'startHunting' } as PopupToContentMessage
      );
      const response = raw as Record<string, unknown>;
      if (response?.error) {
        statusDiv.textContent = '❌ Error: Please navigate to the Chase offers page';
        return;
      }
      if (response?.success) {
        updateUI(true, deps);
      }
    } catch {
      statusDiv.textContent = '❌ Error: Please refresh the page and try again';
    }
  });

  stopBtn.addEventListener('click', async () => {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    if (!tabs[0]) return;

    try {
      const raw = await browser.tabs.sendMessage(
        tabs[0].id!,
        { action: 'stopHunting' } as PopupToContentMessage
      );
      const response = raw as Record<string, unknown>;
      if (response?.success) {
        updateUI(false, deps);
        statusDiv.textContent = '⏸️ Paused - Ready to continue!';
      }
    } catch {
      // Ignore errors when stopping
    }
  });

  browser.runtime.onMessage.addListener((message: unknown) => {
    const msg = message as ContentToPopupMessage;

    if (msg.action === 'huntingComplete') {
      updateUI(false, deps);
      statusDiv.textContent = `✨ Activated ${msg.count} offers!`;
      if (offerCount) offerCount.textContent = `${msg.count} offers`;
      saveStats(msg.count);
      return Promise.resolve({ received: true });
    }

    if (msg.action === 'updateProgress') {
      if (progressFill) progressFill.style.width = `${msg.progress}%`;
      if (offerCount) offerCount.textContent = `Activating ${msg.current} of ${msg.total}...`;
      statusDiv.textContent = `Activating ${msg.current} of ${msg.total}...`;
      return Promise.resolve({ received: true });
    }

    if (msg.action === 'error') {
      updateUI(false, deps);
      statusDiv.textContent = `❌ Error: ${msg.error}`;
      return Promise.resolve({ received: true });
    }
  });

  // Check current status when popup opens
  browser.tabs
    .query({ active: true, currentWindow: true })
    .then((tabs: browser.Tabs.Tab[]) => {
      if (!tabs[0]?.url?.includes('chase.com')) {
        statusDiv.textContent = '❌ Error: Please open Chase offers page';
        return;
      }
      return browser.tabs
        .sendMessage(tabs[0].id!, { action: 'getStatus' } as PopupToContentMessage)
        .then((raw: unknown) => {
          const response = raw as Record<string, unknown>;
          if (response && typeof response.isRunning === 'boolean') {
            updateUI(response.isRunning as boolean, deps);
          }
        });
    })
    .catch(() => {});
};

document.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.getElementById('startBtn') as HTMLButtonElement;
  const stopBtn = document.getElementById('stopBtn') as HTMLButtonElement;
  const statusDiv = document.getElementById('status') as HTMLElement;
  const progressBar = document.getElementById('progressBar');
  const progressFill = document.getElementById('progressFill');
  const offerCount = document.getElementById('offerCount');
  const statsDisplay = document.getElementById('statsDisplay');

  initPopup({ startBtn, stopBtn, statusDiv, progressBar, progressFill, offerCount, statsDisplay });
});
