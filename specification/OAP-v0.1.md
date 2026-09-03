# Outcome Assurance Protocol v0.1

Status: Draft / Experimental / Not Yet Stable. Namespace and conformance names are provisional. Sections marked **Normative** define draft OAP technical behavior; source claims remain limited to confirmed clauses. Examples and explanatory notes are **Informative**.

## 1. Introduction — Informative

OAP is a machine-readable Level 1 exchange protocol for preserving the governed Outcome Assurance process. It carries supplied human records; it does not perform professional judgment.

## 2. Scope — Normative

OAP represents outcome context, outcome obligations and requirements, Outcome Evidence Need (OEN), authorization boundaries, external evidence submissions, independent evaluation, Outcome Director acts, residual risk, authorization and history. It is not OCRS, a Level 2 evaluator, project software, an autonomous authority, or a capital-drawdown control.

## 3. Design principles — Normative

Records MUST remain versioned, typed, traceable, context-consistent, integrity-checkable, and append-only in meaning. Evidence production, Auditor evaluation, Director determination, risk acceptance, and authorization MUST remain separately identifiable. Software MUST NOT synthesize a human authority record.

## 4. Controlled terminology — Normative

Outcome, Outcome Obligation, Outcome Requirement, OEN, Outcome Evidence, Outcome Auditor, Outcome Director, residual risk, and Outcome Authorization retain their meanings from ICXA-10000/10001/10002:2026 Rev 0. Protocol lifecycle labels for expiry, withdrawal, revocation, supersession, and reassessment are provisional integrity terms under ADR-0004.

## 5. Ontology — Normative

The normalized entities are Package Manifest, Project Context, Outcome Obligation, Outcome, Outcome Requirement, Outcome Criterion, OEN, Authorization Boundary, Party, Human Identity Reference, Authority Scope, Role Assignment, Delegation, Conflict-of-Interest Declaration, External Package Reference, Evidence Submission, Sufficiency Assessment, Outcome Auditor Evaluation, Outcome Director Determination, Residual-Risk Declaration, Residual-Risk Acceptance, Authorization Condition, Outcome Authorization, Authorization Change, Controlled Explanation, Profile Declaration, Extension Declaration, and Change Record.

## 6. State model — Normative

The process distinguishes not submitted, submitted, under review, insufficient or indeterminate, evaluated, determined, authorized, authorized with conditions, withheld, deferred, not authorized, expired, withdrawn/revoked, and superseded. A later record MUST have its required earlier basis, but completeness MUST NOT force a positive human decision.

## 7. Authority and separation of duties — Normative

The Outcome Auditor MUST be independent of delivery and the Outcome Director. Delivery, evaluation, and authorization MUST remain distinct. The Outcome Director is the human accountable for the determination, acceptance of residual risk, and Outcome Authorization. Linked records for these acts MUST use the same valid Director assignment. Role, time, scope, permission, appointment/competence basis, delegation, and conflict declarations MUST validate.

## 8. Outcome and authorization boundary — Normative

Every decision chain MUST use one declared project, outcome, subjects, and authorization boundary. Broader project status MUST NOT expand the authorized scope. Boundary changes require controlled reassessment.

## 9. External evidence-package submission — Normative

An external reference MUST bind protocol and profile versions, package and manifest versions, content digest, canonicalization, inventory digest, project, subjects, boundaries, creation time, producer, qualifications, exclusions, retrieval/custody, validation, and supersession. OAP MUST NOT silently copy or substitute external records.

## 10. Evidence sufficiency and admissibility — Normative

Evidence owners submit evidence. A supplied human Outcome Auditor evaluates admissibility, sufficiency, credibility, relevance, and currency against the OEN. Record count, schema validity, or an OCRS `satisfied` result MUST NOT establish Level 1 sufficiency.

## 11. Outcome Auditor evaluation — Normative

An evaluation MUST identify the human assignment, time, exact submission and evidence packages, assessments, conclusion, rationale, qualifications, outcome and boundaries. Software validates this record but MUST NOT create or act as the Auditor.

## 12. Outcome Director determination — Normative

The determination MUST identify the human Director assignment, independent Auditor evaluation, evidence basis, declared residual risk, rationale, outcome and boundaries. A positive determination requires a sufficient Auditor conclusion but remains human judgment.

## 13. Residual-risk declaration and acceptance — Normative

The declaration records decision-relevant risks, consequence, uncertainty, treatment, and owner. Only the applicable Outcome Director assignment may accept the residual risk for Outcome Authorization. The separate record is a traceability representation of the same Director function, not a new authority role.

## 14. Outcome Authorization — Normative

Outcome Authorization MUST be an explicitly supplied human act by the same authorized Director assignment that made the linked determination and risk acceptance. It identifies decision, scope, evidence, OEN basis, rationale, validity, conditions, date, and history. Withholding, deferral, or non-authorization are valid recorded outcomes.

## 15. Conditions and conditional authorization — Normative

Conditional authorization is supported because ICXA-10001 clause 8.3 requires conditions/limitations to be recorded and ICXA-20101 clause 6.4 supplies the owner/due-date/verification pattern. Every condition has an owner, action, due date, monitoring, escalation, verification, status, source, and closure evidence linkage. Safety or regulatory limits cannot be weakened by extension.

## 16. Validity, expiry, withholding, withdrawal and supersession — Normative protocol integrity; ICxA approval open

Validity intervals are explicit. Correction never overwrites the prior act. Withdrawal, revocation, expiry, supersession, and reassessment records preserve the original decision basis. Exact governance triggers and labels require approval under OD-007.

## 17. OCRS interoperability profile — Normative technical interface

OAP references an exact OCRS versioned, integrity-checkable snapshot. It does not import OCRS ontology or authority. Any changed digest/version/inventory requires a new submission or controlled reassessment. RFDC, ORC, AOCR, IOC, FOC, Readiness Reviews, Recommendations, readiness decisions, System Handover, and Transfer of Operational Control remain Level 2 evidence and never become Outcome Authorization automatically.

## 18. Conformance — Normative

Provisional categories are OAP Data Conformant, Exchange Conformant, Authority-Integrity Conformant, OCRS-Input Profile Conformant, and ICxA Profile Conformant. This draft does not establish the last category. Technical conformance does not prove competence, external appointment validity, evidence truth, judgment, readiness, authorization by itself, certification, legal authority, or capital entitlement.

## 19. Security and integrity — Normative where testable

OAP Canonical JSON v0.1 recursively sorts object keys by ascending UTF-16 code-unit order, preserves array order, uses JSON serialization without whitespace, encodes UTF-8 without BOM, removes only `manifest.contentHash` before package hashing, and applies SHA-256. SHA-256 and SHA-512 values are respectively 64 and 128 lowercase hexadecimal characters. No external fetching occurs by default. Hashing detects content change only; it is not authentication, signature, identity proof, or non-repudiation.

## 20. Extension and profile model — Normative

Profiles and extensions are separately versioned. Extensions MUST NOT use reserved `oap` or `icxa` namespaces, redefine controlled terms, weaken authority or independence, automate authorization, or reinterpret Level 2 readiness as Outcome Authorization. A source-meaning change requires a new profile version.
