import browser from 'webextension-polyfill';
import type { ContentToPopupMessage, PopupToContentMessage, ContentMessageResponse } from './types';

const config = {
  selectors: {
    offerContainer: '[data-testid="offerTileGridContainer"], .offerTileGridItemContainer',
    offerTile: '[data-cy="commerce-tile"]',
    addButton: '[data-cy="commerce-tile-button"]',
    daysLeft: '[data-testid="days-left-banner"]',
    merchantName: '.mds-body-small-heavier[class*="semanticColorTextRegular"]',
    cashbackAmount: '.mds-body-large-heavier[class*="semanticColorTextRegular"]',
    offerButtonContainer: '[data-cy="offer-tile-alert-container-success"], [class^="r9j"]'
  },
  delays: {
    afterClick: 1500,
    randomExtra: 400,
    minDelay: 500,
    checkInterval: 50,
    scrollReveal: 800,
    scrollSettle: 400,
    confirmationTimeout: 5000,
    detailPageTimeout: 4000,
    backNavigationTimeout: 5000
  }
};

// Global state tracking
let isRunning = false;
let unprocessedOffers: Element[] = [];
let processedOfferIds = new Set<string>();
let activatedCount = 0;
let totalOffers = 0;
const offerRetryCount = new Map<string, number>();

/**
 * Resets all mutable state — exported for test isolation.
 */
export const resetState = (): void => {
  isRunning = false;
  unprocessedOffers = [];
  processedOfferIds = new Set();
  activatedCount = 0;
  totalOffers = 0;
  offerRetryCount.clear();
};

/**
 * Initializes the content script.
 */
export const initialize = (): boolean => {
  console.log('🎯 ChaseCatcher initialized and ready!');
  return true;
};

/**
 * Generates a random delay within configured bounds.
 */
export const getRandomDelay = (): number => {
  return Math.random() * config.delays.randomExtra + config.delays.afterClick;
};

/**
 * Checks if the offers page is loaded and interactive.
 */
export const isPageReady = (): boolean => {
  const container = document.querySelector(config.selectors.offerContainer);
  if (!container) return false;
  return (
    document.querySelectorAll(config.selectors.offerTile).length > 0 &&
    document.querySelectorAll('[data-cy="commerce-tile-button"]').length > 0
  );
};

/**
 * Waits for the page to become ready with a timeout.
 */
const waitForPage = async (maxWait = 3000): Promise<boolean> => {
  const startTime = Date.now();
  while (Date.now() - startTime < maxWait) {
    if (isPageReady()) {
      await new Promise(resolve => setTimeout(resolve, 100));
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, config.delays.checkInterval));
  }
  return false;
};

/**
 * Checks multiple DOM signals to determine if a tile is already activated.
 * Returns true if ANY "already added" signal is found.
 */
export const isAlreadyAdded = (tile: Element): boolean => {
  const ariaLabel = (tile.getAttribute('aria-label') ?? '').toLowerCase();

  // Signal 1: aria-label contains added/success markers
  if (ariaLabel.includes('added') || ariaLabel.includes('success')) return true;

  const button = tile.querySelector(config.selectors.addButton);
  if (button) {
    // Signal 2: legacy icon type attribute
    if (button.getAttribute('type') === 'ico_checkmark_filled') return true;

    // Signal 3: button text
    const btnText = (button.textContent ?? '').trim().toLowerCase();
    if (btnText === 'added') return true;
  }

  // Signal 4: success container present
  if (tile.querySelector('[data-cy="offer-tile-alert-container-success"]')) return true;

  return false;
};

/**
 * Checks if an offer tile has not yet been added.
 * Inverted logic: all tiles are candidates unless proven already-added.
 */
export const isNotAddedOffer = (offerDiv: Element): boolean => {
  const tile = offerDiv.closest(config.selectors.offerTile) ?? offerDiv;
  if (!(tile as HTMLElement).id) return false;

  const offerId = (tile as HTMLElement).id;
  if (processedOfferIds.has(offerId)) return false;

  if (isAlreadyAdded(tile)) {
    processedOfferIds.add(offerId);
    return false;
  }

  // Must have a clickable button
  const button = tile.querySelector(config.selectors.addButton);
  if (!button) return false;

  return true;
};

