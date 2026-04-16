import browser from 'webextension-polyfill';
import { startHunting, resetState } from '../js/content';

// jsdom doesn't implement window.scrollTo — silence the "not implemented" error
Object.defineProperty(window, 'scrollTo', { value: jest.fn(), writable: true });

// DOM with one offer tile ready to be activated
const SINGLE_OFFER_HTML = `
  <div data-testid="offerTileGridContainer">
    <div data-cy="commerce-tile" id="offer1" aria-label="1 of 1 Test Merchant 5% cashback Add Offer">
      <button data-cy="commerce-tile-button" type="ico_add_circle">Add</button>
      <span class="mds-body-small-heavier semanticColorTextRegular">Test Merchant</span>
      <span class="mds-body-large-heavier semanticColorTextRegular">5% cashback</span>
      <div data-testid="days-left-banner">7 days left</div>
    </div>
  </div>
`;

// Capture the message listener registered when content.ts is first imported.
// Must happen in beforeAll, before jest.clearAllMocks() wipes the call record.
let contentMessageListener: (
  msg: unknown
) => Promise<{ success: boolean; isRunning?: boolean }>;

beforeAll(() => {
  const addListenerMock = browser.runtime.onMessage.addListener as jest.Mock;
  contentMessageListener = addListenerMock.mock.calls[0]?.[0];
});

beforeEach(() => {
  resetState();
  jest.clearAllMocks();
  (browser.runtime.sendMessage as jest.Mock).mockResolvedValue({});
  (window.scrollTo as jest.Mock).mockClear();
});

describe('full single-offer activation flow', () => {
  it('should send updateProgress and huntingComplete after activating one offer', async () => {
    jest.useFakeTimers();
    document.body.innerHTML = SINGLE_OFFER_HTML;

    startHunting();

    // Advance in chunks so async polling loops (waitForPage, waitForDetailPage)
    // interleave properly with fake timers.
    // Simulate "Success Added" early — the immediate isAlreadyAdded check
    // in waitForOfferConfirmation will catch it after waitForDetailPage times out.
    const tile = document.getElementById('offer1')!;

    for (let i = 0; i < 60; i++) {
      await jest.advanceTimersByTimeAsync(500);
      // Set aria-label partway through so it's visible when the fallback runs
      if (i === 4) tile.setAttribute('aria-label', 'Success Added');
    }

    const sendMessageMock = browser.runtime.sendMessage as jest.Mock;
    const calls = sendMessageMock.mock.calls.map((c: unknown[]) => c[0]) as Array<{ action: string; [key: string]: unknown }>;

    const progressMsg = calls.find(c => c.action === 'updateProgress');
    const completeMsg = calls.find(c => c.action === 'huntingComplete');

    expect(progressMsg).toBeDefined();
    expect(progressMsg).toMatchObject({ action: 'updateProgress', current: 1, total: 1 });

    expect(completeMsg).toBeDefined();
    expect(completeMsg).toMatchObject({ action: 'huntingComplete', count: 1 });

    jest.useRealTimers();
  });
});

describe('clean stop before any processing', () => {
  it('should not send progress messages after stopHunting', async () => {
    jest.useFakeTimers();
    document.body.innerHTML = SINGLE_OFFER_HTML;

    // Start hunting via the message listener
    await contentMessageListener({ action: 'startHunting' });
    const statusAfterStart = await contentMessageListener({ action: 'getStatus' });
    expect(statusAfterStart.isRunning).toBe(true);

    // Stop immediately before any timers fire
    await contentMessageListener({ action: 'stopHunting' });
    const statusAfterStop = await contentMessageListener({ action: 'getStatus' });
    expect(statusAfterStop.isRunning).toBe(false);

    // Advance all timers — no updateProgress messages should be sent
    const sendMessageMock = browser.runtime.sendMessage as jest.Mock;
    const countBefore = sendMessageMock.mock.calls.length;

    await jest.advanceTimersByTimeAsync(15000);

    const progressCallsAfter = sendMessageMock.mock.calls
      .slice(countBefore)
      .filter((c: unknown[]) => (c[0] as { action: string }).action === 'updateProgress');
    expect(progressCallsAfter.length).toBe(0);

    jest.useRealTimers();
  });
});
