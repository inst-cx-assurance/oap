# OAP verification pack

Status: public experimental implementation; no certification or ICxA Profile Conformance is claimed.

OAP Core Conformance validates 30 schemas, 99 negative fixtures, and the canonical and valid scenarios. The regression suite covers schema-stage partial reporting, selected-record diagnostics, stale evidence, appointment separation, delegation history, boundary ordering, semantic versions, action chronology, historical evaluation basis, and external digest algorithms. External OCRS verification uses an explicitly supplied package path; the CI workflow pins the companion repository.

Policy-sensitive limitations remain in multi-boundary evidence scope, lifecycle permissions, conflict-declaration coverage, and condition closure/inheritance. Passing tests do not close those governance questions.

## Reproduction

Run npm ci, npm run conformance:core, and npm audit on Node.js 22 and 24. Conformance includes formatting, lint, TypeScript build, schema and fixture validation, and regression tests.

See [verification status](docs/verification-status.md) for the complete finding register and approval holds. Current licensing is defined by LICENSE and specification/LICENSE.
