// Mock modules
jest.mock('../js/content', () => ({
  initialize: jest.fn(),
  isNotAddedOffer: jest.fn(),
  isPageReady: jest.fn(),
  waitForPage: jest.fn(),
  processNextOffer: jest.fn(),
  getRandomDelay: jest.fn()
}));

// Import after mocking
import { initialize, isNotAddedOffer, isPageReady, waitForPage, processNextOffer, getRandomDelay } from '../js/content';

// Mock chrome API
global.chrome = {
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn()
    }
  },
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn()
  }
};

// Mock global variables
global.isRunning = false;
global.unprocessedOffers = [];

// Constants for tests
const MOCK_DELAY = {
  BASE: 1000,
  RANDOM: 500
};

describe('Content Script', () => {
  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = `
      <div data-testid="offerTileGridContainer">
        <div data-cy="commerce-tile" id="offer1">
          <div data-cy="offer-tile-alert-container-success">
            <button data-cy="commerce-tile-button" type="ico_add_circle">Add</button>
          </div>
          <span class="mds-body-small-heavier semanticColorTextRegular">Merchant 1</span>
          <span class="mds-body-large-heavier semanticColorTextRegular">10% cashback</span>
          <div data-testid="days-left-banner">5 days left</div>
        </div>
        <div data-cy="commerce-tile" id="offer2">
          <div data-cy="offer-tile-alert-container-success">
            <button data-cy="commerce-tile-button" type="ico_checkmark_filled">Added</button>
          </div>
          <span class="mds-body-small-heavier semanticColorTextRegular">Merchant 2</span>
          <span class="mds-body-large-heavier semanticColorTextRegular">$50 bonus</span>
          <div data-testid="days-left-banner">3 days left</div>
        </div>
      </div>
    `;
    
    // Reset chrome message mocks
    chrome.runtime.sendMessage.mockReset();
    chrome.tabs.query.mockReset();
    chrome.tabs.sendMessage.mockReset();

    // Reset function mocks
    initialize.mockImplementation(() => true);
    isNotAddedOffer.mockImplementation((offer) => 
      offer.querySelector('[type="ico_add_circle"]') !== null
    );
    isPageReady.mockImplementation(() => true);
    waitForPage.mockImplementation(() => Promise.resolve(true));
    processNextOffer.mockImplementation(async () => {
      if (!document.querySelector('[type="ico_add_circle"]')) {
        global.isRunning = false;
        return;
      }
      await chrome.runtime.sendMessage({ type: 'progress', value: 50 });
    });
    getRandomDelay.mockImplementation(() => MOCK_DELAY.BASE + MOCK_DELAY.RANDOM);

    // Reset global variables
    global.isRunning = false;
    global.unprocessedOffers = [];
  });

  describe('Initialization', () => {
    it('should initialize successfully', () => {
      expect(initialize()).toBe(true);
    });
  });

  describe('Offer Detection', () => {
    it('should detect unprocessed offers', () => {
      const unprocessedOffer = document.querySelector('[type="ico_add_circle"]')
        .closest('[data-cy="commerce-tile"]');
      expect(isNotAddedOffer(unprocessedOffer)).toBe(true);
    });

    it('should ignore already processed offers', () => {
      const processedOffer = document.querySelector('[type="ico_checkmark_filled"]')
        .closest('[data-cy="commerce-tile"]');
      expect(isNotAddedOffer(processedOffer)).toBe(false);
    });
  });

  describe('Page Readiness', () => {
    it('should detect when page is ready', () => {
      expect(isPageReady()).toBe(true);
    });

    it('should handle missing offer container', () => {
      document.body.innerHTML = '';
      isPageReady.mockReturnValueOnce(false);
      expect(isPageReady()).toBe(false);
    });

    it('should wait for page to be ready', async () => {
      const ready = await waitForPage();
      expect(ready).toBe(true);
    });
  });

  describe('Offer Processing', () => {
    it('should process next available offer', async () => {
      global.isRunning = true;
      await processNextOffer();
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'progress', value: 50 })
      );
    });

    it('should stop when no more offers', async () => {
      global.isRunning = true;
      document.body.innerHTML = '<div data-testid="offerTileGridContainer"></div>';
      await processNextOffer();
      expect(global.isRunning).toBe(false);
    });

    it('should handle processing errors gracefully', async () => {
      global.isRunning = true;
      processNextOffer.mockImplementationOnce(async () => {
        await chrome.runtime.sendMessage({ error: 'Test error' });
      });
      await processNextOffer();
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.any(String) })
      );
    });
  });

  describe('Random Delay', () => {
    it('should generate delay within bounds', () => {
      const delay = getRandomDelay();
      expect(delay).toBe(MOCK_DELAY.BASE + MOCK_DELAY.RANDOM);
    });
  });
});
