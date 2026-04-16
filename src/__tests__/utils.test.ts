import { calculateProgress } from '../utils/progress';
import { isChaseUrl } from '../utils/url';

describe('calculateProgress', () => {
  it('should return 0 when total is 0', () => {
    expect(calculateProgress(0, 0)).toBe(0);
  });

  it('should return 0 when current is 0', () => {
    expect(calculateProgress(0, 10)).toBe(0);
  });

  it('should return 50 when halfway done', () => {
    expect(calculateProgress(5, 10)).toBe(50);
  });

  it('should return 100 when current equals total', () => {
    expect(calculateProgress(10, 10)).toBe(100);
  });

  it('should return 100 when current exceeds total', () => {
    expect(calculateProgress(12, 10)).toBe(100);
  });

  it('should round to nearest integer', () => {
    expect(calculateProgress(1, 3)).toBe(33);
  });
});

describe('isChaseUrl', () => {
  it('should return false for undefined', () => {
    expect(isChaseUrl(undefined)).toBe(false);
  });

  it('should return false for empty string', () => {
    expect(isChaseUrl('')).toBe(false);
  });

  it('should return true for secure.chase.com', () => {
    expect(isChaseUrl('https://secure.chase.com/web/auth/offers')).toBe(true);
  });

  it('should return true for www.chase.com', () => {
    expect(isChaseUrl('https://www.chase.com/personal/credit-cards/rewards/offers')).toBe(true);
  });

  it('should return true for creditcards.chase.com', () => {
    expect(isChaseUrl('https://creditcards.chase.com/rewards-credit-cards/rewards/offers')).toBe(true);
  });

  it('should return false for non-HTTPS chase URL', () => {
    expect(isChaseUrl('http://secure.chase.com/web/auth/offers')).toBe(false);
  });

  it('should return false for spoofed subdomain', () => {
    expect(isChaseUrl('https://chase.fake.com/offers')).toBe(false);
  });

  it('should return false for unrelated domain', () => {
    expect(isChaseUrl('https://example.com')).toBe(false);
  });

  it('should return false for malformed URL', () => {
    expect(isChaseUrl('not-a-url')).toBe(false);
  });
});
