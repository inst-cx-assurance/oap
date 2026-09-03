# OCRS-to-OAP interoperability

OAP consumes only an integrity-bound external reference containing OCRS protocol/profile versions, package identity, OCRS root `schemaVersion` (represented as `packageSchemaVersion`), manifest version, canonical content hash, inventory digest, project, subjects, boundaries, producer, custody, qualifications, exclusions, claimed validation status, creation time, and supersession. OCRS v0.1 has no separate source `packageVersion`, so OAP does not invent one. OAP does not copy OCRS records as authoritative OAP records and OCRS requires no OAP code.

Any OCRS `satisfied` result, Review, Recommendation, readiness decision, Handover or Transfer of Operational Control is evidence input only. A changed OCRS digest, version or inventory requires a new submission or controlled reassessment.

The OAP Authorization Boundary provides the explicit mapping: its `subjectIds` and `externalBoundaryIds` must equal those bound in the external reference. Content verification compares every declared binding with supplied OCRS bytes. `claimedValidationStatus` records a claim only; verification performed during the current run requires `verify:ocrs -- <path>` and produces technical diagnostics, not a human or ICxA approval record.
