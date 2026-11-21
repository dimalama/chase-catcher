import browser from 'webextension-polyfill';

/**
 * Origins the content script needs. Must match host_permissions in manifest.json.
 *
 * Chrome grants these at install time. Firefox and Safari let the user withhold
 * or revoke site access, in which case the content script never runs, so the
 * popup checks and, if needed, asks for access.
 */
export const CHASE_ORIGINS = ['https://secure.chase.com/*'];

/**
 * Resolves true when access is granted, or when the browser has no usable
 * permissions API (older Safari): in that case the caller just tries.
 */
export const hasHostAccess = async (): Promise<boolean> => {
  try {
    if (!browser.permissions?.contains) return true;
    return await browser.permissions.contains({ origins: CHASE_ORIGINS });
  } catch {
    return true;
  }
};

/**
 * Prompts for site access. Firefox only allows this inside a user-gesture
 * handler and drops the gesture after the first `await`, so callers must
 * invoke this synchronously at the top of a click handler.
 */
export const requestHostAccess = (): Promise<boolean> => {
  try {
    if (!browser.permissions?.request) return Promise.resolve(true);
    return browser.permissions.request({ origins: CHASE_ORIGINS }).catch(() => false);
  } catch {
    return Promise.resolve(false);
  }
};
