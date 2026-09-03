import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { jsonFiles, loadJson } from '../src/io.js';
import { materializeInvalidFixture, mutate, type InvalidFixture } from '../src/fixtures.js';
import { validatePackage } from '../src/validator.js';
import { createExternalContract, verifyExternalPackage } from '../src/external-verifier.js';
import { base, root } from './helpers.js';

describe('reason-specific semantic counterexamples', () => {
  const files = jsonFiles(path.join(root, 'conformance', 'invalid')).filter((f) =>
    f.endsWith('.fixture.json'),
  );
  it('has broad negative coverage', () => expect(files.length).toBeGreaterThanOrEqual(40));

  for (const file of files) {
    const fixture = loadJson<InvalidFixture>(file);
    it(`rejects ${fixture.name} as ${fixture.expectedCode}`, () => {
      const source = base();
      let diagnostics;
      if (fixture.validationMode === 'external-ocrs-contract') {
        const reference = source.records.find(
          (record) => record.entityType === 'external-package-reference',
        )!;
        const supplied = createExternalContract(reference);
        const mutatedReference = mutate(source, fixture.mutations).records.find(
          (record) => record.entityType === 'external-package-reference',
        )!;
        diagnostics = verifyExternalPackage(mutatedReference, supplied);
      } else diagnostics = validatePackage(materializeInvalidFixture(source, fixture));
      expect(diagnostics.map((d) => d.code)).toContain(fixture.expectedCode);
    });
  }
});
