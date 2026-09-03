import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { jsonFiles, loadJson } from '../src/io.js';
import { mutate, type InvalidFixture } from '../src/fixtures.js';
import { validatePackage } from '../src/validator.js';
import { base, root } from './helpers.js';

describe('reason-specific semantic counterexamples', () => {
  const files = jsonFiles(path.join(root, 'conformance', 'invalid')).filter((f) =>
    f.endsWith('.fixture.json'),
  );
  it('has broad negative coverage', () => expect(files.length).toBeGreaterThanOrEqual(40));

  for (const file of files) {
    const fixture = loadJson<InvalidFixture>(file);
    it(`rejects ${fixture.name} as ${fixture.expectedCode}`, () => {
      const diagnostics = validatePackage(mutate(base(), fixture.mutations));
      expect(diagnostics.map((d) => d.code)).toContain(fixture.expectedCode);
    });
  }
});
