# OAP v0.1 implementation report

Date: 2026-09-03

Status: Draft / Experimental / Not Yet Stable

Repository baseline: `3e6d0f0e56e39b496683ae06e14d27e631712d1a`

Scope: independent Level 1 repository; OCRS unchanged

## Outcome

The final semantic-correction pass is implemented and verified. The private draft contains 30 modular Draft 2020-12 schemas, three draft/provisional profile declarations, a deterministic semantic validator, exact package/inventory hashing, a complete OCRS v0.1 metadata verifier, five canonical scenarios, seven additional valid conformance scenarios, 99 reason-specific invalid fixtures, and 150 tests in five files.

Software validates supplied records only. It has no Outcome Auditor, Outcome Director, Outcome Determination, residual-risk acceptance, Outcome Authorization, withdrawal, or revocation authority. `generationMethod: human_supplied` remains an assertion, not identity, appointment, competence, or signature proof.

## Source and architecture boundaries

ICXA-10000, 10001, 10002, and 10003 Rev 0 were reviewed in full during repository creation. ICXA-10001 and 10002 control requirements; ICXA-10000 controls concepts; ICXA-10003 is informative. The reviewed ICXA-201xx and ICXA-202xx Rev 0 documents remain review-edition sources whose detailed mappings require ICxA verification. Controlled source files are outside this repository and archive.

OAP preserves one exact converging chain: Outcome/OEN -> submission -> current criterion assessments -> human Auditor evaluation; the evaluation and applicable residual-risk declaration must both precede the human Director determination, which precedes human residual-risk acceptance and human Outcome Authorization. Approved sources available to this draft do not settle whether risk declaration must precede or follow Auditor evaluation, so that ordering remains an explicit ICxA decision. Exact project, Outcome, boundary, evidence, assignment, and chronology links are checked throughout.

OCRS remains external Level 2 evidence. OAP does not import its ontology or authority. The OCRS adapter maps `packageSchemaVersion` to the actual OCRS root `schemaVersion`; it does not invent an OCRS package-version concept.

## Corrected audit findings

The validator now rejects:

1. sufficient evaluation with zero assessments — `INCOMPLETE_ASSESSMENT_COVERAGE`;
2. an unassessed submitted criterion — `INCOMPLETE_ASSESSMENT_COVERAGE`;
3. empty evaluation, determination, or authorization bases — `EMPTY_EVIDENCE_BASIS`;
4. assessment without a submitted external package — `ASSESSMENT_EVIDENCE_MISMATCH`;
5. a false OEN-before-generation assertion — `OEN_SEQUENCE_INVALID`;
6. residual-risk boundary/context substitution — `RISK_CONTEXT_MISMATCH`;
7. a nonexistent nested risk owner — `RISK_OWNER_INVALID`;
8. authorization using another Auditor evaluation — `AUTHORIZATION_EVALUATION_MISMATCH`;
9. an unrelated/unlinked authorization condition — `CONDITION_CONTEXT_MISMATCH` and `CONDITION_AUTHORIZATION_LINK_MISMATCH`;
10. an unauthorized and predating authorization change — `AUTHORIZATION_CHANGE_UNAUTHORIZED` and `AUTHORIZATION_CHANGE_CHRONOLOGY_INVALID`;
11. delegation expansion — `DELEGATION_ACTION_EXPANSION` or `DELEGATION_SCOPE_EXPANSION`;
12. a conflict declaration created after the action — `CONFLICT_DECLARATION_INVALID_AT_ACTION_TIME`;
13. supersession cycles — `SUPERSESSION_CYCLE`;
14. manifest/profile declaration disagreement — `PROFILE_DECLARATION_MISMATCH`; and
15. falsified OCRS bindings — the corresponding `EXTERNAL_PROFILE_MISMATCH`, `EXTERNAL_PACKAGE_VERSION_MISMATCH`, `EXTERNAL_PROJECT_MISMATCH`, `EXTERNAL_SUBJECT_MISMATCH`, `EXTERNAL_BOUNDARY_MISMATCH`, `EXTERNAL_PRODUCER_MISMATCH`, `EXTERNAL_QUALIFICATION_MISMATCH`, or `EXTERNAL_EXCLUSION_MISMATCH`.

Additional regression controls cover OEN/external context, exact evaluation and risk chains, condition closure/status, deterministic expiry, delegation links/validity/cycles, conflict mitigation/supersession, record-version progression, multiple successors, required/profile status, source protocol/package identity, canonicalization, creation time, inventory digest, and external supersession.

