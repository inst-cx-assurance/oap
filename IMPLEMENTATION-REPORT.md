# OAP implementation verification

OAP Core Conformance validates 30 schemas, 99 negative fixtures, and the canonical and valid scenarios. The regression suite covers schema-stage partial reporting, selected-record diagnostics, stale evidence, appointment separation, delegation history, boundary ordering, semantic versions, action chronology, historical evaluation basis, and external digest algorithms. External OCRS verification uses an explicitly supplied package path; the CI workflow pins the companion repository.

Policy-sensitive limitations remain in multi-boundary evidence scope, lifecycle permissions, conflict-declaration coverage, and condition closure/inheritance. Passing tests do not close those governance questions.

See [verification status](docs/verification-status.md), [validation guide](docs/validation-guide.md), and [conformance guide](docs/conformance-guide.md). Test counts and command outcomes are recorded by the associated CI run, rather than treated as permanent security or conformance guarantees.

The implementation does not authenticate evidence truth, real-world identity, professional competence, signatures, or legal authority. Normative specification and licensing changes require explicit review.
