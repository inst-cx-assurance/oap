# Outcome Assurance Protocol v0.1

Status: Draft / Experimental / Not Yet Stable

The namespace, conformance names, lifecycle policy, and ICxA profile are provisional. Sections labelled **Normative** define draft OAP technical behaviour. A protocol-integrity requirement is normative for this draft only when supported by an ADR. Source mappings remain subject to the approval status recorded in the traceability matrix.

## 1. Introduction — Informative

OAP is a machine-readable Level 1 exchange protocol for preserving the governed Outcome Assurance process. OAP exchanges supplied evidence, evaluations, decisions, authority assertions, and history. It does not perform professional judgment or grant authority.

## 2. Scope — Normative

OAP represents project and Outcome context, Outcome Obligations and Requirements, Outcome Evidence Need (OEN), authorization boundaries, external evidence submissions, sufficiency assessments, Outcome Auditor evaluation, Outcome Director determination, residual-risk declaration and acceptance, Outcome Authorization, controlled conditions, and history.

OAP is independent of OCRS. It is not a Level 2 gate evaluator, project-management system, autonomous authority, risk-acceptance engine, signature system, or capital-drawdown control. OCRS records remain external evidence only.

## 3. Requirement language and authority — Normative

The key words MUST, MUST NOT, REQUIRED, SHALL, SHALL NOT, SHOULD, SHOULD NOT, and MAY are interpreted as described by RFC 2119 and RFC 8174 when capitalized.

Software MAY validate supplied records, compute hashes, detect contradictions, and report deterministic diagnostics. Software MUST NOT act as Outcome Auditor or Outcome Director; make an Outcome Determination; accept residual risk; or issue, withdraw, or revoke Outcome Authorization. `generationMethod: human_supplied` is a supplied assertion and does not prove identity, signature, appointment, competence, or legal authority.

## 4. Controlled terminology — Normative

Outcome, Outcome Obligation, Outcome Requirement, OEN, Outcome Evidence, Outcome Auditor, Outcome Director, residual risk, and Outcome Authorization retain the meanings mapped to ICXA-10000, ICXA-10001, and ICXA-10002:2026 Rev 0. ICXA-10003 is informative and is not an independent source of requirements.

Expiry, withdrawal, revocation, supersession, reassessment, delegation, and conflict-control details are provisional protocol-integrity terms under ADR-0004 where the controlled standards do not settle implementation detail. ICXA-201xx/202xx review-edition details are provisional and MUST NOT be represented as approved Level 1 requirements.

## 5. Data model — Normative

An OAP package contains exactly one Package Manifest and a record array. The record union is:

- Project Context, Outcome Obligation, Outcome, Outcome Requirement, Outcome Criterion, OEN, and Authorization Boundary;
- Party, Human Identity Reference, Authority Scope, Role Assignment, Delegation, and Conflict-of-Interest Declaration;
- External Package Reference, Evidence Submission, Evidence Sufficiency Assessment, and Outcome Auditor Evaluation;
- Residual-Risk Declaration, Outcome Director Determination, Residual-Risk Acceptance, Authorization Condition, Outcome Authorization, and Authorization Change; and
- Controlled Explanation, Profile Declaration, Extension Declaration, and Change Record.

Each record MUST have a globally unique stable identifier, entity type, semantic record version, and unambiguous RFC 3339 timestamp. Unknown properties are rejected. A reference MUST resolve to exactly one record of the required entity type.

Collections declared through `nonEmptyIdArray` MUST contain at least one unique identifier. OEN requirements and criteria, submission criteria and external packages, assessment evidence packages, and human decision evidence bases are nonempty.

## 6. Package and record integrity — Normative

The manifest MUST identify the package, manifest and OAP versions, creation time, producing party, project, Outcomes, authorization boundaries, profiles, exact inventory, qualifications, exclusions, and content hash. Every inventory entry MUST equal a record's identifier, type, and version and MUST accurately state its supersession status and predecessor.