The final correction pass additionally rejects every causal chronology inversion with `INVALID_CHRONOLOGY`, duplicate declaration-local risk identifiers with `DUPLICATE_RISK_ID`, delegated acts outside the delegation-specific scope with `AUTHORITY_OUT_OF_SCOPE`, a different Director across any positive or negative decision chain with `DIRECTOR_ACTS_NOT_COHERENT`, unrelated condition-closure evidence with `CONDITION_CLOSURE_EVIDENCE_MISMATCH`, and a human actor on a `system_detection` change with `AUTHORIZATION_CHANGE_UNAUTHORIZED`. Invalid fixtures are re-inventoried and rehashed after mutation unless they intentionally test package inventory or content-hash integrity.

A current manifest inventory entry now means the current historical record version, not an effective authorization. Withdrawal and revocation preserve the authorization record while deterministic classification reports `ineffective_withdrawn` or `ineffective_revoked`. The former `WITHDRAWN_AUTHORIZATION_ACTIVE` assumption was retired; contradictory lifecycle chronology remains invalid.

## External OCRS verification

`verifyExternalPackage` checks the supplied OCRS protocol/version, source profile/version, package ID, root schema version, manifest version, declared canonicalization, package content digest, inventory digest, project, subjects, boundaries, producing party, qualifications, exclusions, creation time, and supersession state. The reference's authorization-boundary mapping is checked during Core validation. The verified source was OCRS commit `dab249a1e99706fec8ce74f74297cbb6d1aed4bd`, archive SHA-256 `ad27054849b375d7c00544e63f90f3a0b9120536812b03c030620b87fe6ba2c1`, relative package path `examples/cw-101-reference/rfdc-ready.package.json`, and package content hash `f68b7e5ed934330633919534ea6e074582d1e9b6edf14482efdec8960b5fb7d2`.

`claimedValidationStatus` is stored evidence metadata only. `verify:ocrs` now fails with `EXTERNAL_VALIDATION_NOT_PERFORMED` when no path is supplied. Core Conformance and OCRS integration verification are separate commands; only `conformance:ocrs -- <path>` combines them.

## Proof results

Clean-install proof on Node `v22.19.0`, npm `10.9.3`:

- `npm ci`: 141 packages installed; 142 audited; zero vulnerabilities;
- `npm run format:check`: passed;
- `npm run lint`: passed with zero warnings;
- `npm run build`: passed;
- `npm run validate:schemas`: 30 schemas meta-validated and compiled;
- `npm run validate:valid`: three profiles and 11 valid resolved package/scenario inputs passed;
- `npm run validate:invalid`: all 99 fixtures produced their declared code;
- `npm run validate:semantic`: all 11 valid inputs passed;
- `npm test`: five files, 150 tests passed;
- `npm run conformance:core`: passed;
- `npm run verify:ocrs -- C:\Users\paulc\ocrs-1\examples\cw-101-reference\rfdc-ready.package.json`: passed against actual supplied OCRS content;
- `npm run conformance:ocrs -- C:\Users\paulc\ocrs-1\examples\cw-101-reference\rfdc-ready.package.json`: passed;
- `npm audit`: zero vulnerabilities; and
- `git diff --check`: exit 0; only Git's Windows line-ending notices were emitted.

Node 24 is declared and covered by the pinned CI matrix but was not locally available, so no local Node 24 pass is claimed.

## Canonical and valid scenarios

- A: sufficient evidence and explicit human authorization.
- B: insufficient/stale evidence and explicit withholding; no inferred authorization.
- C: structured conditional authorization with an open linked condition; detail provisional.
- D: changed external package with preserved original basis and reassessment record.
- E: authority conflict; intentionally rejected.
- Additional valid: complete two-criterion assessment, narrower valid delegation, timely mitigated conflict declaration, deterministic expiry after `validTo`, authorized withdrawal, and authorized revocation. Withdrawal/revocation keep the current historical record version but make authorization ineffective.

## Limitations and approval holds

The implementation cannot establish evidence truth, real-world identity, competence, appointment validity, signatures, legal authority, or absence of conflicts. It does not fetch evidence, implement a trust framework, or provide a production API/workflow. External adapters other than OCRS require approved canonicalization mappings.

ICxA/Paul review remains required for exact clause/edition mappings, controlled terminology, the relative sequencing of the risk declaration and Auditor evaluation, pre-existing evidence under the OEN sequence, criterion exclusions, negative decision/risk handling, conditional-authorization detail, lifecycle and delegation policy, profile approval, and certification policy.

Licenses, patent contribution terms, attribution, disclaimers, trademarks, redistribution, official namespace, stewardship/maintainer appointments, public release, certification marks, signing/trust, and privacy policy remain unresolved. The placeholder license grants no redistribution permission.

## Activity confirmation

The OCRS repository remained at `dab249a1e99706fec8ce74f74297cbb6d1aed4bd`. Its pre-existing untracked `ocrs-1.code-workspace` remained present; OAP work did not modify OCRS. No controlled source entered OAP. Nothing was committed, pushed, published, released, deployed, uploaded, or externally messaged. Read-only package installation and audit registry traffic are not publication.
