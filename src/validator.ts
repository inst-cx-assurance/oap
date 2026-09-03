import { type ErrorObject } from 'ajv';
import { packageHash } from './integrity.js';
import { createSchemaContext, type SchemaContext } from './schema-context.js';
import { type Diagnostic, type OapPackage, type OapRecord } from './types.js';

const SUPPORTED_PROFILES = new Map([
  ['oap:profile:core', '0.1.0'],
  ['oap:profile:ocrs-input', '0.1.0'],
  ['oap:profile:icxa-provisional', '0.1.0'],
]);

let cached: SchemaContext | undefined;

export function validatePackage(input: unknown, context?: SchemaContext): Diagnostic[] {
  context ??= cached ?? (cached = createSchemaContext());
  if (!context.validate(input)) return (context.errors() ?? []).map(schemaDiagnostic);
  const pkg = input as OapPackage;
  const diagnostics: Diagnostic[] = [];
  const byId = new Map<string, OapRecord>();

  if (pkg.schemaVersion !== '0.1.0')
    add(
      diagnostics,
      'UNSUPPORTED_SCHEMA_VERSION',
      '/schemaVersion',
      `Unsupported schema version ${pkg.schemaVersion}.`,
    );
  for (const [i, profile] of pkg.manifest.profiles.entries()) {
    if (SUPPORTED_PROFILES.get(profile.profileId) !== profile.profileVersion)
      add(
        diagnostics,
        'UNSUPPORTED_PROFILE_VERSION',
        `/manifest/profiles/${i}`,
        `Unsupported profile ${profile.profileId}@${profile.profileVersion}.`,
      );
  }

  for (const [i, record] of pkg.records.entries()) {
    if (byId.has(record.id))
      add(
        diagnostics,
        'DUPLICATE_IDENTIFIER',
        `/records/${i}/id`,
        `Duplicate identifier ${record.id}.`,
        [record.id],
      );
    else byId.set(record.id, record);
  }

  const ref = (source: OapRecord | { id: string }, field: string, id: unknown, types: string[]) => {
    if (typeof id !== 'string') return;
    const target = byId.get(id);
    if (!target)
      add(diagnostics, 'BROKEN_REFERENCE', `/${source.id}/${field}`, `${id} does not exist.`, [
        source.id,
      ]);
    else if (!types.includes(target.entityType))
      add(
        diagnostics,
        'WRONG_ENTITY_TYPE_REFERENCE',
        `/${source.id}/${field}`,
        `${field} requires ${types.join('|')}; ${id} is ${target.entityType}.`,
        [source.id, id],
      );
  };
  const refs = (r: OapRecord, field: string, types: string[]) => {
    const value = r[field];
    for (const id of Array.isArray(value) ? value : value === undefined ? [] : [value])
      ref(r, field, id, types);
  };

  ref({ id: 'manifest' }, 'producedByPartyId', pkg.manifest.producedByPartyId, ['party']);
  ref({ id: 'manifest' }, 'projectId', pkg.manifest.projectId, ['project-context']);
  for (const id of pkg.manifest.outcomeIds) ref({ id: 'manifest' }, 'outcomeIds', id, ['outcome']);
  for (const id of pkg.manifest.authorizationBoundaryIds)
    ref({ id: 'manifest' }, 'authorizationBoundaryIds', id, ['authorization-boundary']);
  for (const p of pkg.manifest.profiles)
    ref({ id: 'manifest' }, 'profiles', p.profileId, ['profile-declaration']);

  const referenceMap: Record<string, Array<[string, string[]]>> = {
    party: [['organizationId', ['party']]],
    'human-identity-reference': [['partyId', ['party']]],
    'authority-scope': [
      ['projectIds', ['project-context']],
      ['outcomeIds', ['outcome']],
      ['boundaryIds', ['authorization-boundary']],
    ],
    'role-assignment': [
      ['partyId', ['party']],
      ['authorityScopeId', ['authority-scope']],
      ['delegationId', ['delegation']],
    ],
    delegation: [
      ['delegatorRoleAssignmentId', ['role-assignment']],
      ['delegateRoleAssignmentId', ['role-assignment']],
      ['authorityScopeId', ['authority-scope']],
    ],
    'conflict-of-interest-declaration': [['roleAssignmentId', ['role-assignment']]],
    outcome: [
      ['projectId', ['project-context']],
      ['outcomeObligationId', ['outcome-obligation']],
      ['requirementIds', ['outcome-requirement']],
      ['criterionIds', ['outcome-criterion']],
      ['evidenceNeedId', ['outcome-evidence-need']],
      ['authorizationBoundaryIds', ['authorization-boundary']],
    ],
    'outcome-obligation': [
      ['projectId', ['project-context']],
      ['requirementIds', ['outcome-requirement']],
    ],
    'outcome-requirement': [
      ['obligationId', ['outcome-obligation']],
      ['outcomeId', ['outcome']],
      ['criterionIds', ['outcome-criterion']],
    ],
    'outcome-criterion': [['outcomeId', ['outcome']]],
    'outcome-evidence-need': [
      ['outcomeId', ['outcome']],
      ['boundaryIds', ['authorization-boundary']],
      ['requirementIds', ['outcome-requirement']],
      ['criterionIds', ['outcome-criterion']],
    ],
    'authorization-boundary': [
      ['projectId', ['project-context']],
      ['outcomeId', ['outcome']],
    ],
    'external-package-reference': [
      ['supersededByPackageReferenceId', ['external-package-reference']],
    ],
    'evidence-submission': [
      ['projectId', ['project-context']],
      ['outcomeId', ['outcome']],
      ['boundaryIds', ['authorization-boundary']],
      ['externalPackageReferenceIds', ['external-package-reference']],
      ['criterionIds', ['outcome-criterion']],
      ['submittedByRoleAssignmentId', ['role-assignment']],
    ],
    'evidence-sufficiency-assessment': [
      ['projectId', ['project-context']],
      ['outcomeId', ['outcome']],
      ['boundaryIds', ['authorization-boundary']],
      ['submissionId', ['evidence-submission']],
      ['criterionId', ['outcome-criterion']],
      ['auditorRoleAssignmentId', ['role-assignment']],
      ['evidencePackageReferenceIds', ['external-package-reference']],
    ],
    'outcome-auditor-evaluation': [
      ['projectId', ['project-context']],
      ['outcomeId', ['outcome']],
      ['boundaryIds', ['authorization-boundary']],
      ['submissionId', ['evidence-submission']],
      ['assessmentIds', ['evidence-sufficiency-assessment']],
      ['auditorRoleAssignmentId', ['role-assignment']],
      [
        'evidenceBasisIds',
        ['external-package-reference', 'evidence-submission', 'evidence-sufficiency-assessment'],
      ],
    ],
    'outcome-director-determination': [
      ['projectId', ['project-context']],
      ['outcomeId', ['outcome']],
      ['boundaryIds', ['authorization-boundary']],
      ['auditorEvaluationId', ['outcome-auditor-evaluation']],
      ['directorRoleAssignmentId', ['role-assignment']],
      [
        'evidenceBasisIds',
        ['external-package-reference', 'evidence-submission', 'outcome-auditor-evaluation'],
      ],
      ['residualRiskDeclarationId', ['residual-risk-declaration']],
    ],
    'residual-risk-declaration': [
      ['projectId', ['project-context']],
      ['outcomeId', ['outcome']],
      ['boundaryIds', ['authorization-boundary']],
      ['submissionId', ['evidence-submission']],
      ['declaredByRoleAssignmentId', ['role-assignment']],
    ],
    'residual-risk-acceptance': [
      ['projectId', ['project-context']],
      ['outcomeId', ['outcome']],
      ['boundaryIds', ['authorization-boundary']],
      ['declarationId', ['residual-risk-declaration']],
      ['directorRoleAssignmentId', ['role-assignment']],
    ],
    'authorization-condition': [
      ['projectId', ['project-context']],
      ['outcomeId', ['outcome']],
      ['boundaryIds', ['authorization-boundary']],
      ['ownerRoleAssignmentId', ['role-assignment']],
      [
        'sourceRecordIds',
        ['outcome-authorization', 'outcome-director-determination', 'residual-risk-declaration'],
      ],
      ['authorizationId', ['outcome-authorization']],
      ['closureEvidencePackageReferenceIds', ['external-package-reference']],
    ],
    'outcome-authorization': [
      ['projectId', ['project-context']],
      ['outcomeId', ['outcome']],
      ['boundaryIds', ['authorization-boundary']],
      ['determinationId', ['outcome-director-determination']],
      ['auditorEvaluationId', ['outcome-auditor-evaluation']],
      ['residualRiskAcceptanceId', ['residual-risk-acceptance']],
      ['directorRoleAssignmentId', ['role-assignment']],
      [
        'evidenceBasisIds',
        [
          'external-package-reference',
          'evidence-submission',
          'outcome-auditor-evaluation',
          'outcome-director-determination',
          'residual-risk-declaration',
          'residual-risk-acceptance',
        ],
      ],
      ['conditionIds', ['authorization-condition']],
    ],
    'authorization-change': [
      ['authorizationId', ['outcome-authorization']],
      ['changedByRoleAssignmentId', ['role-assignment']],
      ['replacementAuthorizationId', ['outcome-authorization']],
    ],
    'controlled-explanation': [
      ['subjectRecordId', pkg.records.map((x) => x.entityType)],
      ['supportingRecordIds', pkg.records.map((x) => x.entityType)],
    ],
    'change-record': [
      ['changedRecordId', pkg.records.map((x) => x.entityType)],
      ['priorRecordId', pkg.records.map((x) => x.entityType)],
      ['changedByPartyId', ['party']],
    ],
  };
  for (const record of pkg.records)
    for (const [field, types] of referenceMap[record.entityType] ?? []) refs(record, field, types);

  validateInventory(pkg, diagnostics);
  if (packageHash(pkg) !== pkg.manifest.contentHash.value)
    add(
      diagnostics,
      'INVALID_CONTENT_HASH',
      '/manifest/contentHash',
      'Package content hash does not match canonical package content.',
    );

  const records = (type: string) => pkg.records.filter((r) => r.entityType === type);
  const get = (id: unknown) => (typeof id === 'string' ? byId.get(id) : undefined);
  const ids = (v: unknown) =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
  const sameContext = (a: OapRecord, b?: OapRecord) =>
    !!b &&
    a.projectId === b.projectId &&
    a.outcomeId === b.outcomeId &&
    sameSet(ids(a.boundaryIds), ids(b.boundaryIds));

  for (const external of records('external-package-reference')) {
    const currentlyReliedUpon = records('evidence-submission').some(
      (s) => s.status !== 'superseded' && ids(s.externalPackageReferenceIds).includes(external.id),
    );
    if (
      external.validationStatus !== 'verified' ||
      (currentlyReliedUpon && external.supersessionStatus !== 'current')
    )
      add(
        diagnostics,
        'UNBOUND_EXTERNAL_EVIDENCE',
        `/${external.id}`,
        'Relied-upon external evidence must be digest-bound, verified, and current.',
        [external.id],
      );
    const retrieval = String(external.retrievalReference);
    if (retrieval.includes('..') || retrieval.startsWith('file:'))
      add(
        diagnostics,
        'UNSAFE_EXTERNAL_REFERENCE',
        `/${external.id}/retrievalReference`,
        'Unsafe external reference.',
        [external.id],
      );
    if (external.validationStatus === 'failed')
      add(
        diagnostics,
        'EXTERNAL_PACKAGE_HASH_MISMATCH',
        `/${external.id}/validationStatus`,
        'External package verification failed.',
        [external.id],
      );
  }

  for (const delegation of records('delegation')) {
    const delegator = get(delegation.delegatorRoleAssignmentId);
    const delegate = get(delegation.delegateRoleAssignmentId);
    if (
      !delegator ||
      !delegate ||
      delegator.role !== delegate.role ||
      delegation.status !== 'active'
    )
      add(
        diagnostics,
        'INVALID_DELEGATION',
        `/${delegation.id}`,
        'Delegation is invalid, inactive, or changes the assigned role.',
        [delegation.id],
      );
  }

  for (const submission of records('evidence-submission')) {
    checkRole(
      submission,
      'submittedByRoleAssignmentId',
      'evidence_submitter',
      'submit_evidence',
      'submittedAt',
      byId,
      diagnostics,
    );
    for (const id of ids(submission.externalPackageReferenceIds))
      if (submission.status !== 'superseded' && get(id)?.supersessionStatus === 'superseded')
        add(
          diagnostics,
          'SUPERSEDED_EVIDENCE_USED',
          `/${submission.id}/externalPackageReferenceIds`,
          'A superseded evidence package is used as current.',
          [submission.id, id],
        );
  }

  for (const assessment of records('evidence-sufficiency-assessment')) {
    checkRole(
      assessment,
      'auditorRoleAssignmentId',
      'outcome_auditor',
      'evaluate_evidence',
      'assessedAt',
      byId,
      diagnostics,
    );
    const submission = get(assessment.submissionId);
    if (submission && !ids(submission.criterionIds).includes(String(assessment.criterionId)))
      add(
        diagnostics,
        'EVALUATION_SUBMISSION_MISMATCH',
        `/${assessment.id}`,
        'Assessment criterion is outside its submission.',
        [assessment.id, submission.id],
      );
  }

  for (const evaluation of records('outcome-auditor-evaluation')) {
    checkHumanRecord(evaluation, diagnostics);
    checkRole(
      evaluation,
      'auditorRoleAssignmentId',
      'outcome_auditor',
      'evaluate_evidence',
      'evaluatedAt',
      byId,
      diagnostics,
    );
    const submission = get(evaluation.submissionId);
    if (!sameContext(evaluation, submission))
      add(
        diagnostics,
        'OUTCOME_BOUNDARY_MISMATCH',
        `/${evaluation.id}`,
        'Evaluation and submission contexts differ.',
        [evaluation.id, ...(submission ? [submission.id] : [])],
      );
    const assessments = ids(evaluation.assessmentIds).map(get).filter(Boolean) as OapRecord[];
    if (assessments.some((a) => a.submissionId !== evaluation.submissionId))
      add(
        diagnostics,
        'EVALUATION_SUBMISSION_MISMATCH',
        `/${evaluation.id}/assessmentIds`,
        'Evaluation includes an assessment for another submission.',
        [evaluation.id],
      );
    const computed = assessments.every(
      (a) =>
        a.sufficiency === 'sufficient' &&
        a.admissibility === 'admissible' &&
        a.credibility === 'credible' &&
        a.relevance === 'relevant' &&
        a.currency === 'current',
    )
      ? 'evidence_sufficient'
      : assessments.some(
            (a) =>
              a.sufficiency === 'insufficient' ||
              a.admissibility === 'inadmissible' ||
              a.credibility === 'not_credible' ||
              a.relevance === 'not_relevant',
          )
        ? 'evidence_insufficient'
        : 'indeterminate';
    if (assessments.length !== 0 && evaluation.conclusion !== computed)
      add(
        diagnostics,
        'AUDITOR_CONCLUSION_CONTRADICTION',
        `/${evaluation.id}/conclusion`,
        `Conclusion contradicts assessments; expected ${computed}.`,
        [evaluation.id],
      );
    const submitterRole = get(submission?.submittedByRoleAssignmentId);
    const auditorRole = get(evaluation.auditorRoleAssignmentId);
    if (submitterRole?.partyId === auditorRole?.partyId)
      add(
        diagnostics,
        'EVIDENCE_EVALUATION_ROLE_CONFLICT',
        `/${evaluation.id}`,
        'Evidence submitter and Outcome Auditor are the same person.',
        [evaluation.id],
      );
    for (const id of ids(evaluation.evidenceBasisIds)) {
      const basis = get(id);
      if (
        basis?.entityType === 'external-package-reference' &&
        Date.parse(String(basis.createdAtSource)) > Date.parse(String(evaluation.evaluatedAt))
      )
        add(
          diagnostics,
          'EVIDENCE_PACKAGE_CHANGED_AFTER_EVALUATION',
          `/${evaluation.id}/evidenceBasisIds`,
          'Evaluation points to an external package created after evaluation.',
          [evaluation.id, basis.id],
        );
    }
  }

  for (const determination of records('outcome-director-determination')) {
    checkHumanRecord(determination, diagnostics);
    const maybeExternal = get(determination.auditorEvaluationId);
    if (maybeExternal?.entityType === 'external-package-reference')
      add(
        diagnostics,
        'OCRS_RECOMMENDATION_TREATED_AS_DETERMINATION',
        `/${determination.id}/auditorEvaluationId`,
        'A Level 2 package cannot replace Outcome Auditor evaluation.',
        [determination.id, maybeExternal.id],
      );
    checkRole(
      determination,
      'directorRoleAssignmentId',
      'outcome_director',
      'make_outcome_determination',
      'determinedAt',
      byId,
      diagnostics,
    );
    const evaluation = get(determination.auditorEvaluationId);
    if (!evaluation)
      add(
        diagnostics,
        'MISSING_AUDITOR_EVALUATION',
        `/${determination.id}/auditorEvaluationId`,
        'Outcome Director determination requires an Outcome Auditor evaluation.',
        [determination.id],
      );
    else if (!sameContext(determination, evaluation))
      add(
        diagnostics,
        'DETERMINATION_EVALUATION_MISMATCH',
        `/${determination.id}`,
        'Determination and evaluation contexts differ.',
        [determination.id, evaluation.id],
      );
    if (!get(determination.residualRiskDeclarationId))
      add(
        diagnostics,
        'MISSING_RESIDUAL_RISK_DECLARATION',
        `/${determination.id}`,
        'Residual-risk declaration is required.',
        [determination.id],
      );
    if (
      determination.determination === 'supports_authorization' &&
      evaluation?.conclusion !== 'evidence_sufficient'
    )
      add(
        diagnostics,
        'DETERMINATION_WITH_INSUFFICIENT_EVIDENCE',
        `/${determination.id}`,
        'Authorization support requires sufficient evidence.',
        [determination.id],
      );
    checkAuditorDirectorSeparation(determination, evaluation, byId, diagnostics);
  }

  for (const acceptance of records('residual-risk-acceptance')) {
    checkHumanRecord(acceptance, diagnostics);
    checkRole(
      acceptance,
      'directorRoleAssignmentId',
      'outcome_director',
      'accept_residual_risk',
      'acceptedAt',
      byId,
      diagnostics,
      'UNAUTHORIZED_RISK_ACCEPTANCE',
    );
    const declaration = get(acceptance.declarationId);
    if (!sameContext(acceptance, declaration))
      add(
        diagnostics,
        'OUTCOME_BOUNDARY_MISMATCH',
        `/${acceptance.id}`,
        'Risk declaration and acceptance contexts differ.',
        [acceptance.id],
      );
  }

  for (const condition of records('authorization-condition')) {
    checkRole(
      condition,
      'ownerRoleAssignmentId',
      'condition_owner',
      'manage_authorization_condition',
      'createdAt',
      byId,
      diagnostics,
    );
  }

  for (const authorization of records('outcome-authorization')) {
    checkHumanRecord(authorization, diagnostics);
    const maybeExternal = get(authorization.determinationId);
    if (maybeExternal?.entityType === 'external-package-reference')
      add(
        diagnostics,
        'OCRS_RESULT_TREATED_AS_AUTHORIZATION',
        `/${authorization.id}/determinationId`,
        'An OCRS result cannot replace a Level 1 determination.',
        [authorization.id, maybeExternal.id],
      );
    checkRole(
      authorization,
      'directorRoleAssignmentId',
      'outcome_director',
      'issue_outcome_authorization',
      'authorizedAt',
      byId,
      diagnostics,
    );
    const determination = get(authorization.determinationId);
    const evaluation = get(authorization.auditorEvaluationId);
    const acceptance = get(authorization.residualRiskAcceptanceId);
    if (!determination)
      add(
        diagnostics,
        'MISSING_DIRECTOR_DETERMINATION',
        `/${authorization.id}`,
        'Outcome Authorization requires a determination.',
        [authorization.id],
      );
    else if (!sameContext(authorization, determination))
      add(
        diagnostics,
        'AUTHORIZATION_DETERMINATION_MISMATCH',
        `/${authorization.id}`,
        'Authorization and determination contexts differ.',
        [authorization.id, determination.id],
      );
    if (!evaluation)
      add(
        diagnostics,
        'MISSING_AUDITOR_EVALUATION',
        `/${authorization.id}`,
        'Outcome Authorization requires an Auditor evaluation.',
        [authorization.id],
      );
    if (!acceptance)
      add(
        diagnostics,
        'UNAUTHORIZED_RISK_ACCEPTANCE',
        `/${authorization.id}`,
        'Outcome Authorization requires Director residual-risk acceptance.',
        [authorization.id],
      );
    const positive =
      authorization.decision === 'authorized' ||
      authorization.decision === 'authorized_with_conditions';
    if (
      positive &&
      (determination?.determination !== 'supports_authorization' ||
        evaluation?.conclusion !== 'evidence_sufficient' ||
        acceptance?.decision !== 'accepted')
    )
      add(
        diagnostics,
        'AUTHORIZATION_BASIS_CONTRADICTION',
        `/${authorization.id}`,
        'Positive authorization contradicts its human decision basis.',
        [authorization.id],
      );
    if (
      positive &&
      (authorization.directorRoleAssignmentId !== determination?.directorRoleAssignmentId ||
        authorization.directorRoleAssignmentId !== acceptance?.directorRoleAssignmentId)
    )
      add(
        diagnostics,
        'DIRECTOR_ACTS_NOT_COHERENT',
        `/${authorization.id}`,
        'Determination, risk acceptance, and authorization must be acts of the same Outcome Director assignment.',
        [authorization.id],
      );
    const conditionIds = ids(authorization.conditionIds);
    if (authorization.decision === 'authorized_with_conditions' && conditionIds.length === 0)
      add(
        diagnostics,
        'CONDITIONAL_AUTHORIZATION_NO_CONDITIONS',
        `/${authorization.id}/conditionIds`,
        'Conditional authorization requires controlled conditions.',
        [authorization.id],
      );
    if (authorization.decision !== 'authorized_with_conditions' && conditionIds.length > 0)
      add(
        diagnostics,
        'AUTHORIZATION_CONDITION_CONTRADICTION',
        `/${authorization.id}/conditionIds`,
        'Only conditional authorization may carry conditions.',
        [authorization.id],
      );
    if (
      Date.parse(String(authorization.validFrom)) > Date.parse(String(authorization.validTo)) ||
      Date.parse(String(authorization.authorizedAt)) > Date.parse(String(authorization.validTo))
    )
      add(
        diagnostics,
        'AUTHORIZATION_OUTSIDE_VALIDITY',
        `/${authorization.id}`,
        'Authorization validity interval is incoherent.',
        [authorization.id],
      );
  }

  for (const extension of records('extension-declaration')) {
    if (['oap', 'icxa'].includes(String(extension.namespace)))
      add(
        diagnostics,
        'RESERVED_EXTENSION_NAMESPACE',
        `/${extension.id}/namespace`,
        'Reserved namespace.',
        [extension.id],
      );
    if (idsOrStrings(extension.controlledTermOverrides).length)
      add(
        diagnostics,
        'CONTROLLED_TERM_REDEFINITION',
        `/${extension.id}`,
        'Extension redefines a controlled term.',
        [extension.id],
      );
    if (
      idsOrStrings(extension.authorityControlChanges).length ||
      extension.automatedAuthority === true
    )
      add(
        diagnostics,
        'EXTENSION_WEAKENS_AUTHORITY',
        `/${extension.id}`,
        'Extension changes or automates authority controls.',
        [extension.id],
      );
  }

  validateSupersession(pkg, byId, diagnostics);
  validateChronology(pkg, byId, diagnostics);
  return uniqueDiagnostics(diagnostics);
}

