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
      ['projectId', ['project-context']],
      ['outcomeId', ['outcome']],
      ['boundaryIds', ['authorization-boundary']],
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
  for (const declaration of pkg.records.filter((r) => r.entityType === 'residual-risk-declaration'))
    for (const [index, item] of (Array.isArray(declaration.riskItems)
      ? declaration.riskItems
      : []
    ).entries())
      ref(
        declaration,
        `riskItems/${index}/ownerPartyId`,
        (item as Record<string, unknown>).ownerPartyId,
        ['party'],
      );

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
      external.claimedValidationStatus === 'failed' ||
      (currentlyReliedUpon && external.supersessionStatus !== 'current')
    )
      add(
        diagnostics,
        'UNBOUND_EXTERNAL_EVIDENCE',
        `/${external.id}`,
        'Relied-upon external evidence must be digest-bound, not claimed failed, and current.',
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
      authorization.directorRoleAssignmentId !== determination?.directorRoleAssignmentId ||
      authorization.directorRoleAssignmentId !== acceptance?.directorRoleAssignmentId
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

  validateProfileIntegrity(pkg, byId, diagnostics);
  validateEvidenceSemantics(pkg, byId, diagnostics);
  validateDecisionChains(pkg, byId, diagnostics);
  validateConditionIntegrity(pkg, byId, diagnostics);
  validateAuthorizationLifecycle(pkg, byId, diagnostics);
  validateDelegationIntegrity(pkg, byId, diagnostics);
  validateSupersession(pkg, byId, diagnostics);
  validateChronology(pkg, byId, diagnostics);
  return uniqueDiagnostics(diagnostics);
}

function validateProfileIntegrity(
  pkg: OapPackage,
  byId: Map<string, OapRecord>,
  out: Diagnostic[],
): void {
  for (const [index, entry] of pkg.manifest.profiles.entries()) {
    const declaration = byId.get(entry.profileId);
    if (
      !declaration ||
      declaration.entityType !== 'profile-declaration' ||
      declaration.id !== entry.profileId ||
      declaration.profileVersion !== entry.profileVersion ||
      declaration.oapVersion !== pkg.manifest.oapVersion
    )
      add(
        out,
        'PROFILE_DECLARATION_MISMATCH',
        `/manifest/profiles/${index}`,
        'Manifest profile identity, profile version, and OAP version must match its declaration.',
        declaration ? [declaration.id] : [],
      );
    if (declaration?.status === 'approved' && declaration.id === 'oap:profile:icxa-provisional')
      add(
        out,
        'PROFILE_STATUS_INVALID',
        `/manifest/profiles/${index}`,
        'The provisional ICxA profile cannot be represented as approved.',
        [declaration.id],
      );
  }
  const required = ['oap:profile:core'];
  if (pkg.records.some((record) => record.entityType === 'external-package-reference'))
    required.push('oap:profile:ocrs-input');
  for (const id of required)
    if (!pkg.manifest.profiles.some((entry) => entry.profileId === id))
      add(
        out,
        'REQUIRED_PROFILE_MISSING',
        '/manifest/profiles',
        `Required profile ${id} is missing.`,
      );
}

