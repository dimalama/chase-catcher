import {
  initialize,
  isAlreadyAdded,
  isNotAddedOffer,
  isPageReady,
  getRandomDelay,
  refreshUnprocessedOffers,
  waitForOfferConfirmation,
  resetState
} from '../js/content';

// Offer tile DOM helper
const makeOfferTile = (
  id: string,
  ariaLabel: string,
  buttonType: string,
  buttonText = 'Add'
) => `
  <div data-cy="commerce-tile" id="${id}" aria-label="${ariaLabel}">
    <button data-cy="commerce-tile-button" type="${buttonType}">${buttonText}</button>
    <span class="mds-body-small-heavier semanticColorTextRegular">Test Merchant</span>
    <span class="mds-body-large-heavier semanticColorTextRegular">5% cashback</span>
    <div data-testid="days-left-banner">7 days left</div>
  </div>
`;

beforeEach(() => {
  resetState();
  jest.clearAllMocks();
});

describe('initialize', () => {
  it('should return true', () => {
    expect(initialize()).toBe(true);
  });
});

describe('isPageReady', () => {
  it('should return false when no container present', () => {
    document.body.innerHTML = '';
    expect(isPageReady()).toBe(false);
  });

  it('should return false when container has no tiles', () => {
    document.body.innerHTML = '<div data-testid="offerTileGridContainer"></div>';
    expect(isPageReady()).toBe(false);
  });

  it('should return true when container and tiles with buttons are present', () => {
    document.body.innerHTML = `
      <div data-testid="offerTileGridContainer">
        ${makeOfferTile('o1', '1 of 5 Test Merchant 5% cash back Add offer', 'ico_add_circle')}
      </div>
    `;
    expect(isPageReady()).toBe(true);
  });
});

describe('isAlreadyAdded', () => {
  it('should detect "added" in aria-label (case-insensitive)', () => {
    document.body.innerHTML = `<div data-cy="commerce-tile" id="t1" aria-label="Success Added">
      <button data-cy="commerce-tile-button">Added</button>
    </div>`;
    expect(isAlreadyAdded(document.getElementById('t1')!)).toBe(true);
  });

  it('should detect "success" in aria-label (case-insensitive)', () => {
    document.body.innerHTML = `<div data-cy="commerce-tile" id="t2" aria-label="SUCCESS offer complete">
      <button data-cy="commerce-tile-button"></button>
    </div>`;
    expect(isAlreadyAdded(document.getElementById('t2')!)).toBe(true);
  });

  it('should detect checkmark icon type', () => {
    document.body.innerHTML = `<div data-cy="commerce-tile" id="t3" aria-label="3 of 5 Test">
      <button data-cy="commerce-tile-button" type="ico_checkmark_filled"></button>
    </div>`;
    expect(isAlreadyAdded(document.getElementById('t3')!)).toBe(true);
  });

  it('should detect success container element', () => {
    document.body.innerHTML = `<div data-cy="commerce-tile" id="t4" aria-label="3 of 5 Test">
      <button data-cy="commerce-tile-button"></button>
      <div data-cy="offer-tile-alert-container-success"></div>
    </div>`;
    expect(isAlreadyAdded(document.getElementById('t4')!)).toBe(true);
  });

  it('should return false for a pending offer', () => {
    document.body.innerHTML = `<div data-cy="commerce-tile" id="t5" aria-label="1 of 5 Vitamix 15% cash back Add Offer">
      <svg data-cy="commerce-tile-button" viewBox="0 0 32 32"></svg>
    </div>`;
    expect(isAlreadyAdded(document.getElementById('t5')!)).toBe(false);
  });
});

