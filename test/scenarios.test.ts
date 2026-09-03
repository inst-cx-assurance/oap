import { describe, expect, it } from 'vitest';
import { validatePackage } from '../src/validator.js';
import { base, scenario } from './helpers.js';

const find = (pkg: ReturnType<typeof base>, type: string) =>
  pkg.records.find((r) => r.entityType === type);

describe('canonical Level 1 scenarios', () => {
  it('accepts Scenario A with explicit human acts', () => {
    const pkg = base();
    expect(validatePackage(pkg)).toEqual([]);
    expect(find(pkg, 'outcome-authorization')?.decision).toBe('authorized');
  });

  it('accepts Scenario B and does not infer authorization', () => {
    const pkg = scenario('scenario-b-evidence-insufficient.scenario.json');
    expect(validatePackage(pkg)).toEqual([]);
    expect(find(pkg, 'outcome-auditor-evaluation')?.conclusion).toBe('evidence_insufficient');
    expect(find(pkg, 'outcome-authorization')?.decision).toBe('withheld');
  });

  it('accepts conditional authorization only with a controlled condition', () => {
    const pkg = scenario('scenario-c-conditional-authorization.scenario.json');
    expect(validatePackage(pkg)).toEqual([]);
    expect(find(pkg, 'authorization-condition')?.status).toBe('open');
  });

  it('preserves the old basis when an evidence package changes', () => {
    const pkg = scenario('scenario-d-evidence-package-changed.scenario.json');
    expect(validatePackage(pkg)).toEqual([]);
    expect(pkg.records.filter((r) => r.entityType === 'external-package-reference')).toHaveLength(
      2,
    );
    expect(find(pkg, 'authorization-change')?.changeType).toBe('reassessment_required');
  });

  it('contains no software-made human authority record in valid scenarios', () => {
    for (const pkg of [
      base(),
      scenario('scenario-b-evidence-insufficient.scenario.json'),
      scenario('scenario-c-conditional-authorization.scenario.json'),
    ]) {
      const human = pkg.records.filter((r) =>
        [
          'outcome-auditor-evaluation',
          'outcome-director-determination',
          'residual-risk-acceptance',
          'outcome-authorization',
        ].includes(r.entityType),
      );
      expect(human.every((r) => r.generationMethod === 'human_supplied')).toBe(true);
    }
  });

  it('rejects Scenario E authority conflict', () => {
    const pkg = scenario('scenario-e-authority-conflict.expected-invalid.scenario.json');
    const codes = validatePackage(pkg).map((d) => d.code);
    expect(codes).toContain('AUDITOR_DIRECTOR_ROLE_CONFLICT');
    expect(codes).toContain('EXPIRED_APPOINTMENT');
    expect(codes).toContain('AUTHORITY_OUT_OF_SCOPE');
  });
});
