import browser from 'webextension-polyfill';
import type { ContentToPopupMessage, PopupToContentMessage } from './types';
import { isChaseUrl } from '../utils/url';
import { acceptDisclaimer, hasAcceptedDisclaimer } from '../utils/disclaimer';
import { hasHostAccess, requestHostAccess } from '../utils/permissions';

const MSG_WRONG_PAGE = '❌ Error: Please open Chase offers page';
const MSG_NO_ACCESS =
  '🔒 Chase Catcher needs access to secure.chase.com. Click Start and allow access, then reload the Chase page.';

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
  // Disclaimer gate. When omitted (unit tests), the gate is skipped.
  disclaimerPanel?: HTMLElement | null;
  mainPanel?: HTMLElement | null;
  acceptBtn?: HTMLButtonElement | null;
}

const updateUI = (running: boolean, deps: PopupDeps): void => {
  deps.startBtn.style.display = running ? 'none' : 'block';
  deps.stopBtn.style.display = running ? 'block' : 'none';
  deps.statusDiv.textContent = running ? '🎯 Catching rewards...' : 'Ready to catch some rewards!';
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
    lastRunCount: 0,
  };
  const updated: StoredStats = {
    allTimeCount: existing.allTimeCount + count,
    lastRunDate: new Date().toISOString(),
    lastRunCount: count,
  };
  await browser.storage.local.set({ stats: updated });
};

/**
 * Shows the disclaimer until the user accepts it, then the main controls.
 * Resolves to whether the disclaimer is accepted.
 */
const initDisclaimerGate = async (deps: PopupDeps): Promise<boolean> => {
  const { disclaimerPanel, mainPanel, acceptBtn } = deps;
  if (!disclaimerPanel || !mainPanel || !acceptBtn) return true;

  const show = (accepted: boolean): void => {
    disclaimerPanel.hidden = accepted;
    mainPanel.hidden = !accepted;
  };

  const accepted = await hasAcceptedDisclaimer();
  show(accepted);
  if (accepted) return true;

  return new Promise(resolve => {
    acceptBtn.addEventListener('click', () => {
      acceptDisclaimer()
        .catch(() => {})
        .then(() => {
          show(true);
          resolve(true);
        });
    });
  });
};

/**
 * Initialises the popup with injected DOM dependencies.
 * Exported for unit tests via dependency injection.
 */
export const initPopup = (deps: PopupDeps): void => {
  const { startBtn, stopBtn, statusDiv, progressFill, offerCount, statsDisplay } = deps;

  const gated = Boolean(deps.disclaimerPanel && deps.mainPanel && deps.acceptBtn);
  let accepted = !gated;
  let hostAccess = true;

  loadStats(statsDisplay);

  const startHunting = async (): Promise<void> => {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    // Safari leaves tab.url undefined when the extension lacks access to the
    // site, so only reject URLs we can actually see.
    if (!tab?.id || (tab.url !== undefined && !isChaseUrl(tab.url))) {
      statusDiv.textContent = MSG_WRONG_PAGE;
      return;
    }

    try {
      const raw = await browser.tabs.sendMessage(tab.id, {
        action: 'startHunting',
      } as PopupToContentMessage);
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
  };

  startBtn.addEventListener('click', () => {
    if (!accepted) return;
    // Request site access synchronously, before any await: Firefox only shows
    // the prompt while the click's user gesture is still active.
    const access = hostAccess ? Promise.resolve(true) : requestHostAccess();
    access.then(granted => {
      if (!granted) {
        statusDiv.textContent = MSG_NO_ACCESS;
        return;
      }
      hostAccess = true;
      return startHunting();
    });
  });

  stopBtn.addEventListener('click', async () => {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    if (!tabs[0]) return;

    try {
      const raw = await browser.tabs.sendMessage(tabs[0].id!, {
        action: 'stopHunting',
      } as PopupToContentMessage);
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

  if (gated) {
    initDisclaimerGate(deps).then(ok => {
      accepted = ok;
    });
  }

  // Check site access and current status when popup opens
  hasHostAccess()
    .then(granted => {
      hostAccess = granted;
      return browser.tabs.query({ active: true, currentWindow: true });
    })
    .then((tabs: browser.Tabs.Tab[]) => {
      const tab = tabs[0];
      if (tab?.url !== undefined && !isChaseUrl(tab.url)) {
        statusDiv.textContent = MSG_WRONG_PAGE;
        return;
      }
      if (!hostAccess) {
        statusDiv.textContent = MSG_NO_ACCESS;
        return;
      }
      if (!tab?.id) return;
      return browser.tabs
        .sendMessage(tab.id, { action: 'getStatus' } as PopupToContentMessage)
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

  const disclaimerPanel = document.getElementById('disclaimer');
  const mainPanel = document.getElementById('main');
  const acceptBtn = document.getElementById('acceptBtn') as HTMLButtonElement | null;

  initPopup({
    startBtn,
    stopBtn,
    statusDiv,
    progressBar,
    progressFill,
    offerCount,
    statsDisplay,
    disclaimerPanel,
    mainPanel,
    acceptBtn,
  });
});
