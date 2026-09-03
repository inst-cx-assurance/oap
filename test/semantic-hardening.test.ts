import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createExternalContract, verifyExternalPackage } from '../src/external-verifier.js';
import { materializeInvalidFixture, mutate, type InvalidFixture } from '../src/fixtures.js';
import { loadJson } from '../src/io.js';
import { classifyAuthorizationEffectiveness, validatePackage } from '../src/validator.js';
import { base, root, scenarioFile } from './helpers.js';

function codesForFixture(name: string): string[] {
  const fixture = loadJson<InvalidFixture>(
    path.join(root, 'conformance', 'invalid', `${name}.fixture.json`),
  );
  const source = base();
  if (fixture.validationMode === 'external-ocrs-contract') {
    const original = source.records.find(
      (record) => record.entityType === 'external-package-reference',
    )!;
    const supplied = createExternalContract(original);
    const reference = mutate(source, fixture.mutations).records.find(
      (record) => record.entityType === 'external-package-reference',
    )!;
    return verifyExternalPackage(reference, supplied).map((diagnostic) => diagnostic.code);
  }
  return validatePackage(materializeInvalidFixture(source, fixture)).map(
    (diagnostic) => diagnostic.code,
  );
}

describe('OAP v0.1 semantic hardening', () => {
  it('enforces every causal chronology edge with rehashed semantic fixtures', () => {
    for (const fixture of [
      'assessment-before-submission',
      'evaluation-before-assessment',
      'determination-before-evaluation',
      'determination-before-risk-declaration',
      'acceptance-before-determination',
      'authorization-before-risk-acceptance',
    ]) {
      const codes = codesForFixture(fixture);
      expect(codes).toContain('INVALID_CHRONOLOGY');
      expect(codes).not.toContain('INVALID_CONTENT_HASH');
    }
  });

  it('requires unique risk identifiers within each declaration', () => {
    const codes = codesForFixture('duplicate-risk-id');
    expect(codes).toContain('DUPLICATE_RISK_ID');
    expect(codes).not.toContain('INVALID_CONTENT_HASH');
  });

  it('rejects a false OEN-before-generation assertion', () => {
    expect(codesForFixture('oen-sequence-invalid')).toContain('OEN_SEQUENCE_INVALID');
  });

  it('accepts complete multi-criterion coverage and rejects an omitted material criterion', () => {
    const valid = scenarioFile(
      path.join(root, 'conformance', 'valid', 'multi-criterion-assessment.scenario.json'),
    );
    expect(validatePackage(valid)).toEqual([]);
    expect(codesForFixture('unassessed-material-criterion')).toContain(
      'INCOMPLETE_ASSESSMENT_COVERAGE',
    );
  });

  it('makes zero assessments indeterminate and never sufficient', () => {
    expect(codesForFixture('zero-assessments-sufficient')).toContain(
      'INCOMPLETE_ASSESSMENT_COVERAGE',
    );
  });

  it('requires every assessment to use packages from its submission', () => {
    expect(codesForFixture('assessment-without-external-evidence')).toContain(
      'ASSESSMENT_EVIDENCE_MISMATCH',
    );
  });

  it('requires nonempty evidence bases for every human decision stage', () => {
    for (const fixture of [
      'empty-evaluation-evidence-basis',
      'empty-determination-evidence-basis',
      'empty-authorization-evidence-basis',
    ])
      expect(codesForFixture(fixture)).toContain('EMPTY_EVIDENCE_BASIS');
  });

  it('enforces the exact evaluation and acceptance chain', () => {
    expect(codesForFixture('authorization-evaluation-mismatch')).toContain(
      'AUTHORIZATION_EVALUATION_MISMATCH',
    );
    expect(codesForFixture('authorization-acceptance-mismatch')).toContain(
      'AUTHORIZATION_ACCEPTANCE_MISMATCH',
    );
    expect(codesForFixture('evaluation-basis-mismatch')).toContain('EVALUATION_BASIS_MISMATCH');
  });

  it('rejects residual-risk context substitution and a missing nested owner', () => {
    expect(codesForFixture('residual-risk-context-mismatch')).toContain('RISK_CONTEXT_MISMATCH');
    expect(codesForFixture('risk-declaration-chain-mismatch')).toContain(
      'RISK_DECLARATION_MISMATCH',
    );
    expect(codesForFixture('residual-risk-owner-missing')).toContain('RISK_OWNER_INVALID');
  });

  it('enforces condition context and reciprocal authorization links', () => {
    expect(codesForFixture('condition-context-mismatch')).toContain('CONDITION_CONTEXT_MISMATCH');
    expect(codesForFixture('condition-context-and-backlink-mismatch')).toContain(
      'CONDITION_AUTHORIZATION_LINK_MISMATCH',
    );
  });

  it('authority-checks human lifecycle changes and distinguishes deterministic expiry', () => {
    expect(codesForFixture('authorization-change-unauthorized-and-predated')).toEqual(
      expect.arrayContaining([
        'AUTHORIZATION_CHANGE_UNAUTHORIZED',
        'AUTHORIZATION_CHANGE_CHRONOLOGY_INVALID',
      ]),
    );
    expect(codesForFixture('authorization-expiry-before-valid-to')).toContain(
      'AUTHORIZATION_LIFECYCLE_CONTRADICTION',
    );
    const lifecycle = scenarioFile(
      path.join(root, 'examples', 'canonical', 'scenario-d-evidence-package-changed.scenario.json'),
    );
    expect(validatePackage(lifecycle)).toEqual([]);
    expect(
      lifecycle.records.find((record) => record.entityType === 'authorization-change'),
    ).toMatchObject({ actorType: 'human_authority', generationMethod: 'human_supplied' });
    const expiry = scenarioFile(
      path.join(root, 'conformance', 'valid', 'deterministic-expiry.scenario.json'),
    );
    expect(validatePackage(expiry)).toEqual([]);
    expect(
      expiry.records.find((record) => record.entityType === 'authorization-change'),
    ).toMatchObject({ actorType: 'system_detection', generationMethod: 'system_capture' });
  });

  it('accepts narrow delegation and rejects scope, action, link, validity, and cycle defects', () => {
    const delegated = scenarioFile(
      path.join(root, 'conformance', 'valid', 'delegated-director-narrow-scope.scenario.json'),
    );
    expect(validatePackage(delegated)).toEqual([]);
    expect(codesForFixture('delegation-action-expansion')).toContain('DELEGATION_ACTION_EXPANSION');
    expect(codesForFixture('delegation-scope-expansion')).toContain('DELEGATION_SCOPE_EXPANSION');
    expect(codesForFixture('delegation-link-mismatch')).toContain('DELEGATION_LINK_MISMATCH');
    expect(codesForFixture('delegation-validity-invalid')).toContain('DELEGATION_VALIDITY_INVALID');
    expect(codesForFixture('delegation-cycle')).toContain('DELEGATION_CYCLE');
    expect(codesForFixture('delegated-action-outside-delegation-scope')).toContain(
      'AUTHORITY_OUT_OF_SCOPE',
    );
  });

  it('requires one Director assignment for withheld and deferred as well as positive chains', () => {
    expect(codesForFixture('negative-chain-director-mismatch')).toContain(
      'DIRECTOR_ACTS_NOT_COHERENT',
    );
  });

  it('keeps historical record currency separate from withdrawal and revocation effectiveness', () => {
    for (const [file, expected] of [
      ['authorization-withdrawn.scenario.json', 'ineffective_withdrawn'],
      ['authorization-revoked.scenario.json', 'ineffective_revoked'],
    ] as const) {
      const pkg = scenarioFile(path.join(root, 'conformance', 'valid', file));
      expect(validatePackage(pkg)).toEqual([]);
      const authorization = pkg.records.find(
        (record) => record.entityType === 'outcome-authorization',
      )!;
      expect(
        pkg.manifest.inventory.find((entry) => entry.recordId === authorization.id)
          ?.supersessionStatus,
      ).toBe('current');
      expect(
        classifyAuthorizationEffectiveness(pkg, authorization.id, '2026-09-04T00:00:00Z'),
      ).toBe(expected);
    }
  });

  it('rejects out-of-context condition closure evidence', () => {
    const codes = codesForFixture('condition-closure-evidence-context-mismatch');
    expect(codes).toContain('CONDITION_CLOSURE_EVIDENCE_MISMATCH');
    expect(codes).not.toContain('INVALID_CONTENT_HASH');
  });

  it('prohibits a human assignment on system-detected lifecycle events', () => {
    expect(codesForFixture('system-detection-with-human-actor')).toContain(
      'AUTHORIZATION_CHANGE_UNAUTHORIZED',
    );
  });

  it('accepts a timely mitigated declaration and rejects retroactive conflict clearance', () => {
    const mitigated = scenarioFile(
      path.join(root, 'conformance', 'valid', 'timely-mitigated-conflict.scenario.json'),
    );
    expect(validatePackage(mitigated)).toEqual([]);
    expect(codesForFixture('conflict-declaration-after-action')).toContain(
      'CONFLICT_DECLARATION_INVALID_AT_ACTION_TIME',
    );
    expect(codesForFixture('conflict-mitigation-missing')).toContain(
      'CONFLICT_MITIGATION_REQUIRED',
    );
    expect(codesForFixture('conflict-declaration-superseded')).toContain(
      'CONFLICT_DECLARATION_SUPERSEDED',
    );
  });

  it('detects supersession cycles and manifest/profile disagreement', () => {
    expect(codesForFixture('supersession-cycle')).toContain('SUPERSESSION_CYCLE');
    expect(codesForFixture('supersession-version-invalid')).toContain(
      'SUPERSESSION_VERSION_INVALID',
    );
    expect(codesForFixture('multiple-current-successors')).toContain('MULTIPLE_CURRENT_SUCCESSORS');
    expect(codesForFixture('manifest-profile-declaration-mismatch')).toContain(
      'PROFILE_DECLARATION_MISMATCH',
    );
    expect(codesForFixture('profile-status-invalid')).toContain('PROFILE_STATUS_INVALID');
    expect(codesForFixture('required-profile-missing')).toContain('REQUIRED_PROFILE_MISSING');
  });

  it('verifies every external metadata binding and authorization-boundary mapping', () => {
    for (const [fixture, code] of [
      ['external-profile-mismatch', 'EXTERNAL_PROFILE_MISMATCH'],
      ['external-project-mismatch', 'EXTERNAL_PROJECT_MISMATCH'],
      ['external-subject-mismatch', 'EXTERNAL_SUBJECT_MISMATCH'],
      ['external-boundary-mismatch', 'EXTERNAL_BOUNDARY_MISMATCH'],
      ['external-producer-mismatch', 'EXTERNAL_PRODUCER_MISMATCH'],
      ['external-qualification-mismatch', 'EXTERNAL_QUALIFICATION_MISMATCH'],
      ['external-exclusion-mismatch', 'EXTERNAL_EXCLUSION_MISMATCH'],
    ])
      expect(codesForFixture(fixture)).toContain(code);

    const pkg = base();
    const boundary = pkg.records.find((record) => record.entityType === 'authorization-boundary')!;
    boundary.externalBoundaryIds = ['ocrs:boundary:UNRELATED'];
    expect(validatePackage(pkg).map((diagnostic) => diagnostic.code)).toContain(
      'EXTERNAL_BOUNDARY_MISMATCH',
    );
  });
});
