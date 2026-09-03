# Conformance guide

- **OAP Data Conformant:** schema validity, exact inventory, typed references, versions, hash integrity, and the full core semantic rules for an exact snapshot. It does not mean merely “JSON Schema valid.”
- **OAP Exchange Conformant:** lossless identifiers, versions, references, history, qualifications and extensions.
- **OAP Authority-Integrity Conformant:** supplied human acts satisfy role, scope, sequencing, independence and history rules.
- **OAP OCRS-Input Profile Conformant:** Core Conformance passes and an exact OCRS package reference is verified against explicitly supplied OCRS content during the current run.
- **OAP ICxA Profile Conformant:** reserved for an approved complete mapping; not claimed by v0.1.

None proves evidence truth, competence, legal appointment, readiness, professional judgment, human authorization by itself, ICxA certification, or capital entitlement.

`conformance:core` is self-contained. `verify:ocrs -- <path>` is external integration verification. `conformance:ocrs -- <path>` is the only supplied command that combines both; an absent path is a failure and cannot be silently downgraded.
