/**
 * Configuration for DOM selectors and timing parameters
 */
const config = {
  selectors: {
    offerContainer: '[data-testid="offerTileGridContainer"], .offerTileGridItemContainer',
    offerTile: '[data-cy="commerce-tile"]',
    addButton: '[data-cy="commerce-tile-button"]',
    daysLeft: '[data-testid="days-left-banner"]',
    // Use more reliable selectors with data attributes
    merchantName: '.mds-body-small-heavier[class*="semanticColorTextRegular"]',
    cashbackAmount: '.mds-body-large-heavier[class*="semanticColorTextRegular"]',
    // Support both types of button containers
    offerButtonContainer: '[data-cy="offer-tile-alert-container-success"], [class^="r9j"]'
  },
  delays: {
    afterClick: 1500,     // Delay after clicking an offer button
    randomExtra: 400,     // Random additional delay to avoid detection
    afterBack: 800,       // Delay after navigating back
    minDelay: 500,        // Minimum delay between operations
    checkInterval: 50     // Interval for checking page readiness
  }
};

// Global state tracking
let isRunning = false;
let unprocessedOffers = [];
let processedOfferIds = new Set();

/**
 * Initializes the content script
 * @returns {boolean} True if initialization successful
 */
const initialize = () => {
  console.log('🎯 ChaseCatcher initialized and ready!');
  return true;
};

/**
 * Generates a random delay within configured bounds
 * @returns {number} Delay in milliseconds
 */
const getRandomDelay = () => {
  return Math.random() * config.delays.randomExtra + config.delays.afterClick;
};

/**
 * Checks if the offers page is loaded and interactive
 * @returns {boolean} True if page is ready for interaction
 */
const isPageReady = () => {
  const container = document.querySelector(config.selectors.offerContainer);
  if (!container) return false;

  // Use data attributes which are more stable than class names
  return document.querySelectorAll(config.selectors.offerTile).length > 0 &&
         document.querySelectorAll(`[data-cy="commerce-tile-button"]`).length > 0;
};

/**
 * Waits for the page to become ready with a timeout
 * @param {number} maxWait Maximum time to wait in milliseconds
 * @returns {Promise<boolean>} True if page became ready before timeout
 */
const waitForPage = async (maxWait = 3000) => {
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
 * Checks if an offer hasn't been added yet
 * @param {HTMLElement} offerDiv The offer container element
 * @returns {boolean} True if offer is available and not yet added
 */
const isNotAddedOffer = (offerDiv) => {
  const tile = offerDiv.closest(config.selectors.offerTile);
  if (!tile) return false;

  const offerId = tile.id;
  if (processedOfferIds.has(offerId)) return false;

  const ariaLabel = tile.getAttribute('aria-label');
  if (!ariaLabel) return false;

  if (ariaLabel.includes('Success Added')) {
    processedOfferIds.add(offerId);
    return false;
  }

  const icon = offerDiv.querySelector(config.selectors.addButton);
  if (!icon) return false;

  const iconType = icon.getAttribute('type');
  if (iconType === 'ico_checkmark_filled') {
    processedOfferIds.add(offerId);
    return false;
  }

  return iconType === 'ico_add_circle';
};

/**
 * Updates the list of unprocessed offers on the page
 */
const refreshUnprocessedOffers = () => {
  // Find all offer tiles first
  const allTiles = Array.from(document.querySelectorAll(config.selectors.offerTile));

  // Then filter to find those with add buttons
  const containers = allTiles.filter(tile => {
    const button = tile.querySelector('[data-cy="commerce-tile-button"][type="ico_add_circle"]');
    return button !== null;
  });

  unprocessedOffers = containers.filter(isNotAddedOffer);
  console.log(`🎯 Found ${unprocessedOffers.length} uncaught rewards to process`);
};

/**
 * Processes the next available offer in the queue
 * @returns {Promise<void>}
 */
const processNextOffer = async () => {
  if (!isRunning) {
    console.log('⏸️ Catching paused!');
    return;
  }

  const pageReady = await Promise.race([
    waitForPage(),
    new Promise(resolve => setTimeout(resolve, config.delays.minDelay)).then(() => false)
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
    return;
  }

  try {
    // Find merchant and cashback info using more reliable selectors
    const merchant = nextOffer.querySelector(config.selectors.merchantName)?.textContent || 'Unknown';
    const cashback = nextOffer.querySelector(config.selectors.cashbackAmount)?.textContent || '';
    const daysLeft = nextOffer.querySelector(config.selectors.daysLeft)?.textContent || '';

    const addButton = nextOffer.querySelector(config.selectors.addButton);
    if (!addButton) {
      throw new Error('Add button not found');
    }

    addButton.click();
    processedOfferIds.add(nextOffer.id); // Cache the processed offer ID
    console.log(`🎯 Capturing offer: ${merchant} - ${cashback} (${daysLeft})`);

    // Schedule navigation back and next offer processing
    setTimeout(() => {
      window.history.back();
      setTimeout(processNextOffer, getRandomDelay());
    }, getRandomDelay());

  } catch (error) {
    console.log(`⚠️ Failed to capture offer: ${error.message}`);
    // Remove the failed offer from unprocessed list to avoid infinite loop
    unprocessedOffers = unprocessedOffers.filter(o => o !== nextOffer);
    setTimeout(processNextOffer, getRandomDelay());
  }
};

/**
 * Starts the hunting process
 */
const startHunting = () => {
  isRunning = true;
  console.log('🎯 Starting the hunt for Chase offers!');
  unprocessedOffers = []; // Reset the list
  processedOfferIds.clear(); // Clear the processed offers cache
  processNextOffer();
};

/**
 * Listens for messages from popup
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  try {
    if (message.action === 'startHunting') {
      // Check for offer containers or tiles using multiple selectors to be more robust
      const offerContainer = document.querySelector(config.selectors.offerContainer);
      const offerTiles = document.querySelectorAll(config.selectors.offerTile);
      
      if (!offerContainer && !offerTiles.length) {
        console.log('❌ No offers found - are you on the right page?');
        sendResponse({ success: false, error: 'Wrong page' });
        return false;
      }
      
      isRunning = true;
      startHunting();
      sendResponse({ success: true });
      return false;
    }

    if (message.action === 'stopHunting') {
      isRunning = false;
      sendResponse({ success: true });
      return false;
    }

    if (message.action === 'getStatus') {
      sendResponse({ isRunning, success: true });
      return false;
    }
    
    // Default response for unknown actions
    sendResponse({ success: false, error: 'Unknown action' });
  } catch (error) {
    console.error('Error in message handler:', error);
    sendResponse({ success: false, error: error.message });
  }
  return true; // Keep the message channel open for async response
});

/**
 * Sends completion message to popup
 */
const notifyComplete = () => {
  chrome.runtime.sendMessage({
    action: 'huntingComplete',
    success: true
  });
};

// Initialize when script loads
initialize();