/**
 * Updates the list of unprocessed offers on the page.
 * Grabs all commerce tiles and excludes already-added ones.
 */
export const refreshUnprocessedOffers = (): void => {
  const allTiles = Array.from(document.querySelectorAll(config.selectors.offerTile));
  unprocessedOffers = allTiles.filter(isNotAddedOffer);
  console.log(`🎯 Found ${unprocessedOffers.length} uncaught rewards to process`);
};

/**
 * Scrolls to the bottom and back to reveal lazy-loaded offers.
 */
export const scrollToRevealOffers = async (): Promise<void> => {
  window.scrollTo(0, document.body.scrollHeight);
  await new Promise(resolve => setTimeout(resolve, config.delays.scrollReveal));
  window.scrollTo(0, 0);
  await new Promise(resolve => setTimeout(resolve, config.delays.scrollSettle));
};

/**
 * Waits for a tile's DOM to change to a confirmed state via MutationObserver.
 * Resolves true on success, false on timeout.
 */
export const waitForOfferConfirmation = (
  tile: Element,
  timeoutMs = config.delays.confirmationTimeout
): Promise<boolean> => {
  return new Promise(resolve => {
    // Check immediately in case state changed during detail-page wait
    if (isAlreadyAdded(tile)) {
      resolve(true);
      return;
    }

    const timeoutHandle = setTimeout(() => {
      observer.disconnect();
      resolve(false);
    }, timeoutMs);

    const observer = new MutationObserver(() => {
      if (isAlreadyAdded(tile)) {
        clearTimeout(timeoutHandle);
        observer.disconnect();
        resolve(true);
      }
    });

    observer.observe(tile, { attributes: true, childList: true, subtree: true });
  });
};

/**
 * Detects if Chase navigated to the offer detail page (SPA route change).
 */
const waitForDetailPage = async (
  maxWait = config.delays.detailPageTimeout
): Promise<boolean> => {
  const start = Date.now();
  while (Date.now() - start < maxWait) {
    if (
      document.querySelector('[data-testid="backNavigation"]') ||
      document.querySelector('[data-testid="added-to-card-alert"]')
    ) {
      return true;
    }
    await new Promise(r => setTimeout(r, config.delays.checkInterval));
  }
  return false;
};

/**
 * Checks if the detail page shows a successful "Added to card" confirmation.
 */
const isDetailPageConfirmed = (): boolean => {
  if (document.querySelector('[data-testid="added-to-card-alert"]')) return true;
  const body = document.body.textContent?.toLowerCase() ?? '';
  return body.includes('added to card') || body.includes('success');
};

/**
 * Navigates back from the detail page and waits for the offers list to reload.
 */
const navigateBackToList = async (): Promise<void> => {
  console.log('🔙 Navigating back to offers list');
  window.history.back();
  await waitForPage(config.delays.backNavigationTimeout);
};

const notifyComplete = (): void => {
  const msg: ContentToPopupMessage = {
    action: 'huntingComplete',
    success: true,
    count: activatedCount
  };
  browser.runtime.sendMessage(msg).catch(() => {});
};

const scheduleNext = (): void => {
  setTimeout(() => processNextOffer().catch(fatalGuard), getRandomDelay());
};

const fatalGuard = (err: unknown): void => {
  console.error('🔴 Unexpected error in processNextOffer, continuing…', err);
  if (isRunning) scheduleNext();
};