function checkRole(
  record: OapRecord,
  field: string,
  roleName: string,
  action: string,
  timeField: string,
  byId: Map<string, OapRecord>,
  out: Diagnostic[],
  overrideCode = 'INVALID_ROLE_AT_ACTION_TIME',
): void {
  const assignment = byId.get(String(record[field]));
  if (!assignment) return;
  const party = byId.get(String(assignment.partyId));
  if (party?.partyType !== 'person' || assignment.role !== roleName)
    add(
      out,
      overrideCode,
      `/${record.id}/${field}`,
      `${roleName} must be an assigned human role.`,
      [record.id, assignment.id],
    );
  const at = Date.parse(String(record[timeField]));
  if (
    at < Date.parse(String(assignment.validFrom)) ||
    (assignment.validTo && at > Date.parse(String(assignment.validTo)))
  )
    add(
      out,
      'EXPIRED_APPOINTMENT',
      `/${record.id}/${field}`,
      'Role assignment is not valid at action time.',
      [record.id, assignment.id],
    );
  const scope = byId.get(String(assignment.authorityScopeId));
  if (
    !scope ||
    !idsOrStrings(scope.permittedActions).includes(action) ||
    !idsOrStrings(scope.projectIds).includes(String(record.projectId)) ||
    !idsOrStrings(scope.outcomeIds).includes(String(record.outcomeId)) ||
    !ids(record.boundaryIds).every((id) => idsOrStrings(scope.boundaryIds).includes(id))
  )
    add(
      out,
      'AUTHORITY_OUT_OF_SCOPE',
      `/${record.id}/${field}`,
      `Role lacks ${action} authority for the record context.`,
      [record.id, assignment.id],
    );
  const conflicts = [...byId.values()].filter(
    (r) =>
      r.entityType === 'conflict-of-interest-declaration' && r.roleAssignmentId === assignment.id,
  );
  if (!conflicts.length || conflicts.some((c) => c.status === 'unresolved'))
    add(
      out,
      'UNRESOLVED_CONFLICT_OF_INTEREST',
      `/${record.id}/${field}`,
      'Role requires a current resolved conflict-of-interest declaration.',
      [record.id, assignment.id],
    );
}

