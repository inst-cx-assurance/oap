import { createHash } from 'node:crypto';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { base, scenario, scenarioFile, root } from './helpers.js';
import { packageHash, canonicalize } from '../src/integrity.js';
import { createSchemaContext } from '../src/schema-context.js';
import { createExternalContract, verifyExternalPackage } from '../src/external-verifier.js';
import { validatePackage, compareVersion } from '../src/validator.js';
import type { OapPackage } from '../src/types.js';

// Regression coverage for validation diagnostics, history and evidence integrity.
const get = (p: OapPackage, type: string) => p.records.find((r) => r.entityType === type)!;
function seal(p: OapPackage) {
  p.manifest.inventory = p.records.map((r) => ({
    recordId: r.id,
    entityType: r.entityType,
    recordVersion: r.recordVersion,
    supersessionStatus: p.records.some((s) => s.supersedes === r.id) ? 'superseded' : 'current',
    ...(r.supersedes ? { supersedesRecordId: r.supersedes } : {}),
  }));
  p.manifest.contentHash.value = packageHash(p);
  return p;
}
const diags = (p: OapPackage) => validatePackage(seal(p));
const codes = (p: OapPackage) => diags(p).map((d) => d.code);
const ref = (p: OapPackage) => get(p, 'external-package-reference');
describe('Validation regression coverage', () => {
  it('R01: expose partial validation or independent semantic failures', () => {
    const p = base();
    get(p, 'party').name = 42;
    get(p, 'outcome-authorization').determinationId = 'oap:missing:determination';
    expect(
      diags(p).some(
        (x) => /partial|not.performed/i.test(x.message) || x.code === 'BROKEN_REFERENCE',
      ),
    ).toBe(true);
  });
  it('R02: schema gates the semantic version guard', () => {
    const p = base();
    p.schemaVersion = '9.9.9';
    seal(p);
    const c = createSchemaContext();
    expect(c.validate(p)).toBe(false);
    expect(validatePackage(p).some((d) => d.message.startsWith('Unsupported schema version'))).toBe(
      false,
    );
    expect(
      validatePackage(p, { ...c, validate: (() => true) as unknown as typeof c.validate }).some(
        (d) => d.message.startsWith('Unsupported schema version'),
      ),
    ).toBe(true);
  });
  it('R03: stale-only permits evidence_insufficient without contradictory evaluators', () => {
    const p = base();
    get(p, 'evidence-sufficiency-assessment').currency = 'stale';
    get(p, 'outcome-auditor-evaluation').conclusion = 'evidence_insufficient';
    expect(codes(p)).not.toContain('AUDITOR_CONCLUSION_CONTRADICTION');
  });
  it('R04: unresolved appointments do not create separation conflicts', () => {
    const p = base();
    p.records = p.records.filter(
      (r) =>
        !(
          r.entityType === 'role-assignment' &&
          ['evidence_submitter', 'outcome_auditor'].includes(String(r.role))
        ),
    );
    const c = codes(p);
    expect(c).toContain('BROKEN_REFERENCE');
    expect(c).not.toContain('EVIDENCE_EVALUATION_ROLE_CONFLICT');
  });
  it('R05: unused withdrawn delegation can remain as history', () => {
    const p = scenarioFile(
      path.join(root, 'conformance/valid/delegated-director-narrow-scope.scenario.json'),
    );
    for (const r of p.records)
      if (r.directorRoleAssignmentId === 'oap:role-assignment:delegate-director')
        r.directorRoleAssignmentId = 'oap:role-assignment:director';
    get(p, 'delegation').status = 'withdrawn';
    get(p, 'delegation').validTo = '2026-08-15T00:00:00Z';
    expect(codes(p)).not.toContain('INVALID_DELEGATION');
  });
  it('R06: detect duplicate authorizations independent of boundary order', () => {
    const p = base(),
      b = get(p, 'authorization-boundary');
    p.records.push({ ...structuredClone(b), id: 'oap:authorization-boundary:SECOND' });
    for (const r of p.records) {
      if (Array.isArray(r.boundaryIds))
        r.boundaryIds = [...r.boundaryIds, 'oap:authorization-boundary:SECOND'];
      if (Array.isArray(r.authorizationBoundaryIds))
        r.authorizationBoundaryIds = [
          ...r.authorizationBoundaryIds,
          'oap:authorization-boundary:SECOND',
        ];
    }
    p.manifest.authorizationBoundaryIds.push('oap:authorization-boundary:SECOND');
    const a = get(p, 'outcome-authorization');
    p.records.push({
      ...structuredClone(a),
      id: 'oap:outcome-authorization:SECOND',
      boundaryIds: [...(a.boundaryIds as string[])].reverse(),
    });
    expect(codes(p)).toContain('SILENT_DECISION_OVERWRITE');
  });
  it('R07: prereleases precede releases and numeric identifiers compare numerically', () => {
    expect(compareVersion('1.0.0-rc.1', '1.0.0')).toBeLessThan(0);
    expect(compareVersion('1.0.0-rc.2', '1.0.0-rc.10')).toBeLessThan(0);
  });
  it('R08: equal timestamp successors are rejected', () => {
    const p = base(),
      r = get(p, 'party');
    p.records.push({
      ...structuredClone(r),
      id: 'oap:party:successor',
      recordVersion: '1.1.0',
      supersedes: r.id,
    });
    expect(
      diags(p).some(
        (d) => d.code === 'SUPERSESSION_VERSION_INVALID' && d.path.endsWith('/createdAt'),
      ),
    ).toBe(true);
  });
  it('R09: union-bound evidence fails per-boundary equality', () => {
    const p = base(),
      b = get(p, 'authorization-boundary');
    p.records.push({
      ...structuredClone(b),
      id: 'oap:authorization-boundary:SECOND',
      subjectIds: ['ocrs:system:SECOND'],
      externalBoundaryIds: ['ocrs:boundary:SECOND'],
    });
    get(p, 'evidence-submission').boundaryIds = [b.id, 'oap:authorization-boundary:SECOND'];
    ref(p).subjectIdentifiers = [...(ref(p).subjectIdentifiers as string[]), 'ocrs:system:SECOND'];
    ref(p).boundaryIdentifiers = [
      ...(ref(p).boundaryIdentifiers as string[]),
      'ocrs:boundary:SECOND',
    ];
    const c = codes(p);
    expect(c).toContain('EXTERNAL_SUBJECT_MISMATCH');
    expect(c).toContain('EXTERNAL_BOUNDARY_MISMATCH');
  });
  it('R10: external subset passes while boundary equality fails', () => {
    const p = base(),
      r = ref(p),
      s = createExternalContract(r),
      b = get(p, 'authorization-boundary');
    b.subjectIds = [...(b.subjectIds as string[]), 'ocrs:system:SECOND'];
    expect(verifyExternalPackage(r, s)).toEqual([]);
    expect(codes(p)).toContain('EXTERNAL_SUBJECT_MISMATCH');
  });
  it.each(['contentHash', 'inventoryDigest'])(
    'R11: reject SHA512 declarations with SHA256 digest lengths in %s',
    (field) => {
      const p = base(),
        r = ref(p),
        s = createExternalContract(r);
      (r[field] as { algorithm: string }).algorithm = 'sha512';
      if (field === 'contentHash') s.manifest.contentHash!.algorithm = 'sha512';
      expect(verifyExternalPackage(r, s).length).toBeGreaterThan(0);
    },
  );
  it('R12: human reassessment requires withdrawal permission', () => {
    const p = scenarioFile(
      path.join(root, 'conformance/valid/authorization-withdrawn.scenario.json'),
    );
    get(p, 'authorization-change').changeType = 'reassessment_required';
    expect(codes(p)).not.toContain('AUTHORIZATION_CHANGE_UNAUTHORIZED');
    const s = p.records.find((r) => r.id === 'oap:authority-scope:director')!;
    s.permittedActions = (s.permittedActions as string[]).filter(
      (a) => a !== 'withdraw_authorization',
    );
    expect(codes(p)).toContain('AUTHORITY_OUT_OF_SCOPE');
  });
  it('R13: missing submitter conflict declaration is rejected', () => {
    const p = base();
    p.records = p.records.filter((r) => r.id !== 'oap:conflict:submitter');
    expect(codes(p)).toContain('UNRESOLVED_CONFLICT_OF_INTEREST');
  });
  it('R14: acceptance chronology is independent of record order', () => {
    const p = base(),
      d = get(p, 'outcome-director-determination'),
      later = {
        ...structuredClone(d),
        id: 'oap:director-determination:LATER',
        createdAt: '2026-09-03T12:00:00Z',
        determinedAt: '2026-09-03T12:00:00Z',
      };
    p.records.push(later);
    const a = get(p, 'residual-risk-acceptance');
    const errors = (q: OapPackage) => diags(q).filter((x) => x.path.startsWith('/' + a.id));
    const before = errors(p);
    p.records = [later, ...p.records.filter((r) => r !== later)];
    expect(errors(p)).toEqual(before);
  });
  it('R15: diagnostics select the condition entityType branch', () => {
    const p = scenario('scenario-c-conditional-authorization.scenario.json'),
      c = get(p, 'authorization-condition');
    delete c.ownerRoleAssignmentId;
    const d = diags(p).filter((x) => x.path === '/records/' + p.records.indexOf(c));
    expect(d.length).toBeLessThan(10);
    expect(
      d.some((x) => /partyType|submittedAt|assessmentIds|directorRoleAssignmentId/.test(x.message)),
    ).toBe(false);
  });
  it('R16: superseded evaluation retains its historical assessments', () => {
    const p = base(),
      a = get(p, 'evidence-sufficiency-assessment'),
      e = get(p, 'outcome-auditor-evaluation');
    const nextA = {
      ...structuredClone(a),
      id: 'oap:sufficiency-assessment:SECOND',
      supersedes: a.id,
      recordVersion: '1.1.0',
      createdAt: '2026-09-02T11:16:00Z',
      assessedAt: '2026-09-02T11:16:00Z',
    };
    const nextE = {
      ...structuredClone(e),
      id: 'oap:auditor-evaluation:SECOND',
      supersedes: e.id,
      recordVersion: '1.1.0',
      createdAt: '2026-09-02T11:17:00Z',
      evaluatedAt: '2026-09-02T11:17:00Z',
      assessmentIds: [nextA.id],
      evidenceBasisIds: [ref(p).id, nextA.id],
    };
    p.records.push(nextA, nextE);
    expect(
      diags(p).filter(
        (d) =>
          d.path.startsWith('/' + e.id) &&
          [
            'INCOMPLETE_ASSESSMENT_COVERAGE',
            'EVALUATION_BASIS_MISMATCH',
            'AUDITOR_CONCLUSION_CONTRADICTION',
          ].includes(d.code),
      ),
    ).toEqual([]);
  });
  it('R20: closing last condition triggers open-condition contradiction', () => {
    const p = scenario('scenario-c-conditional-authorization.scenario.json'),
      c = get(p, 'authorization-condition');
    c.status = 'verified_closed';
    c.closureEvidencePackageReferenceIds = [ref(p).id];
    expect(codes(p)).toContain('CONDITION_STATUS_CONTRADICTION');
  });
  it('R11: honor schema-valid SHA512 content and inventory digests', () => {
    const p = base(),
      r = ref(p),
      s = createExternalContract(r);
    const copy = structuredClone(s);
    delete copy.manifest.contentHash;
    const hash = {
      algorithm: 'sha512',
      value: createHash('sha512').update(canonicalize(copy)).digest('hex'),
    };
    r.contentHash = hash;
    s.manifest.contentHash = hash;
    r.inventoryDigest = {
      algorithm: 'sha512',
      value: createHash('sha512').update(canonicalize(s.manifest.inventory)).digest('hex'),
    };
    seal(p);
    expect(createSchemaContext().validate(p)).toBe(true);
    expect(verifyExternalPackage(r, s)).toEqual([]);
  });
});
