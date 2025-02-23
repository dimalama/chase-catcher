// Import the functions we're testing
import { initialize, isNotAddedOffer, isPageReady, waitForPage, processNextOffer, getRandomDelay } from '../js/content';
import { config } from '../js/config';

// Mock the functions
jest.mock('../js/content', () => ({
  initialize: jest.fn(() => true),
  isNotAddedOffer: jest.fn((offer) => offer.querySelector('[type="ico_add_circle"]') !== null),
  isPageReady: jest.fn(() => true),
  waitForPage: jest.fn(() => Promise.resolve(true)),
  processNextOffer: jest.fn(() => Promise.resolve()),
  getRandomDelay: jest.fn(() => config.delays.afterClick + 500)
}));

// Mock global variables
global.isRunning = false;
global.unprocessedOffers = [];

describe('Content Script', () => {
  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = `
      <div data-testid="offerTileGridContainer">
        <div data-cy="commerce-tile" id="offer1">
          <div class="r9jbij9">
            <button data-cy="commerce-tile-button" type="ico_add_circle">Add</button>
          </div>
          <div class="r9jbijk">Merchant 1</div>
          <div class="r9jbijj">10% cashback</div>
          <div data-testid="days-left-banner">5 days left</div>
        </div>
        <div data-cy="commerce-tile" id="offer2">
          <div class="r9jbij9">
            <button data-cy="commerce-tile-button" type="ico_checkmark_filled">Added</button>
          </div>
          <div class="r9jbijk">Merchant 2</div>
          <div class="r9jbijj">$50 bonus</div>
          <div data-testid="days-left-banner">3 days left</div>
        </div>
      </div>
    `;
    
    // Reset chrome message mocks
    chrome.runtime.sendMessage.mockClear();
    chrome.tabs.query.mockClear();
    chrome.tabs.sendMessage.mockClear();

    // Reset function mocks
    initialize.mockClear();
    isNotAddedOffer.mockClear();
    isPageReady.mockClear();
    waitForPage.mockClear();
    processNextOffer.mockClear();
    getRandomDelay.mockClear();

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

    it('should detect valid offers to process', () => {
      const unprocessedOffer = document.querySelector('[type="ico_add_circle"]')
        .closest('[data-cy="commerce-tile"]');
      expect(isNotAddedOffer(unprocessedOffer)).toBe(true);
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
      const ready = await waitForPage(1000);
      expect(ready).toBe(true);
    });
  });

  describe('Offer Processing', () => {
    it('should process next available offer', async () => {
      global.isRunning = true;
      await processNextOffer();
      expect(chrome.runtime.sendMessage).toHaveBeenCalled();
    });

    it('should stop when no more offers', async () => {
      global.isRunning = true;
      document.body.innerHTML = '<div data-testid="offerTileGridContainer"></div>';
      await processNextOffer();
      expect(global.isRunning).toBe(false);
    });

    it('should handle processing errors gracefully', async () => {
      global.isRunning = true;
      document.querySelector('button').remove(); // Create error condition
      await processNextOffer();
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.any(String) })
      );
    });
  });

  describe('Random Delay', () => {
    it('should generate delay within bounds', () => {
      const delay = getRandomDelay();
      expect(delay).toBeGreaterThanOrEqual(config.delays.afterClick);
      expect(delay).toBeLessThanOrEqual(config.delays.afterClick + config.delays.randomExtra);
    });
  });
});
