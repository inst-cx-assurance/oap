import { describe, expect, it } from 'vitest';
import { packageHash } from '../src/integrity.js';
import { validatePackage } from '../src/validator.js';
import { base } from './helpers.js';

describe('Holdpoint #4: missing role assignments', () => {
  it('does not invent a submitter/auditor conflict when neither role resolves', () => {
    const pkg = base();
    const submission = pkg.records.find((r) => r.entityType === 'evidence-package-submission')!;
    const evaluation = pkg.records.find((r) => r.entityType === 'outcome-auditor-evaluation')!;
    submission.submittedByRoleAssignmentId = 'oap:role-assignment:absent-submitter';
    evaluation.auditorRoleAssignmentId = 'oap:role-assignment:absent-auditor';
    pkg.manifest.contentHash.value = packageHash(pkg);
    const codes = validatePackage(pkg).map((diagnostic) => diagnostic.code);
    expect(codes).not.toContain('EVIDENCE_EVALUATION_ROLE_CONFLICT');
  });
});