function checkHumanRecord(record: OapRecord, out: Diagnostic[]): void {
  if (record.generationMethod !== 'human_supplied')
    add(
      out,
      'SOFTWARE_GENERATED_AUTHORIZATION',
      `/${record.id}/generationMethod`,
      'Human authority record cannot be software-generated.',
      [record.id],
    );
}

function checkAuditorDirectorSeparation(
  determination: OapRecord,
  evaluation: OapRecord | undefined,
  byId: Map<string, OapRecord>,
  out: Diagnostic[],
): void {
  const auditor = byId.get(String(evaluation?.auditorRoleAssignmentId));
  const director = byId.get(String(determination.directorRoleAssignmentId));
  if (auditor && director && auditor.partyId === director.partyId)
    add(
      out,
      'AUDITOR_DIRECTOR_ROLE_CONFLICT',
      `/${determination.id}`,
      'Outcome Auditor and Outcome Director must be different independent people.',
      [determination.id, auditor.id, director.id],
    );
}

function validateInventory(pkg: OapPackage, out: Diagnostic[]): void {
  const actual = pkg.records.map((r) => `${r.id}|${r.entityType}|${r.recordVersion}`).sort();
  const listed = pkg.manifest.inventory
    .map((r) => `${r.recordId}|${r.entityType}|${r.recordVersion}`)
    .sort();
  if (!sameSet(actual, listed))
    add(
      out,
      'INVALID_PACKAGE_INVENTORY',
      '/manifest/inventory',
      'Manifest inventory is not the exact record inventory.',
    );
  for (const record of pkg.records) {
    const item = pkg.manifest.inventory.find((entry) => entry.recordId === record.id);
    if (
      record.entityType === 'external-package-reference' &&
      record.supersessionStatus === 'superseded' &&
      item?.supersessionStatus !== 'superseded'
    )
      add(
        out,
        'INVALID_PACKAGE_INVENTORY',
        '/manifest/inventory',
        'External package supersession is inconsistent with the manifest inventory.',
        [record.id],
      );
  }
}