Package records are append-only in meaning. Correction creates a new record version and preserves the prior record. A successor MUST have the same entity type, a later creation time, and a greater semantic record version. Supersession graphs MUST be acyclic. One record MUST NOT have multiple current successors unless a future approved profile explicitly permits branching. Inventory and record supersession links MUST agree.

## 7. Context equality — Normative

Context equality means exact equality of `projectId`, `outcomeId`, and the set of `boundaryIds`. Array order is not significant for set comparisons. Every submission, assessment, evaluation, risk declaration, determination, risk acceptance, authorization, condition, and lifecycle change in one decision chain MUST have equal context.

The referenced Outcome MUST declare every submitted criterion. The OEN MUST belong to that Outcome and authorization boundary. A record from another project, Outcome, boundary, submission, evaluation, or risk chain MUST NOT be substituted because it has the expected entity type.

## 8. Outcome Evidence Need — Normative

An OEN MUST declare nonempty requirement and criterion sets. Under ICXA-10002 clauses 4(e) and 5, the OEN is established before evidence generation for the applicable stage-gate process and before the sufficiency decision. An OAP package claiming this sequence MUST set `determinedBeforeEvidenceGeneration` to `true`.

Where an external package declares `evidenceOrigin: generated_in_response_to_oen` and supplies `evidenceGeneratedAt`, that time MUST NOT predate the OEN record. OAP does not infer evidence-generation time from package creation time. Treatment of pre-existing evidence beyond the supplied origin declaration remains an ICxA interpretation hold; `pre_existing_or_origin_unverified` records do not prove OEN-before-generation conformity.

Failure uses `OEN_SEQUENCE_INVALID`.

## 9. Evidence submission and criterion coverage — Normative

An Evidence Submission MUST identify one OEN, nonempty submitted criteria, and nonempty external package references. Until a controlled exclusion mechanism is approved, its criterion set MUST exactly equal the applicable OEN criterion set. Every criterion MUST also belong to the declared Outcome.

Every submitted criterion MUST have exactly one applicable current Evidence Sufficiency Assessment. Duplicate or contradictory current assessments are invalid; correction requires explicit supersession. Omitted criteria and zero assessments make complete positive coverage impossible.

An assessment MUST share its submission context, reference one submitted criterion, and reference at least one external package contained in that submission. Its evidence package set MUST be a subset of the submission set.

## 10. Evidence sufficiency and admissibility — Normative

Each current assessment separately records admissibility, sufficiency, credibility, relevance, currency, rationale, Auditor assignment, time, and evidence-package basis. These are supplied human assessment assertions. Validation does not establish their truth.

An Outcome Auditor Evaluation MUST reference the exact complete set of current assessments for its submission and MUST include those assessments and all submitted external packages in its nonempty evidence basis.

The deterministic consistency rule is:

1. `evidence_sufficient` only when coverage is complete and every current assessment is admissible, sufficient, credible, relevant, and current;
2. `evidence_insufficient` when any current assessment is inadmissible, insufficient, not credible, not relevant, or stale; and
3. `indeterminate` when no assessment exists or supplied assessment state cannot support either preceding result.

Omitted or empty assessment collections MUST NOT yield `evidence_sufficient`. Positive, negative, and indeterminate conclusions are consistency checks on supplied human records, not automated professional evaluations.

## 11. Outcome Auditor evaluation — Normative

An evaluation MUST be `human_supplied` and identify the human Auditor role assignment, exact submission, context, assessment set, nonempty evidence basis, evaluation time, conclusion, rationale, and qualifications. The Auditor assignment MUST be valid at the action time, cover the exact context, permit `evaluate_evidence`, and have a current resolved conflict declaration.

The Auditor MUST be distinct from the evidence submitter and Outcome Director as required by the separation rules. The reference implementation validates supplied identity references and cannot prove real-world independence.

## 12. One coherent decision chain — Normative

The exact linked chain is:

```text
Outcome and OEN
→ evidence submission
→ sufficiency assessments
→ Outcome Auditor evaluation
                         ↘
residual-risk declaration → Outcome Director determination
→ residual-risk acceptance
→ Outcome Authorization
→ authorization conditions or lifecycle changes
```