function validateEvidenceSemantics(
  pkg: OapPackage,
  byId: Map<string, OapRecord>,
  out: Diagnostic[],
): void {
  const all = (type: string) => pkg.records.filter((record) => record.entityType === type);
  const current = (record: OapRecord) =>
    !pkg.records.some((candidate) => candidate.supersedes === record.id);
  for (const oen of all('outcome-evidence-need')) {
    if (oen.determinedBeforeEvidenceGeneration !== true)
      add(
        out,
        'OEN_SEQUENCE_INVALID',
        `/${oen.id}/determinedBeforeEvidenceGeneration`,
        'OEN-before-evidence conformance requires an affirmative supplied determination.',
        [oen.id],
      );
    for (const submission of all('evidence-submission').filter(
      (item) => item.outcomeId === oen.outcomeId,
    ))
      for (const externalId of idList(submission.externalPackageReferenceIds)) {
        const external = byId.get(externalId);
        if (
          external?.evidenceOrigin === 'generated_in_response_to_oen' &&
          external.evidenceGeneratedAt &&
          Date.parse(String(external.evidenceGeneratedAt)) < Date.parse(String(oen.createdAt))
        )
          add(
            out,
            'OEN_SEQUENCE_INVALID',
            `/${oen.id}`,
            'Evidence identified as generated in response to the OEN predates that OEN.',
            [oen.id, external.id],
          );
      }
  }

  for (const submission of all('evidence-submission')) {
    const outcome = byId.get(String(submission.outcomeId));
    const oen = byId.get(String(outcome?.evidenceNeedId));
    const submissionCriteria = idList(submission.criterionIds);
    const oenCriteria = idList(oen?.criterionIds);
    if (!oen || !sameSet(submissionCriteria, oenCriteria))
      add(
        out,
        'INCOMPLETE_ASSESSMENT_COVERAGE',
        `/${submission.id}/criterionIds`,
        'Submission criteria must exactly cover the applicable OEN criteria; no exclusion model is approved.',
        [submission.id, ...(oen ? [oen.id] : [])],
      );
    for (const criterionId of submissionCriteria) {
      const criterion = byId.get(criterionId);
      if (
        criterion?.outcomeId !== submission.outcomeId ||
        !idList(outcome?.criterionIds).includes(criterionId)
      )
        add(
          out,
          'ASSESSMENT_CONTEXT_MISMATCH',
          `/${submission.id}/criterionIds`,
          'Submitted criterion does not belong to the declared Outcome.',
          [submission.id, criterionId],
        );
    }
    for (const externalId of idList(submission.externalPackageReferenceIds)) {
      const external = byId.get(externalId);
      for (const boundaryId of idList(submission.boundaryIds)) {
        const boundary = byId.get(boundaryId);
        if (
          external &&
          boundary &&
          !sameSet(idList(external.subjectIdentifiers), idList(boundary.subjectIds))
        )
          add(
            out,
            'EXTERNAL_SUBJECT_MISMATCH',
            `/${external.id}/subjectIdentifiers`,
            'External subjects must equal the declared OAP authorization-boundary mapping.',
            [external.id, boundary.id],
          );
        if (
          external &&
          boundary &&
          !sameSet(idList(external.boundaryIdentifiers), idList(boundary.externalBoundaryIds))
        )
          add(
            out,
            'EXTERNAL_BOUNDARY_MISMATCH',
            `/${external.id}/boundaryIdentifiers`,
            'External boundaries must equal the declared OAP authorization-boundary mapping.',
            [external.id, boundary.id],
          );
      }
    }
    const assessments = all('evidence-sufficiency-assessment').filter(
      (assessment) => assessment.submissionId === submission.id && current(assessment),
    );
    for (const criterionId of submissionCriteria) {
      const matches = assessments.filter((assessment) => assessment.criterionId === criterionId);
      if (matches.length !== 1)
        add(
          out,
          'INCOMPLETE_ASSESSMENT_COVERAGE',
          `/${submission.id}/criterionIds`,
          `Criterion ${criterionId} requires exactly one current assessment; found ${matches.length}.`,
          [submission.id, ...matches.map((item) => item.id)],
        );
    }
  }

  for (const assessment of all('evidence-sufficiency-assessment')) {
    const submission = byId.get(String(assessment.submissionId));
    if (!sameRecordContext(assessment, submission))
      add(
        out,
        'ASSESSMENT_CONTEXT_MISMATCH',
        `/${assessment.id}`,
        'Assessment project, Outcome, and boundaries must equal its submission context.',
        [assessment.id, ...(submission ? [submission.id] : [])],
      );
    const packages = idList(assessment.evidencePackageReferenceIds);
    if (
      packages.length === 0 ||
      !packages.every((id) => idList(submission?.externalPackageReferenceIds).includes(id))
    )
      add(
        out,
        'ASSESSMENT_EVIDENCE_MISMATCH',
        `/${assessment.id}/evidencePackageReferenceIds`,
        'Assessment evidence packages must be a nonempty subset of its submission.',
        [assessment.id, ...(submission ? [submission.id] : [])],
      );
  }

  for (const evaluation of all('outcome-auditor-evaluation')) {
    const submission = byId.get(String(evaluation.submissionId));
    const applicable = all('evidence-sufficiency-assessment').filter(
      (assessment) =>
        assessment.submissionId === evaluation.submissionId &&
        !pkg.records.some((candidate) => candidate.supersedes === assessment.id),
    );
    if (
      !sameRecordContext(evaluation, submission) ||
      applicable.some((assessment) => !sameRecordContext(evaluation, assessment))
    )
      add(
        out,
        'ASSESSMENT_CONTEXT_MISMATCH',
        `/${evaluation.id}`,
        'Evaluation, submission, and all applicable assessments must share one context.',
        [evaluation.id],
      );
    if (
      !sameSet(
        idList(evaluation.assessmentIds),
        applicable.map((item) => item.id),
      )
    )
      add(
        out,
        'INCOMPLETE_ASSESSMENT_COVERAGE',
        `/${evaluation.id}/assessmentIds`,
        'Evaluation must reference the complete set of current assessments.',
        [evaluation.id, ...applicable.map((item) => item.id)],
      );
    const requiredBasis = [
      ...applicable.map((item) => item.id),
      ...idList(submission?.externalPackageReferenceIds),
    ];
    if (!requiredBasis.every((id) => idList(evaluation.evidenceBasisIds).includes(id)))
      add(
        out,
        'EVALUATION_BASIS_MISMATCH',
        `/${evaluation.id}/evidenceBasisIds`,
        'Evaluation basis must include every current assessment and submitted external package.',
        [evaluation.id],
      );
    const expected =
      applicable.length === 0
        ? 'indeterminate'
        : applicable.every(
              (assessment) =>
                assessment.admissibility === 'admissible' &&
                assessment.sufficiency === 'sufficient' &&
                assessment.credibility === 'credible' &&
                assessment.relevance === 'relevant' &&
                assessment.currency === 'current',
            )
          ? 'evidence_sufficient'
          : applicable.some(
                (assessment) =>
                  assessment.admissibility === 'inadmissible' ||
                  assessment.sufficiency === 'insufficient' ||
                  assessment.credibility === 'not_credible' ||
                  assessment.relevance === 'not_relevant' ||
                  assessment.currency === 'stale',
              )
            ? 'evidence_insufficient'
            : 'indeterminate';
    if (evaluation.conclusion !== expected)
      add(
        out,
        'AUDITOR_CONCLUSION_CONTRADICTION',
        `/${evaluation.id}/conclusion`,
        `Conclusion contradicts complete current assessment coverage; expected ${expected}.`,
        [evaluation.id],
      );
  }
}