function validateSupersession(
  pkg: OapPackage,
  byId: Map<string, OapRecord>,
  out: Diagnostic[],
): void {
  for (const record of pkg.records)
    if (record.supersedes) {
      const prior = byId.get(record.supersedes);
      if (!prior || prior.entityType !== record.entityType || prior.id === record.id)
        add(
          out,
          'INVALID_SUPERSESSION',
          `/${record.id}/supersedes`,
          'Invalid supersession relationship.',
          [record.id],
        );
    }
  const activeAuthorizations = pkg.records.filter(
    (r) =>
      r.entityType === 'outcome-authorization' &&
      !pkg.records.some(
        (x) =>
          x.entityType === 'authorization-change' &&
          x.authorizationId === r.id &&
          ['withdrawn', 'revoked', 'superseded'].includes(String(x.changeType)),
      ),
  );
  const keys = activeAuthorizations.map(
    (r) => `${r.projectId}|${r.outcomeId}|${JSON.stringify(r.boundaryIds)}`,
  );
  if (new Set(keys).size !== keys.length)
    add(
      out,
      'SILENT_DECISION_OVERWRITE',
      '/records',
      'Multiple current authorization records exist for one context without supersession.',
    );
  for (const change of pkg.records.filter(
    (r) =>
      r.entityType === 'authorization-change' &&
      ['withdrawn', 'revoked'].includes(String(r.changeType)),
  )) {
    const inventory = pkg.manifest.inventory.find((x) => x.recordId === change.authorizationId);
    if (inventory?.supersessionStatus === 'current')
      add(
        out,
        'WITHDRAWN_AUTHORIZATION_ACTIVE',
        `/manifest/inventory/${change.authorizationId}`,
        'Withdrawn or revoked authorization is declared current.',
        [String(change.authorizationId), change.id],
      );
  }
}