const processNextOffer = async (): Promise<void> => {
  if (!isRunning) {
    console.log('⏸️ Catching paused!');
    return;
  }

  try {
    const pageReady = await Promise.race([
      waitForPage(),
      new Promise<boolean>(resolve => setTimeout(() => resolve(false), config.delays.minDelay))
    ]);

    if (!pageReady) {
      await waitForPage(2000);
    }

    refreshUnprocessedOffers();
    const nextOffer = unprocessedOffers.shift();

    if (!nextOffer) {
      console.log('✨ All done! Every reward has been caught!');
      notifyComplete();
      isRunning = false;
      processedOfferIds.clear();
      return;
    }

    const tileId = (nextOffer as HTMLElement).id;
    const retryCount = offerRetryCount.get(tileId) ?? 0;

    if (retryCount >= 3) {
      console.log(`⚠️ Skipping offer ${tileId} after 3 failed attempts`);
      processedOfferIds.add(tileId);
      scheduleNext();
      return;
    }

    const merchant =
      nextOffer.querySelector(config.selectors.merchantName)?.textContent ?? 'Unknown';
    const cashback =
      nextOffer.querySelector(config.selectors.cashbackAmount)?.textContent ?? '';
    const daysLeft =
      nextOffer.querySelector(config.selectors.daysLeft)?.textContent ?? '';

    // Click the tile — Chase navigates to detail page and adds the offer
    (nextOffer as HTMLElement).click();
    processedOfferIds.add(tileId);
    console.log(`🎯 Capturing offer: ${merchant} - ${cashback} (${daysLeft})`);

    // Chase SPA navigates to a detail page after clicking
    const navigatedToDetail = await waitForDetailPage();
    let confirmed = false;

    if (navigatedToDetail) {
      confirmed = isDetailPageConfirmed();
      console.log(`📋 Detail page: ${confirmed ? 'confirmed ✅' : 'not confirmed ❌'}`);
      await navigateBackToList();
    } else {
      // Fallback: stayed on list page (inline add)
      confirmed = await waitForOfferConfirmation(nextOffer);
    }

    if (confirmed) {
      activatedCount++;
      const progress = totalOffers > 0 ? Math.round((activatedCount / totalOffers) * 100) : 0;
      const msg: ContentToPopupMessage = {
        action: 'updateProgress',
        current: activatedCount,
        total: totalOffers,
        progress
      };
      browser.runtime.sendMessage(msg).catch(() => {});
    } else {
      console.log(`⚠️ Offer confirmation timeout for ${tileId}, will retry`);
      offerRetryCount.set(tileId, retryCount + 1);
      processedOfferIds.delete(tileId);
    }

    scheduleNext();
  } catch (error) {
    console.log(`⚠️ Failed to capture offer: ${(error as Error).message}`);
    if (isRunning) scheduleNext();
  }
};

/**
 * Starts the hunting process — exported for integration tests.
 */
export const startHunting = (): void => {
  isRunning = true;
  activatedCount = 0;
  offerRetryCount.clear();
  processedOfferIds.clear();
  unprocessedOffers = [];
  console.log('🎯 Starting the hunt for Chase offers!');
  scrollToRevealOffers()
    .catch(() => console.log('⚠️ Scroll reveal failed, continuing anyway'))
    .then(() => {
      refreshUnprocessedOffers();
      totalOffers = unprocessedOffers.length;
      processNextOffer().catch(fatalGuard);
    });
};

browser.runtime.onMessage.addListener((message: unknown): Promise<ContentMessageResponse> => {
  const msg = message as PopupToContentMessage;
  try {
    if (msg.action === 'startHunting') {
      const offerContainer = document.querySelector(config.selectors.offerContainer);
      const offerTiles = document.querySelectorAll(config.selectors.offerTile);

      if (!offerContainer && !offerTiles.length) {
        console.log('❌ No offers found - are you on the right page?');
        return Promise.resolve({ success: false, error: 'Wrong page' });
      }

      isRunning = true;
      startHunting();
      return Promise.resolve({ success: true });
    }

    if (msg.action === 'stopHunting') {
      isRunning = false;
      return Promise.resolve({ success: true });
    }

    if (msg.action === 'getStatus') {
      return Promise.resolve({ success: true, isRunning });
    }

    return Promise.resolve({ success: false, error: 'Unknown action' });
  } catch (error) {
    console.error('Error in message handler:', error);
    return Promise.resolve({ success: false, error: (error as Error).message });
  }
});

// Initialize when script loads
initialize();