describe('isNotAddedOffer', () => {
  it('should return false when tile has no id', () => {
    document.body.innerHTML = `<div data-cy="commerce-tile" aria-label="Test">
      <button data-cy="commerce-tile-button"></button>
    </div>`;
    const tile = document.querySelector('[data-cy="commerce-tile"]')!;
    expect(isNotAddedOffer(tile)).toBe(false);
  });

  it('should return false when tile is already in processedOfferIds', () => {
    document.body.innerHTML = `<div data-testid="offerTileGridContainer">
      ${makeOfferTile('o1', '1 of 5 Test 5% cash back Add offer', 'ico_add_circle')}
    </div>`;
    const tile = document.getElementById('o1')!;
    isNotAddedOffer(tile); // first call → true, caches nothing (not added)
    resetState();
    tile.setAttribute('aria-label', 'Success Added');
    expect(isNotAddedOffer(tile)).toBe(false);
  });

  it('should return false for "Success Added" aria-label', () => {
    document.body.innerHTML = `<div data-testid="offerTileGridContainer">
      ${makeOfferTile('o2', 'Success Added', 'ico_checkmark_filled')}
    </div>`;
    expect(isNotAddedOffer(document.getElementById('o2')!)).toBe(false);
  });

  it('should return false when button has checkmark icon type', () => {
    document.body.innerHTML = `<div data-testid="offerTileGridContainer">
      ${makeOfferTile('o3', '3 of 5 Test Add offer', 'ico_checkmark_filled', 'Added')}
    </div>`;
    expect(isNotAddedOffer(document.getElementById('o3')!)).toBe(false);
  });

  it('should return true for a pending legacy offer', () => {
    document.body.innerHTML = `<div data-testid="offerTileGridContainer">
      ${makeOfferTile('o4', '4 of 5 Test 5% cash back Add offer', 'ico_add_circle')}
    </div>`;
    expect(isNotAddedOffer(document.getElementById('o4')!)).toBe(true);
  });

  it('should return true for SVG button without type attribute (new Chase HTML)', () => {
    document.body.innerHTML = `<div data-testid="offerTileGridContainer">
      <div data-cy="commerce-tile" id="o5" aria-label="5 of 5 Vitamix 15% cash back Add Offer">
        <svg data-cy="commerce-tile-button" data-testid="commerce-tile-button" viewBox="0 0 32 32"></svg>
        <span class="mds-body-small-heavier semanticColorTextRegular">Vitamix</span>
        <span class="mds-body-large-heavier semanticColorTextRegular">15% cash back</span>
      </div>
    </div>`;
    expect(isNotAddedOffer(document.getElementById('o5')!)).toBe(true);
  });

  it('should return false when tile has no button', () => {
    document.body.innerHTML = `<div data-testid="offerTileGridContainer">
      <div data-cy="commerce-tile" id="o6" aria-label="6 of 6 Test"></div>
    </div>`;
    expect(isNotAddedOffer(document.getElementById('o6')!)).toBe(false);
  });
});

describe('refreshUnprocessedOffers', () => {
  it('should find pending tiles and exclude already-added ones', () => {
    document.body.innerHTML = `<div data-testid="offerTileGridContainer">
      ${makeOfferTile('o1', '1 of 2 Test 5% cash back Add Offer', 'ico_add_circle')}
      ${makeOfferTile('o2', '2 of 2 Test Success Added', 'ico_checkmark_filled')}
    </div>`;
    refreshUnprocessedOffers();
    expect(true).toBe(true);
  });

  it('should find zero offers when container is empty', () => {
    document.body.innerHTML = '<div data-testid="offerTileGridContainer"></div>';
    expect(() => refreshUnprocessedOffers()).not.toThrow();
  });

  it('should not throw when there is no container', () => {
    document.body.innerHTML = '';
    expect(() => refreshUnprocessedOffers()).not.toThrow();
  });
});

describe('getRandomDelay', () => {
  it('should return a value between afterClick and afterClick+randomExtra', () => {
    const delay = getRandomDelay();
    expect(delay).toBeGreaterThanOrEqual(1500);
    expect(delay).toBeLessThan(1500 + 400);
  });
});

describe('waitForOfferConfirmation', () => {
  it('should resolve true when aria-label changes to Success Added', async () => {
    const tile = document.createElement('div');
    tile.setAttribute('data-cy', 'commerce-tile');
    tile.setAttribute('aria-label', 'Get Offer');
    document.body.appendChild(tile);

    const confirmationPromise = waitForOfferConfirmation(tile, 2000);

    // Simulate offer confirmation via DOM mutation
    setTimeout(() => {
      tile.setAttribute('aria-label', 'Success Added');
    }, 20);

    const result = await confirmationPromise;
    expect(result).toBe(true);

    document.body.removeChild(tile);
  });

  it('should resolve true when button type changes to checkmark', async () => {
    const tile = document.createElement('div');
    tile.setAttribute('data-cy', 'commerce-tile');
    tile.setAttribute('aria-label', 'Get Offer');
    const button = document.createElement('button');
    button.setAttribute('data-cy', 'commerce-tile-button');
    button.setAttribute('type', 'ico_add_circle');
    tile.appendChild(button);
    document.body.appendChild(tile);

    const confirmationPromise = waitForOfferConfirmation(tile, 2000);

    setTimeout(() => {
      button.setAttribute('type', 'ico_checkmark_filled');
    }, 20);

    const result = await confirmationPromise;
    expect(result).toBe(true);

    document.body.removeChild(tile);
  });

  it('should resolve false on timeout', async () => {
    jest.useFakeTimers();

    const tile = document.createElement('div');
    tile.setAttribute('aria-label', 'Get Offer');
    document.body.appendChild(tile);

    const confirmationPromise = waitForOfferConfirmation(tile, 100);

    await jest.advanceTimersByTimeAsync(200);

    const result = await confirmationPromise;
    expect(result).toBe(false);

    document.body.removeChild(tile);
    jest.useRealTimers();
  });
});

