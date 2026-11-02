# Open decisions requiring ICxA governance approval

## Controlled-source and normative mapping

- Confirm the publication status and approved use of the reviewed ICXA-20100–20103 Rev 0 and ICXA-20200–20203 Rev 0 review editions.
- Audit every clause mapping, exact controlled term, status label, refusal/deferral terminology, authorization validity rule, conditional-authorization constraint, and re-evaluation trigger.
- Resolve the apparent ICXA-20202 clause 3.1 label/definition mismatch in the controlled source; OAP does not rely on or reproduce it.
- Approve whether separate linked determination, residual-risk acceptance, and authorization records are the preferred digital representation of the single Outcome Director function.
- Confirm how ICXA-10002's OEN-before-evidence-generation rule applies to evidence that pre-existed the OEN. Draft v0.1 enforces the supplied affirmative sequence and compares an explicit `evidenceGeneratedAt` only for evidence declared generated in response to the OEN; it does not equate package creation with evidence generation.
- Approve whether an explicit criterion-exclusion mechanism is permitted. Until approval, a submission must exactly cover every applicable OEN criterion.
- Confirm whether negative Outcome Authorization records always require a residual-risk acceptance record. Draft v0.1 retains the existing linked record and permits a `not_accepted` decision without representing risk as accepted.
- Confirm whether the applicable residual-risk declaration must follow the Outcome Auditor evaluation, precede it, or may be prepared independently before both converge at Director determination. Draft v0.1 requires both records to precede determination but imposes no unapproved ordering between them; canonical Scenario A therefore remains valid.

## Governance and legal

- Review proposed changes to published licensing terms, patent contribution policy, attribution, disclaimers, trademarks, namespace, release governance, profile approval, certification rules, and vendor redistribution terms.
- Formally appoint the steward, namespace custodian, maintainers, profile approvers, and conformance-suite authority.
- Approve or replace provisional conformance category names.

## Integrity and trust

- Approve canonicalization and hash policy, record-retention policy, identity assurance, electronic signature and trust framework, delegation policy, conflict-declaration policy, replay policy, and privacy requirements.
- Approve exact expiry, withdrawal, revocation, supersession and reassessment semantics.
- Approve delegation scope, permitted chain depth, withdrawal effects, conflict-declaration validity/review intervals, and authorization-condition closure policy. Draft controls prevent expansion, cycles, retroactive declarations, and silent replacement without claiming final governance policy.
- Review the draft compatibility rename from ambiguous external `packageVersion` to `packageSchemaVersion`, which maps to OCRS v0.1 root `schemaVersion`; OCRS has no separate package-version field.

Until resolved, this repository is a public experimental technical draft and does not claim OAP ICxA Profile Conformance or legal openness.