function validateDecisionChains(
  pkg: OapPackage,
  byId: Map<string, OapRecord>,
  out: Diagnostic[],
): void {
  const externalFor = (submission?: OapRecord) => idList(submission?.externalPackageReferenceIds);
  for (const declaration of pkg.records.filter(
    (r) => r.entityType === 'residual-risk-declaration',
  )) {
    const submission = byId.get(String(declaration.submissionId));
    if (!sameRecordContext(declaration, submission))
      add(
        out,
        'RISK_CONTEXT_MISMATCH',
        `/${declaration.id}`,
        'Residual-risk declaration must share its submission context.',
        [declaration.id],
      );
    const riskIds = objectList(declaration.riskItems).map((item) => String(item.riskId));
    if (new Set(riskIds).size !== riskIds.length)
      add(
        out,
        'DUPLICATE_RISK_ID',
        `/${declaration.id}/riskItems`,
        'Risk identifiers must be unique within a residual-risk declaration.',
        [declaration.id],
      );
    for (const [index, item] of objectList(declaration.riskItems).entries()) {
      const owner = byId.get(String(item.ownerPartyId));
      if (!owner || !['person', 'organization'].includes(String(owner.partyType)))
        add(
          out,
          'RISK_OWNER_INVALID',
          `/${declaration.id}/riskItems/${index}/ownerPartyId`,
          'Residual-risk owner must identify an existing person or organization.',
          [declaration.id],
        );
    }
  }
  for (const determination of pkg.records.filter(
    (r) => r.entityType === 'outcome-director-determination',
  )) {
    const evaluation = byId.get(String(determination.auditorEvaluationId));
    const submission = byId.get(String(evaluation?.submissionId));
    const declaration = byId.get(String(determination.residualRiskDeclarationId));
    if (
      !sameRecordContext(determination, evaluation) ||
      !sameRecordContext(determination, submission) ||
      !sameRecordContext(determination, declaration) ||
      declaration?.submissionId !== submission?.id
    )
      add(
        out,
        'DECISION_CHAIN_MISMATCH',
        `/${determination.id}`,
        'Determination must use one evaluation, submission, risk declaration, and exact context.',
        [determination.id],
      );
    if (
      !declaration ||
      declaration.submissionId !== submission?.id ||
      !sameRecordContext(declaration, submission)
    )
      add(
        out,
        'RISK_DECLARATION_MISMATCH',
        `/${determination.id}/residualRiskDeclarationId`,
        'Determination must use the residual-risk declaration for its exact submission and context.',
        [determination.id],
      );
    const required = [submission?.id, evaluation?.id, ...externalFor(submission)].filter(
      (id): id is string => typeof id === 'string',
    );
    if (!required.every((id) => idList(determination.evidenceBasisIds).includes(id)))
      add(
        out,
        'EVALUATION_BASIS_MISMATCH',
        `/${determination.id}/evidenceBasisIds`,
        'Determination basis must include its submission, evaluation, and submitted external packages.',
        [determination.id],
      );
  }
  for (const acceptance of pkg.records.filter((r) => r.entityType === 'residual-risk-acceptance')) {
    const declaration = byId.get(String(acceptance.declarationId));
    if (!sameRecordContext(acceptance, declaration))
      add(
        out,
        'RISK_CONTEXT_MISMATCH',
        `/${acceptance.id}`,
        'Risk acceptance context must equal the accepted declaration.',
        [acceptance.id],
      );
  }
  for (const authorization of pkg.records.filter((r) => r.entityType === 'outcome-authorization')) {
    const determination = byId.get(String(authorization.determinationId));
    const evaluation = byId.get(String(authorization.auditorEvaluationId));
    const declaration = byId.get(String(determination?.residualRiskDeclarationId));
    const acceptance = byId.get(String(authorization.residualRiskAcceptanceId));
    const submission = byId.get(String(evaluation?.submissionId));
    if (authorization.auditorEvaluationId !== determination?.auditorEvaluationId)
      add(
        out,
        'AUTHORIZATION_EVALUATION_MISMATCH',
        `/${authorization.id}/auditorEvaluationId`,
        'Authorization must use the exact evaluation used by its determination.',
        [authorization.id],
      );
    if (acceptance?.declarationId !== determination?.residualRiskDeclarationId)
      add(
        out,
        'AUTHORIZATION_ACCEPTANCE_MISMATCH',
        `/${authorization.id}/residualRiskAcceptanceId`,
        'Authorization must reference acceptance of the exact declaration used by its determination.',
        [authorization.id],
      );
    if (
      !sameRecordContext(authorization, evaluation) ||
      !sameRecordContext(authorization, determination) ||
      !sameRecordContext(authorization, declaration) ||
      !sameRecordContext(authorization, acceptance) ||
      declaration?.submissionId !== submission?.id
    )
      add(
        out,
        'RISK_CONTEXT_MISMATCH',
        `/${authorization.id}`,
        'Authorization, submission, risk, evaluation, and determination contexts must be identical.',
        [authorization.id],
      );
    const required = [
      submission?.id,
      evaluation?.id,
      declaration?.id,
      determination?.id,
      acceptance?.id,
      ...externalFor(submission),
    ].filter((id): id is string => typeof id === 'string');
    if (!required.every((id) => idList(authorization.evidenceBasisIds).includes(id)))
      add(
        out,
        'DECISION_CHAIN_MISMATCH',
        `/${authorization.id}/evidenceBasisIds`,
        'Authorization basis is incomplete for its exact decision chain.',
        [authorization.id],
      );
  }
}

