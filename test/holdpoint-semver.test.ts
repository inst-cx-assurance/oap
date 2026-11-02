import { describe, expect, it } from 'vitest';
import { compareVersion } from '../src/validator.js';

describe('Holdpoint #7: SemVer precedence', () => {
  it('sorts prereleases before stable releases', () => {
    expect(compareVersion('1.0.0-rc.1', '1.0.0')).toBeLessThan(0);
    expect(compareVersion('1.0.0', '1.0.0-rc.1')).toBeGreaterThan(0);
  });
  it('sorts numeric prerelease identifiers numerically', () => {
    expect(compareVersion('1.0.0-rc.2', '1.0.0-rc.10')).toBeLessThan(0);
  });
  it('ignores build metadata for precedence', () => {
    expect(compareVersion('1.0.0+build.1', '1.0.0+build.2')).toBe(0);
  });
  it('sorts numeric prerelease identifiers below alphanumeric identifiers', () => {
    expect(compareVersion('1.0.0-1', '1.0.0-alpha')).toBeLessThan(0);
  });
});
