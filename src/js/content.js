/**
 * Configuration for DOM selectors and timing parameters
 */
const config = {
  selectors: {
    offerContainer: '[data-testid="offerTileGridContainer"]',
    offerTile: '[data-cy="commerce-tile"]',
    addButton: '[data-cy="commerce-tile-button"]',
    daysLeft: '[data-testid="days-left-banner"]',
    merchantName: '.r9jbijk',
    cashbackAmount: '.r9jbijj',
    offerButtonContainer: '.r9jbij9'
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
  
  const selector = `${config.selectors.offerButtonContainer}:has([data-cy="commerce-tile-button"][type="ico_add_circle"])`;
  return document.querySelectorAll(selector).length > 0;
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
  const tile = offerDiv.closest('[data-cy="commerce-tile"]');
  if (!tile) return false;
  
  const offerId = tile.id;
  if (processedOfferIds.has(offerId)) return false;

  const ariaLabel = tile.getAttribute('aria-label');
  if (!ariaLabel) return false;
  
  if (ariaLabel.includes('Success Added')) {
    processedOfferIds.add(offerId);
    return false;
  }

  const icon = offerDiv.querySelector('[data-cy="commerce-tile-button"]');
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
  const selector = `${config.selectors.offerButtonContainer}:has([data-cy="commerce-tile-button"][type="ico_add_circle"])`;
  const containers = document.querySelectorAll(selector);
  
  unprocessedOffers = [...containers].filter(isNotAddedOffer);
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
    const offerTile = nextOffer.closest('[data-cy="commerce-tile"]');
    const merchant = offerTile.querySelector(config.selectors.merchantName)?.textContent || 'Unknown';
    const cashback = offerTile.querySelector(config.selectors.cashbackAmount)?.textContent || '';
    const daysLeft = offerTile.querySelector(config.selectors.daysLeft)?.textContent || '';

    const addButton = nextOffer.querySelector('[data-cy="commerce-tile-button"]');
    if (!addButton) {
      throw new Error('Add button not found');
    }

    addButton.click();
    processedOfferIds.add(offerTile.id); // Cache the processed offer ID
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
      if (!document.querySelector(config.selectors.offerContainer)) {
        console.log('❌ No offer container found - are you on the right page?');
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
  } catch (error) {
    console.error('Error in message handler:', error);
    sendResponse({ success: false, error: error.message });
  }
  return false;
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
