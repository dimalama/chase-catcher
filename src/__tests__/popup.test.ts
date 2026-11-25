import browser from 'webextension-polyfill';
import { initPopup } from '../js/popup';

// Helper to build popup DOM and return typed deps
const buildPopupDom = () => {
  document.body.innerHTML = `
    <button id="startBtn">🎯 Start Catching</button>
    <button id="stopBtn" style="display:none">⏸ Stop</button>
    <div id="status">Ready to catch some rewards!</div>
    <div id="progressBar" style="display:none">
      <div id="progressFill" style="width:0%"></div>
    </div>
    <div id="offerCount"></div>
    <div id="statsDisplay"></div>
  `;

  return {
    startBtn: document.getElementById('startBtn') as HTMLButtonElement,
    stopBtn: document.getElementById('stopBtn') as HTMLButtonElement,
    statusDiv: document.getElementById('status') as HTMLElement,
    progressBar: document.getElementById('progressBar'),
    progressFill: document.getElementById('progressFill'),
    offerCount: document.getElementById('offerCount'),
    statsDisplay: document.getElementById('statsDisplay'),
  };
};

// Lets all pending promise chains in initPopup settle.
const flush = () => new Promise(resolve => setTimeout(resolve, 0));

let capturedMessageListener: (msg: unknown) => Promise<unknown> | void;

beforeEach(() => {
  jest.clearAllMocks();

  // Reset mock return values
  (browser.storage.local.get as jest.Mock).mockResolvedValue({});
  (browser.storage.local.set as jest.Mock).mockResolvedValue(undefined);
  (browser.tabs.query as jest.Mock).mockResolvedValue([]);
  (browser.tabs.sendMessage as jest.Mock).mockResolvedValue({});
  (browser.permissions.contains as jest.Mock).mockResolvedValue(true);
  (browser.permissions.request as jest.Mock).mockResolvedValue(true);

  // Capture message listener when initPopup registers it
  (browser.runtime.onMessage.addListener as jest.Mock).mockImplementation(
    (fn: (msg: unknown) => Promise<unknown> | void) => {
      capturedMessageListener = fn;
    }
  );
});

describe('initial state', () => {
  it('should show start button and hide stop button', () => {
    const deps = buildPopupDom();
    initPopup(deps);

    expect(deps.startBtn.style.display).not.toBe('none');
    expect(deps.stopBtn.style.display).toBe('none');
  });

  it('should load stats from storage on open', async () => {
    const deps = buildPopupDom();
    (browser.storage.local.get as jest.Mock).mockResolvedValue({
      stats: { allTimeCount: 42, lastRunDate: '2025-01-01', lastRunCount: 5 },
    });

    initPopup(deps);
    await Promise.resolve(); // flush loadStats

    expect(deps.statsDisplay!.textContent).toBe('All-time: 42 offers caught');
  });

  it('should show error when not on chase.com', async () => {
    const deps = buildPopupDom();
    (browser.tabs.query as jest.Mock).mockResolvedValue([{ id: 1, url: 'https://example.com' }]);

    initPopup(deps);
    await flush();

    // Message listener fires on the status query tab
    expect(deps.statusDiv.textContent).toContain('Error');
  });
});

describe('start button click', () => {
  it('should send startHunting message and update UI on success', async () => {
    const deps = buildPopupDom();
    (browser.tabs.query as jest.Mock).mockResolvedValue([
      { id: 1, url: 'https://secure.chase.com/offers' },
    ]);
    (browser.tabs.sendMessage as jest.Mock).mockResolvedValue({ success: true });

    initPopup(deps);
    deps.startBtn.click();
    await flush();

    expect(browser.tabs.sendMessage).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ action: 'startHunting' })
    );
    expect(deps.startBtn.style.display).toBe('none');
    expect(deps.stopBtn.style.display).toBe('block');
  });

  it('should show error for non-chase URL', async () => {
    const deps = buildPopupDom();
    (browser.tabs.query as jest.Mock).mockResolvedValue([{ id: 1, url: 'https://example.com' }]);

    initPopup(deps);
    deps.startBtn.click();
    await flush();

    expect(deps.statusDiv.textContent).toBe('❌ Error: Please open Chase offers page');
  });

  it('should show error when response has error field', async () => {
    const deps = buildPopupDom();
    (browser.tabs.query as jest.Mock).mockResolvedValue([
      { id: 1, url: 'https://secure.chase.com/offers' },
    ]);
    (browser.tabs.sendMessage as jest.Mock).mockResolvedValue({ error: 'Wrong page' });

    initPopup(deps);
    deps.startBtn.click();
    await flush();

    expect(deps.statusDiv.textContent).toContain('Error');
  });

  it('should show error when sendMessage throws', async () => {
    const deps = buildPopupDom();
    (browser.tabs.query as jest.Mock).mockResolvedValue([
      { id: 1, url: 'https://secure.chase.com/offers' },
    ]);
    (browser.tabs.sendMessage as jest.Mock).mockRejectedValue(new Error('Connection refused'));

    initPopup(deps);
    deps.startBtn.click();
    await flush();

    expect(deps.statusDiv.textContent).toBe('❌ Error: Please refresh the page and try again');
  });
});

