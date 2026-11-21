// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Manifest = Record<string, any>;

interface BuildTargets {
  buildManifest: (base: Manifest, target: string) => Manifest;
  TARGETS: string[];
}

const { buildManifest, TARGETS } = jest.requireActual<BuildTargets>(
  '../../config/build-targets.js'
);

const base = jest.requireActual<Manifest>('../../manifest.json');

describe('per-browser manifests', () => {
  it('keeps the Chrome service worker and drops Firefox-only keys', () => {
    const m = buildManifest(base, 'chrome');
    expect(m.background).toEqual({ service_worker: 'dist/background.js' });
    expect(m.browser_specific_settings).toBeUndefined();
    expect(m.permissions).toContain('notifications');
  });

  it('uses an event page and a gecko id for Firefox', () => {
    const m = buildManifest(base, 'firefox');
    expect(m.background).toEqual({ scripts: ['dist/background.js'] });
    expect(m.browser_specific_settings.gecko.id).toBe('chase-catcher@dimalama');
    expect(m.browser_specific_settings.gecko.data_collection_permissions).toEqual({
      required: ['none'],
    });
    expect(m.minimum_chrome_version).toBeUndefined();
  });

  it('uses a non-persistent background and no notifications for Safari', () => {
    const m = buildManifest(base, 'safari');
    expect(m.background).toEqual({ scripts: ['dist/background.js'], persistent: false });
    expect(m.permissions).not.toContain('notifications');
    expect(m.browser_specific_settings).toBeUndefined();
    expect(m.minimum_chrome_version).toBeUndefined();
  });

  it.each(TARGETS)('%s keeps host access and content script scoped to Chase', target => {
    const m = buildManifest(base, target);
    expect(m.manifest_version).toBe(3);
    expect(m.host_permissions).toEqual(['https://secure.chase.com/*']);
    expect(m.content_scripts[0].matches).toEqual(['https://secure.chase.com/*']);
  });

  it('does not mutate the base manifest', () => {
    const snapshot = JSON.stringify(base);
    TARGETS.forEach(t => buildManifest(base, t));
    expect(JSON.stringify(base)).toBe(snapshot);
  });

  it('rejects unknown targets', () => {
    expect(() => buildManifest(base, 'netscape')).toThrow('Unknown target');
  });
});
