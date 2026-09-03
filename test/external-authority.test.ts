import { describe, expect, it } from 'vitest';
import { verifyExternalPackage } from '../src/external-verifier.js';
import { canonicalize, inventoryDigest, sha256 } from '../src/integrity.js';
import { base } from './helpers.js';

describe('external-package and authority boundary', () => {
  const reference = () =>
    base().records.find((r) => r.entityType === 'external-package-reference')!;

  it('verifies a supplied external identity, hash, version and inventory', () => {
    const ref = reference();
    const inventory = [{ recordId: 'x', recordVersion: '1.0.0' }];
    ref.inventoryDigest = { algorithm: 'sha256', value: inventoryDigest(inventory) };
    const supplied = {
      manifest: {
        packageId: ref.packageId as string,
        manifestVersion: ref.manifestVersion as string,
        ocrsVersion: ref.sourceProtocolVersion as string,
        contentHash: { algorithm: 'sha256', value: '' },
        inventory,
      },
    };
    const without = structuredClone(supplied) as any;
    delete without.manifest.contentHash;
    supplied.manifest.contentHash.value = sha256(canonicalize(without));
    ref.contentHash = supplied.manifest.contentHash;
    expect(verifyExternalPackage(ref, supplied)).toEqual([]);
  });

  it('rejects package substitution', () => {
    const ref = reference();
    const supplied = {
      manifest: {
        packageId: ref.packageId as string,
        manifestVersion: ref.manifestVersion as string,
        ocrsVersion: ref.sourceProtocolVersion as string,
        contentHash: { algorithm: 'sha256', value: 'a'.repeat(64) },
        inventory: [],
      },
    };
    expect(verifyExternalPackage(ref, supplied).map((d) => d.code)).toContain(
      'EXTERNAL_PACKAGE_HASH_MISMATCH',
    );
  });

  it('treats OCRS satisfied only as evidence input', () => {
    const ref = reference();
    expect(ref.sourceProtocolId).toBe('OCRS');
    expect(ref.qualifications).toContain('OCRS satisfied result is evidence input only.');
    expect(ref.entityType).not.toBe('outcome-authorization');
  });
});