describe('stop button click', () => {
  it('should send stopHunting and reset UI', async () => {
    const deps = buildPopupDom();
    (browser.tabs.query as jest.Mock).mockResolvedValue([
      { id: 1, url: 'https://secure.chase.com/offers' },
    ]);
    (browser.tabs.sendMessage as jest.Mock).mockResolvedValue({ success: true });

    initPopup(deps);
    deps.stopBtn.click();
    await flush();

    expect(browser.tabs.sendMessage).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ action: 'stopHunting' })
    );
  });
});

describe('message listener', () => {
  it('should handle updateProgress message', () => {
    const deps = buildPopupDom();
    initPopup(deps);

    capturedMessageListener({
      action: 'updateProgress',
      current: 3,
      total: 10,
      progress: 30,
    });

    expect(deps.progressFill!.style.width).toBe('30%');
    expect(deps.offerCount!.textContent).toBe('Activating 3 of 10...');
    expect(deps.statusDiv.textContent).toBe('Activating 3 of 10...');
  });

  it('should handle huntingComplete message and save stats', async () => {
    const deps = buildPopupDom();
    initPopup(deps);

    capturedMessageListener({ action: 'huntingComplete', success: true, count: 7 });

    expect(deps.statusDiv.textContent).toBe('✨ Activated 7 offers!');
    expect(deps.startBtn.style.display).toBe('block');
    expect(deps.stopBtn.style.display).toBe('none');
    expect(deps.offerCount!.textContent).toBe('7 offers');

    // saveStats is async: flush get + set
    await flush();
    await Promise.resolve();

    expect(browser.storage.local.set).toHaveBeenCalled();
  });

  it('should handle error message', () => {
    const deps = buildPopupDom();
    initPopup(deps);

    capturedMessageListener({ action: 'error', error: 'Page not ready' });

    expect(deps.statusDiv.textContent).toBe('❌ Error: Page not ready');
    expect(deps.startBtn.style.display).toBe('block');
  });
});

describe('cross-browser site access', () => {
  it('rejects look-alike hosts that merely contain chase.com', async () => {
    const deps = buildPopupDom();
    (browser.tabs.query as jest.Mock).mockResolvedValue([
      { id: 1, url: 'https://chase.com.evil.example/offers' },
    ]);

    initPopup(deps);
    deps.startBtn.click();
    await flush();

    expect(browser.tabs.sendMessage).not.toHaveBeenCalledWith(1, { action: 'startHunting' });
    expect(deps.statusDiv.textContent).toBe('❌ Error: Please open Chase offers page');
  });

  it('still starts when the tab URL is hidden (Safari without site access)', async () => {
    const deps = buildPopupDom();
    (browser.tabs.query as jest.Mock).mockResolvedValue([{ id: 1 }]);
    (browser.tabs.sendMessage as jest.Mock).mockResolvedValue({ success: true });

    initPopup(deps);
    deps.startBtn.click();
    await flush();

    expect(browser.tabs.sendMessage).toHaveBeenCalledWith(1, { action: 'startHunting' });
  });

  it('shows an access hint when host permission is missing (Firefox/Safari)', async () => {
    const deps = buildPopupDom();
    (browser.permissions.contains as jest.Mock).mockResolvedValue(false);
    (browser.tabs.query as jest.Mock).mockResolvedValue([
      { id: 1, url: 'https://secure.chase.com/offers' },
    ]);

    initPopup(deps);
    await flush();

    expect(deps.statusDiv.textContent).toContain('needs access to secure.chase.com');
  });

  it('requests host permission synchronously on Start click', async () => {
    const deps = buildPopupDom();
    (browser.permissions.contains as jest.Mock).mockResolvedValue(false);
    (browser.tabs.query as jest.Mock).mockResolvedValue([
      { id: 1, url: 'https://secure.chase.com/offers' },
    ]);
    (browser.tabs.sendMessage as jest.Mock).mockResolvedValue({ success: true });

    initPopup(deps);
    await flush();
    deps.startBtn.click();

    // Called within the click handler itself, before any await (Firefox gesture rule)
    expect(browser.permissions.request).toHaveBeenCalledWith({
      origins: ['https://secure.chase.com/*'],
    });
    await flush();
    expect(browser.tabs.sendMessage).toHaveBeenCalledWith(1, { action: 'startHunting' });
  });

  it('does not start when the user denies host permission', async () => {
    const deps = buildPopupDom();
    (browser.permissions.contains as jest.Mock).mockResolvedValue(false);
    (browser.permissions.request as jest.Mock).mockResolvedValue(false);
    (browser.tabs.query as jest.Mock).mockResolvedValue([
      { id: 1, url: 'https://secure.chase.com/offers' },
    ]);

    initPopup(deps);
    await flush();
    deps.startBtn.click();
    await flush();

    expect(browser.tabs.sendMessage).not.toHaveBeenCalledWith(1, { action: 'startHunting' });
    expect(deps.statusDiv.textContent).toContain('needs access');
  });
});

