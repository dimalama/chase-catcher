import browser from 'webextension-polyfill';

/**
 * Bump this when the disclaimer text changes materially so users must
 * re-accept the new terms.
 */
export const DISCLAIMER_VERSION = 1;
export const DISCLAIMER_STORAGE_KEY = 'disclaimerAccepted';

interface StoredAcceptance {
  version: number;
  acceptedAt: string;
}

/**
 * Returns true when the user has accepted the current disclaimer version.
 * Any storage failure is treated as "not accepted".
 */
export const hasAcceptedDisclaimer = async (): Promise<boolean> => {
  try {
    const result = await browser.storage.local.get(DISCLAIMER_STORAGE_KEY);
    const stored = result[DISCLAIMER_STORAGE_KEY] as StoredAcceptance | undefined;
    return stored?.version === DISCLAIMER_VERSION;
  } catch {
    return false;
  }
};

export const acceptDisclaimer = async (): Promise<void> => {
  const value: StoredAcceptance = {
    version: DISCLAIMER_VERSION,
    acceptedAt: new Date().toISOString(),
  };
  await browser.storage.local.set({ [DISCLAIMER_STORAGE_KEY]: value });
};