The submission MUST precede or equal each assessment; every assessment used by an evaluation MUST precede or equal that evaluation; both the evaluation and applicable residual-risk declaration MUST precede or equal determination; determination MUST precede or equal acceptance; and acceptance MUST precede or equal authorization. Draft v0.1 does not impose an order between Auditor evaluation and risk declaration because that interpretation is awaiting ICxA approval.

The determination MUST reference the exact evaluation and the risk declaration for that evaluation's submission. Its nonempty evidence basis MUST include the submission, evaluation, and all external packages in the submission.

The authorization's `auditorEvaluationId` MUST equal the evaluation used by its determination. Its residual-risk acceptance MUST accept the exact declaration used by the determination. The authorization evidence basis MUST include the submission, evaluation, residual-risk declaration, determination, acceptance, and all submitted external packages.

The determination, acceptance, and authorization MUST use the same valid Outcome Director assignment for every positive, negative, withheld, or deferred chain. Completeness never forces a positive human decision.

## 13. Residual-risk integrity — Normative

A required Residual-Risk Declaration MUST contain at least one risk item. Every `riskId` MUST be unique within that declaration. Each item MUST include a risk identifier, description, consequence, uncertainty, treatment, and an existing owner Party whose type is `person` or `organization`.

Declaration and acceptance remain distinct records. Acceptance MUST reference the exact current declaration used by the determination and MUST have equal context. A superseded, unrelated, or substituted declaration MUST NOT support authorization. These checks do not prove the adequacy or truth of the risk assessment.

## 14. Outcome Director determination and authorization — Normative

Outcome Director Determination, Residual-Risk Acceptance, and Outcome Authorization are explicitly supplied human acts. The Director assignment MUST be a human `outcome_director`, be valid at each action time, cover the exact project/Outcome/boundaries, hold the required permission, have valid delegation when delegated, and have a current resolved conflict declaration.

A positive authorization requires a determination supporting authorization, an `evidence_sufficient` Auditor conclusion, and acceptance of the exact declared residual risk. A withheld, deferred, or not-authorized record MUST preserve a coherent negative or deferred basis and MUST NOT be interpreted as accepted risk or positive authorization.

Authorization MUST state decision, scope, rationale, time, validity, condition IDs, and nonempty evidence basis. `authorizedAt` MUST NOT follow `validTo`, and `validFrom` MUST NOT follow `validTo`.

## 15. Authorization conditions — Normative protocol integrity; source detail provisional

Only `authorized_with_conditions` may reference Authorization Conditions, and it MUST reference at least one current open condition. Other authorization decisions MUST have an empty condition set.

Every referenced condition MUST point back to that authorization; every condition backlink MUST be reciprocated. Condition and authorization contexts MUST be equal. A condition MUST cite its authorization, determination, or residual-risk declaration as a source.

A condition records a valid condition-owner role assignment, required action, due date, monitoring, escalation, verification criteria, status, and closure-evidence references. The due date MUST NOT predate authorization. `verified_closed` requires nonempty, current, integrity-bound external closure evidence whose subjects and external boundaries exactly match the condition's Authorization Boundary mappings. Unrelated external evidence MUST NOT close a condition. Cancelled or superseded conditions MUST NOT remain active authorization requirements.

The detailed owner/due-date/monitoring pattern informed by ICXA-20101 review material remains provisional and is not asserted as an approved ICxA Level 1 mapping.

## 16. Authority scopes, delegation, and conflicts — Normative protocol integrity

An action-bearing role assignment MUST identify a person, role, authority scope, appointment basis, competence basis, and validity interval. The scope MUST include the action, project, Outcome, and every authorization boundary at the action time.

