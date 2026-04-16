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
    statsDisplay: document.getElementById('statsDisplay')
  };
};

let capturedMessageListener: (msg: unknown) => Promise<unknown> | void;

beforeEach(() => {
  jest.clearAllMocks();

  // Reset mock return values
  (browser.storage.local.get as jest.Mock).mockResolvedValue({});
  (browser.storage.local.set as jest.Mock).mockResolvedValue(undefined);
  (browser.tabs.query as jest.Mock).mockResolvedValue([]);
  (browser.tabs.sendMessage as jest.Mock).mockResolvedValue({});

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
      stats: { allTimeCount: 42, lastRunDate: '2025-01-01', lastRunCount: 5 }
    });

    initPopup(deps);
    await Promise.resolve(); // flush loadStats

    expect(deps.statsDisplay!.textContent).toBe('All-time: 42 offers caught');
  });

  it('should show error when not on chase.com', async () => {
    const deps = buildPopupDom();
    (browser.tabs.query as jest.Mock).mockResolvedValue([
      { id: 1, url: 'https://example.com' }
    ]);

    initPopup(deps);
    await Promise.resolve(); // flush status check

    // Message listener fires on the status query tab
    expect(deps.statusDiv.textContent).toContain('Error');
  });
});

describe('start button click', () => {
  it('should send startHunting message and update UI on success', async () => {
    const deps = buildPopupDom();
    (browser.tabs.query as jest.Mock).mockResolvedValue([
      { id: 1, url: 'https://secure.chase.com/offers' }
    ]);
    (browser.tabs.sendMessage as jest.Mock).mockResolvedValue({ success: true });

    initPopup(deps);
    deps.startBtn.click();
    await Promise.resolve();
    await Promise.resolve();

    expect(browser.tabs.sendMessage).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ action: 'startHunting' })
    );
    expect(deps.startBtn.style.display).toBe('none');
    expect(deps.stopBtn.style.display).toBe('block');
  });

  it('should show error for non-chase URL', async () => {
    const deps = buildPopupDom();
    (browser.tabs.query as jest.Mock).mockResolvedValue([
      { id: 1, url: 'https://example.com' }
    ]);

    initPopup(deps);
    deps.startBtn.click();
    await Promise.resolve();
    await Promise.resolve();

    expect(deps.statusDiv.textContent).toBe('❌ Error: Please open Chase offers page');
  });

  it('should show error when response has error field', async () => {
    const deps = buildPopupDom();
    (browser.tabs.query as jest.Mock).mockResolvedValue([
      { id: 1, url: 'https://secure.chase.com/offers' }
    ]);
    (browser.tabs.sendMessage as jest.Mock).mockResolvedValue({ error: 'Wrong page' });

    initPopup(deps);
    deps.startBtn.click();
    await Promise.resolve();
    await Promise.resolve();

    expect(deps.statusDiv.textContent).toContain('Error');
  });

  it('should show error when sendMessage throws', async () => {
    const deps = buildPopupDom();
    (browser.tabs.query as jest.Mock).mockResolvedValue([
      { id: 1, url: 'https://secure.chase.com/offers' }
    ]);
    (browser.tabs.sendMessage as jest.Mock).mockRejectedValue(new Error('Connection refused'));

    initPopup(deps);
    deps.startBtn.click();
    await Promise.resolve();
    await Promise.resolve();

    expect(deps.statusDiv.textContent).toBe(
      '❌ Error: Please refresh the page and try again'
    );
  });
});

describe('stop button click', () => {
  it('should send stopHunting and reset UI', async () => {
    const deps = buildPopupDom();
    (browser.tabs.query as jest.Mock).mockResolvedValue([
      { id: 1, url: 'https://secure.chase.com/offers' }
    ]);
    (browser.tabs.sendMessage as jest.Mock).mockResolvedValue({ success: true });

    initPopup(deps);
    deps.stopBtn.click();
    await Promise.resolve();
    await Promise.resolve();

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
      progress: 30
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
    await Promise.resolve();
    await Promise.resolve();
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