function validateConditionIntegrity(
  pkg: OapPackage,
  byId: Map<string, OapRecord>,
  out: Diagnostic[],
): void {
  const authorizations = pkg.records.filter(
    (record) => record.entityType === 'outcome-authorization',
  );
  const conditions = pkg.records.filter(
    (record) => record.entityType === 'authorization-condition',
  );
  for (const authorization of authorizations) {
    const linked = idList(authorization.conditionIds)
      .map((id) => byId.get(id))
      .filter(
        (record): record is OapRecord =>
          !!record && record.entityType === 'authorization-condition',
      );
    if (
      authorization.decision === 'authorized_with_conditions' &&
      !linked.some((condition) => condition.status === 'open')
    )
      add(
        out,
        'CONDITION_STATUS_CONTRADICTION',
        `/${authorization.id}/conditionIds`,
        'Conditional authorization requires at least one current open condition.',
        [authorization.id],
      );
    for (const condition of linked) {
      if (condition.authorizationId !== authorization.id)
        add(
          out,
          'CONDITION_AUTHORIZATION_LINK_MISMATCH',
          `/${condition.id}/authorizationId`,
          'Authorization and condition links must be bidirectional.',
          [authorization.id, condition.id],
        );
      if (!sameRecordContext(condition, authorization))
        add(
          out,
          'CONDITION_CONTEXT_MISMATCH',
          `/${condition.id}`,
          'Condition context must exactly equal its authorization.',
          [authorization.id, condition.id],
        );
      if (['cancelled', 'superseded'].includes(String(condition.status)))
        add(
          out,
          'CONDITION_STATUS_CONTRADICTION',
          `/${authorization.id}/conditionIds`,
          'Cancelled or superseded conditions cannot be active authorization requirements.',
          [authorization.id, condition.id],
        );
    }
  }
  for (const condition of conditions) {
    const authorization = byId.get(String(condition.authorizationId));
    if (!authorization || !idList(authorization.conditionIds).includes(condition.id))
      add(
        out,
        'CONDITION_AUTHORIZATION_LINK_MISMATCH',
        `/${condition.id}/authorizationId`,
        'Condition authorization backlink must be reciprocated.',
        [condition.id],
      );
    const validSources = new Set([
      authorization?.id,
      authorization?.determinationId,
      byId.get(String(authorization?.determinationId))?.residualRiskDeclarationId,
    ]);
    if (!idList(condition.sourceRecordIds).some((id) => validSources.has(id)))
      add(
        out,
        'CONDITION_CONTEXT_MISMATCH',
        `/${condition.id}/sourceRecordIds`,
        'Condition must cite its authorization, determination, or residual-risk basis.',
        [condition.id],
      );
    if (
      condition.status === 'verified_closed' &&
      idList(condition.closureEvidencePackageReferenceIds).length === 0
    )
      add(
        out,
        'CONDITION_CLOSURE_EVIDENCE_REQUIRED',
        `/${condition.id}/closureEvidencePackageReferenceIds`,
        'Verified closure requires nonempty integrity-bound current closure evidence.',
        [condition.id],
      );
    for (const id of idList(condition.closureEvidencePackageReferenceIds)) {
      const evidence = byId.get(id);
      if (
        evidence?.entityType !== 'external-package-reference' ||
        evidence.supersessionStatus !== 'current' ||
        evidence.claimedValidationStatus === 'failed'
      )
        add(
          out,
          'CONDITION_CLOSURE_EVIDENCE_REQUIRED',
          `/${condition.id}/closureEvidencePackageReferenceIds`,
          'Closure evidence must be current and integrity-bound.',
          [condition.id, id],
        );
      const mappedBoundaries = idList(condition.boundaryIds)
        .map((boundaryId) => byId.get(boundaryId))
        .filter((boundary): boundary is OapRecord => !!boundary);
      const mappedSubjects = mappedBoundaries.flatMap((boundary) => idList(boundary.subjectIds));
      const mappedExternalBoundaries = mappedBoundaries.flatMap((boundary) =>
        idList(boundary.externalBoundaryIds),
      );
      if (
        evidence?.entityType === 'external-package-reference' &&
        (!sameSet(idList(evidence.subjectIdentifiers), mappedSubjects) ||
          !sameSet(idList(evidence.boundaryIdentifiers), mappedExternalBoundaries))
      )
        add(
          out,
          'CONDITION_CLOSURE_EVIDENCE_MISMATCH',
          `/${condition.id}/closureEvidencePackageReferenceIds`,
          'Condition closure evidence subjects and external boundaries must match the authorization-boundary mapping.',
          [condition.id, evidence.id],
        );
    }
    if (
      authorization &&
      Date.parse(String(condition.dueDate)) < Date.parse(String(authorization.authorizedAt))
    )
      add(
        out,
        'CONDITION_CONTEXT_MISMATCH',
        `/${condition.id}/dueDate`,
        'Condition due date cannot predate authorization.',
        [condition.id, authorization.id],
      );
  }
}