A delegation MUST link two human assignments of the same role. Projects, Outcomes, boundaries, actions, and validity in `delegation.authorityScopeId` MUST be subsets of both the delegator's authority and the delegate assignment's authority. The delegation and delegate assignment MUST link reciprocally. Every delegated action MUST satisfy both the delegate assignment scope and the delegation's separate authority scope. A broader delegate appointment cannot expand the particular delegation. Delegation MUST be active at action time, MUST NOT bypass Auditor/Director separation, and MUST NOT contain a chain cycle. Appointment authority and delegated authority remain distinguishable. Policy beyond these neutral non-expansion controls is open.

A supporting conflict declaration MUST belong to the acting assignment, exist no later than the action, be current and not superseded, and not be unresolved. `mitigated` requires a nonempty mitigation. A later declaration MUST NOT retroactively validate an earlier action. Validation cannot prove the absence of a real-world conflict.

## 17. Authorization lifecycle — Normative protocol integrity; policy open

Authorization Change distinguishes a human authority act from system detection:

- withdrawal, revocation, and supersession require `actorType: human_authority`, `generationMethod: human_supplied`, and a valid authorized Director assignment;
- deterministic expiry MAY be recorded as `system_detection`/`system_capture` only at or after `validTo`; and
- reassessment triggers MAY be captured by a system without making a human authorization decision.

A `system_detection` change MUST NOT contain `changedByRoleAssignmentId`; a human authority event MUST contain it.

Every change MUST equal the affected authorization context, follow the authorization chronologically, and state a coherent basis. Supersession MUST identify a replacement authorization that reciprocally supersedes the prior authorization. Manifest inventory currency describes the current version of a historical authorization record; it does not describe authorization effectiveness. A current record version may therefore be deterministically `ineffective_withdrawn`, `ineffective_revoked`, `ineffective_expired`, or `ineffective_superseded`. Exact lifecycle authority policy remains open in OD-007.

## 18. External package references — Normative technical interface

An External Package Reference MUST bind the source protocol and version, source profile and version, package identifier, source root schema version, manifest version, content hash, canonicalization method, inventory digest, project identifier, subjects, boundaries, creation time, producer, qualifications, exclusions, retrieval/custody statement, claimed validation status, and supersession status.

`packageSchemaVersion` denotes the supplied source package's root `schemaVersion`; OAP does not invent an OCRS package version where OCRS has none. `claimedValidationStatus` stores a source assertion only. It MUST NOT be treated as verification performed during the current run.

Core validation checks the reference's structure and its mapping to the OAP Authorization Boundary. Content verification is a separate operation requiring explicitly supplied source bytes. No external content is fetched by default.

## 19. OCRS interoperability profile — Normative technical adapter

For OCRS v0.1, verification compares all applicable bindings with the supplied OCRS root and manifest: protocol/OCRS version, profile, package ID, root schema version, manifest version, canonicalization, content hash, inventory digest, project, subjects, boundaries, producer, qualifications, exclusions, creation time, and current supersession status.

OAP Authorization Boundary `subjectIds` and `externalBoundaryIds` MUST equal the external reference's subject and boundary identifiers. Any changed digest, version, inventory, context, qualification, or exclusion requires a new Evidence Submission or controlled reassessment.

An OCRS `satisfied` result, Review, Recommendation, readiness decision, Handover, or Transfer of Operational Control is Level 2 evidence only. None establishes Level 1 sufficiency, determination, residual-risk acceptance, or Outcome Authorization.

## 20. Canonicalization and hashing — Normative

OAP Canonical JSON v0.1 operates as follows:

1. null, Boolean, number, and string values use ECMAScript `JSON.stringify` representation;
2. arrays preserve order and concatenate canonical member representations with commas inside `[` and `]`;
3. object keys are sorted in ascending UTF-16 code-unit order;
4. object members concatenate JSON-stringified keys, `:`, and canonical values with commas inside `{` and `}`;
5. no insignificant whitespace or byte-order mark is emitted;
6. UTF-8 encodes the canonical string; and
7. package hashing removes only `manifest.contentHash` before canonicalization and applies SHA-256.

