import { describe, expect, it } from 'vitest';
import { compareVersion } from '../src/validator.js';

describe('SemVer precedence', () => {
  it('orders prerelease below release', () => {
    expect(compareVersion('1.0.0-rc.1', '1.0.0')).toBeLessThan(0);
  });

  it('compares numeric prerelease identifiers numerically', () => {
    expect(compareVersion('1.0.0-rc.2', '1.0.0-rc.10')).toBeLessThan(0);
  });

  it('ignores build metadata when comparing precedence', () => {
    expect(compareVersion('1.0.0+build.1', '1.0.0+build.2')).toBe(0);
  });

  it('orders shorter equal-prefix prereleases first', () => {
    expect(compareVersion('1.0.0-alpha', '1.0.0-alpha.1')).toBeLessThan(0);
  });
});
