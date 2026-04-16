/**
 * Returns true when the URL is a secure (HTTPS) chase.com subdomain.
 * Rejects plain http, non-chase hosts, and spoofed subdomains like chase.fake.com.
 */
export const isChaseUrl = (url: string | undefined): boolean => {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && parsed.hostname.endsWith('.chase.com');
  } catch {
    return false;
  }
};
