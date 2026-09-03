import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import {
  createExternalContract,
  missingExternalPackageDiagnostic,
  verifyExternalPackage,
} from '../src/external-verifier.js';
import { base, root } from './helpers.js';

describe('external OCRS evidence boundary', () => {
  const reference = () =>
    base().records.find((record) => record.entityType === 'external-package-reference')!;

  it('verifies every declared binding against supplied content', () => {
    const ref = reference();
    const supplied = createExternalContract(ref);
    expect(verifyExternalPackage(ref, supplied)).toEqual([]);
  });

  it.each([
    ['sourceProtocolId', 'OTHER', 'EXTERNAL_PROTOCOL_MISMATCH'],
    ['sourceProtocolVersion', '9.9.9', 'EXTERNAL_PROTOCOL_MISMATCH'],
    ['sourceProfileVersion', '9.9.9', 'EXTERNAL_PROFILE_MISMATCH'],
    ['packageId', 'ocrs:package:OTHER', 'EXTERNAL_PACKAGE_IDENTITY_MISMATCH'],
    ['packageSchemaVersion', '9.9.9', 'EXTERNAL_PACKAGE_VERSION_MISMATCH'],
    ['manifestVersion', '9.9.9', 'EXTERNAL_PACKAGE_VERSION_MISMATCH'],
    ['canonicalizationMethod', 'unknown', 'EXTERNAL_CANONICALIZATION_MISMATCH'],
    ['projectIdentifier', 'ocrs:project:OTHER', 'EXTERNAL_PROJECT_MISMATCH'],
    ['subjectIdentifiers', ['ocrs:system:OTHER'], 'EXTERNAL_SUBJECT_MISMATCH'],
    ['boundaryIdentifiers', ['ocrs:boundary:OTHER'], 'EXTERNAL_BOUNDARY_MISMATCH'],
    ['producingParty', 'ocrs:party:OTHER', 'EXTERNAL_PRODUCER_MISMATCH'],
    ['qualifications', ['falsified'], 'EXTERNAL_QUALIFICATION_MISMATCH'],
    ['exclusions', ['falsified'], 'EXTERNAL_EXCLUSION_MISMATCH'],
    ['createdAtSource', '2026-01-01T00:00:00Z', 'EXTERNAL_CREATION_TIME_MISMATCH'],
    ['supersessionStatus', 'superseded', 'EXTERNAL_SUPERSESSION_MISMATCH'],
    [
      'inventoryDigest',
      { algorithm: 'sha256', value: 'a'.repeat(64) },
      'EXTERNAL_INVENTORY_DIGEST_MISMATCH',
    ],
  ])('rejects falsified %s metadata', (field, value, code) => {
    const ref = reference();
    const supplied = createExternalContract(ref);
    ref[field] = value;
    expect(verifyExternalPackage(ref, supplied).map((diagnostic) => diagnostic.code)).toContain(
      code,
    );
  });

  it('rejects package substitution', () => {
    const ref = reference();
    const supplied = createExternalContract(ref);
    supplied.manifest.projectId = 'ocrs:project:SUBSTITUTED';
    expect(verifyExternalPackage(ref, supplied).map((diagnostic) => diagnostic.code)).toContain(
      'EXTERNAL_PACKAGE_HASH_MISMATCH',
    );
  });

  it('does not treat a claimed validation status as performed verification', () => {
    const ref = reference();
    ref.claimedValidationStatus = 'verified';
    expect(missingExternalPackageDiagnostic(ref.id).code).toBe('EXTERNAL_VALIDATION_NOT_PERFORMED');
  });

  it('fails the OCRS verification command when no package is supplied', () => {
    const result = spawnSync(process.execPath, ['--import', 'tsx', 'src/cli.ts', 'verify-ocrs'], {
      cwd: root,
      encoding: 'utf8',
    });
    expect(result.status).not.toBe(0);
    expect(`${result.stdout}${result.stderr}`).toContain('EXTERNAL_VALIDATION_NOT_PERFORMED');
  });

  it('treats OCRS records only as external evidence input', () => {
    const ref = reference();
    expect(ref.sourceProtocolId).toBe('OCRS');
    expect(ref.entityType).not.toBe('outcome-authorization');
  });
});