function validateChronology(
  pkg: OapPackage,
  byId: Map<string, OapRecord>,
  out: Diagnostic[],
): void {
  const links: Array<[string, string, string]> = [
    ['outcome-auditor-evaluation', 'submissionId', 'evaluatedAt'],
    ['outcome-director-determination', 'auditorEvaluationId', 'determinedAt'],
    ['residual-risk-acceptance', 'declarationId', 'acceptedAt'],
    ['outcome-authorization', 'determinationId', 'authorizedAt'],
  ];
  for (const [type, field, time] of links)
    for (const record of pkg.records.filter((r) => r.entityType === type)) {
      const prior = byId.get(String(record[field]));
      const priorTime = prior
        ? Date.parse(
            String(prior.evaluatedAt ?? prior.submittedAt ?? prior.declaredAt ?? prior.createdAt),
          )
        : NaN;
      if (Number.isFinite(priorTime) && Date.parse(String(record[time])) < priorTime)
        add(
          out,
          'INVALID_CHRONOLOGY',
          `/${record.id}/${time}`,
          'Record predates its required basis.',
          [record.id, prior!.id],
        );
    }
}

function schemaDiagnostic(error: ErrorObject): Diagnostic {
  const missing = (error.params as { missingProperty?: string }).missingProperty;
  const code =
    error.instancePath === '/schemaVersion'
      ? 'UNSUPPORTED_SCHEMA_VERSION'
      : error.instancePath.endsWith('/retrievalReference')
        ? 'UNSAFE_EXTERNAL_REFERENCE'
        : missing === 'recordVersion'
          ? 'MISSING_RECORD_VERSION'
          : missing &&
              [
                'ownerRoleAssignmentId',
                'dueDate',
                'monitoringRequirements',
                'escalationRequirements',
              ].includes(missing)
            ? 'CONDITION_INCOMPLETE'
            : 'SCHEMA_INVALID';
  return {
    code,
    path: error.instancePath || '/',
    message: `${error.instancePath || '/'} ${error.message ?? error.keyword}`,
    supportingRecordIds: [],
  };
}

function add(
  out: Diagnostic[],
  code: string,
  path: string,
  message: string,
  supportingRecordIds: string[] = [],
): void {
  out.push({ code, path, message, supportingRecordIds });
}
function ids(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((x): x is string => typeof x === 'string') : [];
}
function idsOrStrings(value: unknown): string[] {
  return ids(value);
}
function sameSet(a: string[], b: string[]): boolean {
  return a.length === b.length && [...a].sort().every((x, i) => x === [...b].sort()[i]);
}
function uniqueDiagnostics(values: Diagnostic[]): Diagnostic[] {
  const seen = new Set<string>();
  return values.filter((d) => {
    const key = `${d.code}|${d.path}|${d.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