function validateAuthorizationLifecycle(
  pkg: OapPackage,
  byId: Map<string, OapRecord>,
  out: Diagnostic[],
): void {
  for (const change of pkg.records.filter(
    (record) => record.entityType === 'authorization-change',
  )) {
    const authorization = byId.get(String(change.authorizationId));
    if (!sameRecordContext(change, authorization))
      add(
        out,
        'AUTHORIZATION_CHANGE_CONTEXT_MISMATCH',
        `/${change.id}`,
        'Authorization change context must exactly equal the affected authorization.',
        [change.id],
      );
    if (
      authorization &&
      Date.parse(String(change.changedAt)) < Date.parse(String(authorization.authorizedAt))
    )
      add(
        out,
        'AUTHORIZATION_CHANGE_CHRONOLOGY_INVALID',
        `/${change.id}/changedAt`,
        'Authorization change cannot predate authorization.',
        [change.id, authorization.id],
      );
    const humanRequired = ['withdrawn', 'revoked', 'superseded'].includes(
      String(change.changeType),
    );
    if (humanRequired || change.actorType === 'human_authority') {
      if (change.generationMethod !== 'human_supplied')
        add(
          out,
          'AUTHORIZATION_CHANGE_UNAUTHORIZED',
          `/${change.id}/generationMethod`,
          'Human lifecycle act must be supplied as a human record.',
          [change.id],
        );
      checkRole(
        change,
        'changedByRoleAssignmentId',
        'outcome_director',
        change.changeType === 'revoked' ? 'revoke_authorization' : 'withdraw_authorization',
        'changedAt',
        byId,
        out,
        'AUTHORIZATION_CHANGE_UNAUTHORIZED',
      );
    } else if (
      change.actorType !== 'system_detection' ||
      change.generationMethod !== 'system_capture' ||
      !['expired', 'reassessment_required'].includes(String(change.changeType))
    )
      add(
        out,
        'AUTHORIZATION_CHANGE_UNAUTHORIZED',
        `/${change.id}`,
        'System detection is limited to deterministic expiry or reassessment triggers.',
        [change.id],
      );
    if (change.actorType === 'system_detection' && change.changedByRoleAssignmentId)
      add(
        out,
        'AUTHORIZATION_CHANGE_UNAUTHORIZED',
        `/${change.id}/changedByRoleAssignmentId`,
        'A system-detected lifecycle event must not name a human decision maker.',
        [change.id],
      );
    if (change.changeType === 'superseded') {
      const replacement = byId.get(String(change.replacementAuthorizationId));
      if (!replacement || replacement.supersedes !== authorization?.id)
        add(
          out,
          'AUTHORIZATION_REPLACEMENT_MISMATCH',
          `/${change.id}/replacementAuthorizationId`,
          'Supersession requires a replacement authorization with a reciprocal supersedes link.',
          [change.id],
        );
    }
    if (
      change.changeType === 'expired' &&
      authorization?.validTo &&
      Date.parse(String(change.changedAt)) < Date.parse(String(authorization.validTo))
    )
      add(
        out,
        'AUTHORIZATION_LIFECYCLE_CONTRADICTION',
        `/${change.id}/changedAt`,
        'Deterministic expiry cannot be recorded before the authorization validity end.',
        [change.id, authorization.id],
      );
  }
}