describe('disclaimer gate', () => {
  const buildGatedDom = () => {
    const deps = buildPopupDom();
    const disclaimerPanel = document.createElement('section');
    const mainPanel = document.createElement('main');
    const acceptBtn = document.createElement('button');
    disclaimerPanel.hidden = true;
    mainPanel.hidden = true;
    disclaimerPanel.appendChild(acceptBtn);
    document.body.append(disclaimerPanel, mainPanel);
    return { ...deps, disclaimerPanel, mainPanel, acceptBtn };
  };

  it('shows the disclaimer and blocks Start until accepted', async () => {
    const deps = buildGatedDom();
    (browser.tabs.query as jest.Mock).mockResolvedValue([
      { id: 1, url: 'https://secure.chase.com/offers' },
    ]);

    initPopup(deps);
    await flush();

    expect(deps.disclaimerPanel.hidden).toBe(false);
    expect(deps.mainPanel.hidden).toBe(true);

    deps.startBtn.click();
    await flush();
    expect(browser.tabs.sendMessage).not.toHaveBeenCalledWith(1, { action: 'startHunting' });
  });

  it('stores acceptance and reveals controls on accept', async () => {
    const deps = buildGatedDom();
    initPopup(deps);
    await flush();

    deps.acceptBtn.click();
    await flush();

    expect(browser.storage.local.set).toHaveBeenCalledWith({
      disclaimerAccepted: expect.objectContaining({ version: 1 }),
    });
    expect(deps.disclaimerPanel.hidden).toBe(true);
    expect(deps.mainPanel.hidden).toBe(false);
  });

  it('skips the disclaimer when already accepted', async () => {
    const deps = buildGatedDom();
    (browser.storage.local.get as jest.Mock).mockResolvedValue({
      disclaimerAccepted: { version: 1, acceptedAt: '2026-01-01T00:00:00.000Z' },
    });
    (browser.tabs.query as jest.Mock).mockResolvedValue([
      { id: 1, url: 'https://secure.chase.com/offers' },
    ]);
    (browser.tabs.sendMessage as jest.Mock).mockResolvedValue({ success: true });

    initPopup(deps);
    await flush();

    expect(deps.disclaimerPanel.hidden).toBe(true);
    expect(deps.mainPanel.hidden).toBe(false);

    deps.startBtn.click();
    await flush();
    expect(browser.tabs.sendMessage).toHaveBeenCalledWith(1, { action: 'startHunting' });
  });

  it('asks again when the disclaimer version changes', async () => {
    const deps = buildGatedDom();
    (browser.storage.local.get as jest.Mock).mockResolvedValue({
      disclaimerAccepted: { version: 0, acceptedAt: '2025-01-01T00:00:00.000Z' },
    });

    initPopup(deps);
    await flush();

    expect(deps.disclaimerPanel.hidden).toBe(false);
  });
});