SHA-256 values MUST be 64 lowercase hexadecimal characters. SHA-512 evidence bindings MUST be 128 lowercase hexadecimal characters. Test vectors in `conformance/hash-test-vectors.json` are normative examples. Hashing detects content change only; it does not provide identity authentication, signatures, trust, encryption, or non-repudiation.

## 21. Diagnostics — Normative

A conforming validator MUST fail a package when any required structural or semantic rule fails and SHOULD return all independently detectable failures. Diagnostics MUST have a stable code, path, message, and supporting record IDs.

Required codes include the codes exercised by `conformance/invalid`, including `INVALID_CHRONOLOGY`, `DUPLICATE_RISK_ID`, `INCOMPLETE_ASSESSMENT_COVERAGE`, `EMPTY_EVIDENCE_BASIS`, `ASSESSMENT_EVIDENCE_MISMATCH`, `ASSESSMENT_CONTEXT_MISMATCH`, `EVALUATION_BASIS_MISMATCH`, `OEN_SEQUENCE_INVALID`, `DECISION_CHAIN_MISMATCH`, `RISK_CONTEXT_MISMATCH`, `RISK_DECLARATION_MISMATCH`, `AUTHORIZATION_EVALUATION_MISMATCH`, `AUTHORIZATION_ACCEPTANCE_MISMATCH`, `CONDITION_CLOSURE_EVIDENCE_MISMATCH`, and the remaining lifecycle, delegation, conflict, supersession, profile, and external-binding diagnostic families.

Implementations MAY provide more diagnostics, but MUST NOT report conformance when a required diagnostic condition exists.

## 22. Profiles and extensions — Normative

Manifest profile entries MUST resolve to Profile Declaration records with identical profile ID, profile version, and OAP version. Required behaviour profiles MUST be declared. A provisional or verification-required profile MUST NOT be represented as approved.

Extensions MUST NOT use reserved `oap` or `icxa` namespaces, redefine controlled terms, weaken authority or independence, automate human decisions, or reinterpret Level 2 readiness as Outcome Authorization. A source-meaning change requires a new profile version.

## 23. Conformance — Normative

The provisional categories are:

- **OAP Data Conformant:** schemas, exact inventory, references, versions, integrity, and all core semantic rules pass for the supplied snapshot.
- **OAP Exchange Conformant:** Data Conformance plus lossless exchange of identities, history, profiles, qualifications, and extensions.
- **OAP Authority-Integrity Conformant:** supplied human acts satisfy the role, scope, sequence, delegation, conflict, and separation rules.
- **OAP OCRS-Input Profile Conformant:** the OAP package passes Core Conformance and its OCRS reference is verified against explicitly supplied OCRS content.
- **OAP ICxA Profile Conformant:** reserved for a future approved complete profile; not claimed by v0.1.

`npm run conformance:core` is self-contained. `npm run verify:ocrs -- <path>` requires source content and fails if the path is absent. `npm run conformance:ocrs -- <path>` combines both. A self-declared `verified` status cannot satisfy the external verification category.

No technical category proves a person's competence, appointment outside the supplied records, evidence truth, professional judgment, project readiness, Outcome Authorization by itself, ICxA certification, legal authority, or entitlement to capital drawdown.

## 24. Security and implementation limits — Normative where testable

Validators MUST reject unsafe local retrieval references, duplicate IDs, broken and wrong-type references, unsupported versions, digest-length defects, inventory substitution, silent overwrite, prohibited extension abuse, and software-generated human authority records. Implementations SHOULD enforce input byte, record-count, nesting-depth, and execution-time limits.

External content MUST NOT be fetched by default. Credentials, private keys, controlled standards, and unnecessary personal information MUST NOT be embedded in exchange packages. Signature and trust frameworks are out of scope and remain an open governance decision.

## 25. Language-neutral implementation — Informative

JSON Schema Draft 2020-12, the rules in this specification, canonicalization test vectors, named diagnostics, and conformance fixtures are the implementation contract. TypeScript is one reference implementation and is not a normative source. Independent implementations may use any language capable of reproducing these rules.