function validateDelegationIntegrity(
  pkg: OapPackage,
  byId: Map<string, OapRecord>,
  out: Diagnostic[],
): void {
  const delegations = pkg.records.filter((record) => record.entityType === 'delegation');
  const edges = new Map<string, string>();
  for (const delegation of delegations) {
    const delegator = byId.get(String(delegation.delegatorRoleAssignmentId));
    const delegate = byId.get(String(delegation.delegateRoleAssignmentId));
    const delegatedScope = byId.get(String(delegation.authorityScopeId));
    const delegatorScope = byId.get(String(delegator?.authorityScopeId));
    if (delegate?.delegationId !== delegation.id)
      add(
        out,
        'DELEGATION_LINK_MISMATCH',
        `/${delegation.id}`,
        'Delegation and delegate assignment links must be reciprocal.',
        [delegation.id],
      );
    const delegateScope = byId.get(String(delegate?.authorityScopeId));
    if (
      !subset(idList(delegatedScope?.projectIds), idList(delegatorScope?.projectIds)) ||
      !subset(idList(delegatedScope?.outcomeIds), idList(delegatorScope?.outcomeIds)) ||
      !subset(idList(delegatedScope?.boundaryIds), idList(delegatorScope?.boundaryIds)) ||
      !subset(idList(delegatedScope?.projectIds), idList(delegateScope?.projectIds)) ||
      !subset(idList(delegatedScope?.outcomeIds), idList(delegateScope?.outcomeIds)) ||
      !subset(idList(delegatedScope?.boundaryIds), idList(delegateScope?.boundaryIds))
    )
      add(
        out,
        'DELEGATION_SCOPE_EXPANSION',
        `/${delegation.id}/authorityScopeId`,
        'Delegated project, Outcome, and boundary scope must be subsets of delegator authority.',
        [delegation.id],
      );
    if (
      !subset(idList(delegatedScope?.permittedActions), idList(delegatorScope?.permittedActions)) ||
      !subset(idList(delegatedScope?.permittedActions), idList(delegateScope?.permittedActions))
    )
      add(
        out,
        'DELEGATION_ACTION_EXPANSION',
        `/${delegation.id}/authorityScopeId`,
        'Delegated actions must be a subset of delegator permissions.',
        [delegation.id],
      );
    const from = Date.parse(String(delegation.validFrom));
    const to = delegation.validTo ? Date.parse(String(delegation.validTo)) : Infinity;
    if (
      !delegator ||
      !delegate ||
      delegator.role !== delegate.role ||
      from < Date.parse(String(delegator.validFrom)) ||
      from < Date.parse(String(delegate.validFrom)) ||
      to > (delegator.validTo ? Date.parse(String(delegator.validTo)) : Infinity) ||
      to > (delegate.validTo ? Date.parse(String(delegate.validTo)) : Infinity) ||
      from > to
    )
      add(
        out,
        'DELEGATION_VALIDITY_INVALID',
        `/${delegation.id}`,
        'Delegation role and validity must remain within both human assignments.',
        [delegation.id],
      );
    if (delegator && delegate) edges.set(delegator.id, delegate.id);
  }
  for (const start of edges.keys()) {
    const visited = new Set<string>();
    let cursor: string | undefined = start;
    while (cursor && edges.has(cursor)) {
      if (visited.has(cursor)) {
        add(out, 'DELEGATION_CYCLE', '/records', 'Delegation graph contains a cycle.', [
          ...visited,
        ]);
        break;
      }
      visited.add(cursor);
      cursor = edges.get(cursor);
    }
  }
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
  if (assignment.delegationId) {
    const delegation = byId.get(String(assignment.delegationId));
    if (
      !delegation ||
      delegation.status !== 'active' ||
      delegation.delegateRoleAssignmentId !== assignment.id ||
      at < Date.parse(String(delegation.validFrom)) ||
      (delegation.validTo && at > Date.parse(String(delegation.validTo)))
    )
      add(
        out,
        'DELEGATION_VALIDITY_INVALID',
        `/${record.id}/${field}`,
        'Delegation is not active and reciprocal at action time.',
        [record.id, assignment.id],
      );
    const delegatedScope = byId.get(String(delegation?.authorityScopeId));
    if (
      !delegatedScope ||
      !idsOrStrings(delegatedScope.permittedActions).includes(action) ||
      !idsOrStrings(delegatedScope.projectIds).includes(String(record.projectId)) ||
      !idsOrStrings(delegatedScope.outcomeIds).includes(String(record.outcomeId)) ||
      !ids(record.boundaryIds).every((id) => idsOrStrings(delegatedScope.boundaryIds).includes(id))
    )
      add(
        out,
        'AUTHORITY_OUT_OF_SCOPE',
        `/${record.id}/${field}`,
        `Delegation lacks ${action} authority for the record context.`,
        [record.id, assignment.id, ...(delegation ? [delegation.id] : [])],
      );
  }
  const conflicts = [...byId.values()].filter(
    (r) =>
      r.entityType === 'conflict-of-interest-declaration' && r.roleAssignmentId === assignment.id,
  );
  const current = conflicts.filter(
    (declaration) =>
      ![...byId.values()].some((candidate) => candidate.supersedes === declaration.id),
  );
  const applicable = current.filter(
    (declaration) =>
      Date.parse(String(declaration.declaredAt)) <= at &&
      (!declaration.validTo || at <= Date.parse(String(declaration.validTo))),
  );
  const supersededApplicable = conflicts.filter(
    (declaration) =>
      [...byId.values()].some((candidate) => candidate.supersedes === declaration.id) &&
      Date.parse(String(declaration.declaredAt)) <= at &&
      (!declaration.validTo || at <= Date.parse(String(declaration.validTo))),
  );
  if (applicable.length === 0 && supersededApplicable.length > 0)
    add(
      out,
      'CONFLICT_DECLARATION_SUPERSEDED',
      `/${record.id}/${field}`,
      'Only superseded conflict declarations exist for this action.',
      [record.id, assignment.id],
    );
  if (current.length && applicable.length === 0)
    add(
      out,
      'CONFLICT_DECLARATION_INVALID_AT_ACTION_TIME',
      `/${record.id}/${field}`,
      'Conflict declaration was not current at action time.',
      [record.id, assignment.id],
    );
  if (
    applicable.some((declaration) => declaration.status === 'mitigated' && !declaration.mitigation)
  )
    add(
      out,
      'CONFLICT_MITIGATION_REQUIRED',
      `/${record.id}/${field}`,
      'A mitigated conflict declaration requires a supplied mitigation.',
      [record.id, assignment.id],
    );
  if (!applicable.length || applicable.some((c) => c.status === 'unresolved'))
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
  const successors = new Map<string, OapRecord[]>();
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
      if (prior && compareVersion(record.recordVersion, prior.recordVersion) <= 0)
        add(
          out,
          'SUPERSESSION_VERSION_INVALID',
          `/${record.id}/recordVersion`,
          'A successor record version must progress beyond the superseded record version.',
          [record.id, prior.id],
        );
      if (prior && Date.parse(record.createdAt) < Date.parse(prior.createdAt))
        add(
          out,
          'SUPERSESSION_VERSION_INVALID',
          `/${record.id}/createdAt`,
          'A successor cannot predate the superseded record.',
          [record.id, prior.id],
        );
      const list = successors.get(record.supersedes) ?? [];
      list.push(record);
      successors.set(record.supersedes, list);
    }
  for (const [prior, values] of successors)
    if (values.length > 1)
      add(
        out,
        'MULTIPLE_CURRENT_SUCCESSORS',
        '/records',
        `Record ${prior} has more than one successor.`,
        [prior, ...values.map((value) => value.id)],
      );
  for (const start of pkg.records) {
    const visited = new Set<string>();
    let cursor: OapRecord | undefined = start;
    while (cursor?.supersedes) {
      if (visited.has(cursor.id)) {
        add(out, 'SUPERSESSION_CYCLE', `/${start.id}`, 'Supersession graph contains a cycle.', [
          ...visited,
        ]);
        break;
      }
      visited.add(cursor.id);
      cursor = byId.get(cursor.supersedes);
    }
  }
  for (const record of pkg.records) {
    const item = pkg.manifest.inventory.find((entry) => entry.recordId === record.id);
    const expectedStatus = successors.has(record.id) ? 'superseded' : 'current';
    if (
      item?.supersessionStatus !== expectedStatus ||
      item?.supersedesRecordId !== record.supersedes
    )
      add(
        out,
        'SUPERSESSION_INVENTORY_MISMATCH',
        '/manifest/inventory',
        'Inventory supersession status or predecessor link does not match the record graph.',
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
}

function validateChronology(
  pkg: OapPackage,
  byId: Map<string, OapRecord>,
  out: Diagnostic[],
): void {
  const ordered = (
    later: OapRecord,
    laterField: string,
    earlier: OapRecord | undefined,
    earlierField: string,
  ) => {
    if (
      earlier &&
      Date.parse(String(later[laterField])) < Date.parse(String(earlier[earlierField]))
    )
      add(
        out,
        'INVALID_CHRONOLOGY',
        `/${later.id}/${laterField}`,
        `${later.entityType} predates required basis ${earlier.entityType}.`,
        [later.id, earlier.id],
      );
  };
  for (const assessment of pkg.records.filter(
    (record) => record.entityType === 'evidence-sufficiency-assessment',
  ))
    ordered(assessment, 'assessedAt', byId.get(String(assessment.submissionId)), 'submittedAt');
  for (const evaluation of pkg.records.filter(
    (record) => record.entityType === 'outcome-auditor-evaluation',
  ))
    for (const assessmentId of idList(evaluation.assessmentIds))
      ordered(evaluation, 'evaluatedAt', byId.get(assessmentId), 'assessedAt');
  for (const determination of pkg.records.filter(
    (record) => record.entityType === 'outcome-director-determination',
  )) {
    ordered(
      determination,
      'determinedAt',
      byId.get(String(determination.auditorEvaluationId)),
      'evaluatedAt',
    );
    ordered(
      determination,
      'determinedAt',
      byId.get(String(determination.residualRiskDeclarationId)),
      'declaredAt',
    );
  }
  for (const acceptance of pkg.records.filter(
    (record) => record.entityType === 'residual-risk-acceptance',
  )) {
    const determination = pkg.records.find(
      (record) =>
        record.entityType === 'outcome-director-determination' &&
        record.residualRiskDeclarationId === acceptance.declarationId &&
        sameRecordContext(record, acceptance),
    );
    ordered(acceptance, 'acceptedAt', determination, 'determinedAt');
  }
  for (const authorization of pkg.records.filter(
    (record) => record.entityType === 'outcome-authorization',
  ))
    ordered(
      authorization,
      'authorizedAt',
      byId.get(String(authorization.residualRiskAcceptanceId)),
      'acceptedAt',
    );
}

export type AuthorizationEffectiveness =
  | 'effective'
  | 'ineffective_decision'
  | 'ineffective_expired'
  | 'ineffective_withdrawn'
  | 'ineffective_revoked'
  | 'ineffective_superseded';

export function classifyAuthorizationEffectiveness(
  pkg: OapPackage,
  authorizationId: string,
  evaluationTime: string,
): AuthorizationEffectiveness {
  const authorization = pkg.records.find(
    (record) => record.id === authorizationId && record.entityType === 'outcome-authorization',
  );
  if (
    !authorization ||
    !['authorized', 'authorized_with_conditions'].includes(String(authorization.decision))
  )
    return 'ineffective_decision';
  const changes = pkg.records
    .filter(
      (record) =>
        record.entityType === 'authorization-change' &&
        record.authorizationId === authorizationId &&
        Date.parse(String(record.changedAt)) <= Date.parse(evaluationTime),
    )
    .sort(
      (left, right) => Date.parse(String(right.changedAt)) - Date.parse(String(left.changedAt)),
    );
  const terminal = changes.find((change) =>
    ['withdrawn', 'revoked', 'superseded', 'expired'].includes(String(change.changeType)),
  );
  if (terminal) return `ineffective_${String(terminal.changeType)}` as AuthorizationEffectiveness;
  if (Date.parse(evaluationTime) > Date.parse(String(authorization.validTo)))
    return 'ineffective_expired';
  return 'effective';
}

function schemaDiagnostic(error: ErrorObject): Diagnostic {
  const missing = (error.params as { missingProperty?: string }).missingProperty;
  const nonemptyCode =
    error.keyword === 'minItems' && error.instancePath.endsWith('/assessmentIds')
      ? 'INCOMPLETE_ASSESSMENT_COVERAGE'
      : error.keyword === 'minItems' && error.instancePath.endsWith('/evidenceBasisIds')
        ? 'EMPTY_EVIDENCE_BASIS'
        : error.keyword === 'minItems' &&
            error.instancePath.endsWith('/evidencePackageReferenceIds')
          ? 'ASSESSMENT_EVIDENCE_MISMATCH'
          : error.keyword === 'minItems' && error.instancePath.endsWith('/criterionIds')
            ? 'INCOMPLETE_ASSESSMENT_COVERAGE'
            : error.keyword === 'minItems' &&
                error.instancePath.endsWith('/closureEvidencePackageReferenceIds')
              ? 'CONDITION_CLOSURE_EVIDENCE_REQUIRED'
              : undefined;
  const code =
    nonemptyCode ??
    (error.instancePath === '/schemaVersion'
      ? 'UNSUPPORTED_SCHEMA_VERSION'
      : error.instancePath.endsWith('/retrievalReference')
        ? 'UNSAFE_EXTERNAL_REFERENCE'
        : missing === 'recordVersion'
          ? 'MISSING_RECORD_VERSION'
          : missing === 'mitigation'
            ? 'CONFLICT_MITIGATION_REQUIRED'
            : missing &&
                [
                  'ownerRoleAssignmentId',
                  'dueDate',
                  'monitoringRequirements',
                  'escalationRequirements',
                ].includes(missing)
              ? 'CONDITION_INCOMPLETE'
              : 'SCHEMA_INVALID');
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
function idList(value: unknown): string[] {
  return ids(value);
}
function objectList(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value)
    ? value.filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
    : [];
}
function sameRecordContext(left: OapRecord, right?: OapRecord): boolean {
  return (
    !!right &&
    left.projectId === right.projectId &&
    left.outcomeId === right.outcomeId &&
    sameSet(idList(left.boundaryIds), idList(right.boundaryIds))
  );
}
function subset(left: string[], right: string[]): boolean {
  return left.every((value) => right.includes(value));
}
function compareVersion(left: string, right: string): number {
  const parse = (value: string) => value.split('-', 1)[0].split('.').map(Number);
  const a = parse(left);
  const b = parse(right);
  for (let index = 0; index < 3; index++) {
    const difference = (a[index] ?? 0) - (b[index] ?? 0);
    if (difference !== 0) return difference;
  }
  return left.localeCompare(right);
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
