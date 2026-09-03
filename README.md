# Outcome Assurance Protocol (OAP) v0.1

OAP is a draft, experimental, independently implementable Level 1 exchange protocol for recording the controlled Outcome Assurance process. It represents evidence-package submission, independent Outcome Auditor evaluation, Outcome Director determination and residual-risk acceptance, and human Outcome Authorization without allowing software to perform those human functions.

OAP is separate from OCRS. An exact OCRS package may be referenced as evidence input; an OCRS result is never authorization. The reference implementation validates structure, integrity, authority, sequencing, and contradictions. It does not assess evidence professionally, recommend authorization, accept risk, or authorize an outcome.

This private draft is not legally open for redistribution or vendor implementation until licenses are approved. It does not establish ICxA conformity, certification, competence, legal authority, project readiness, or capital-drawdown entitlement.

## Commands

```sh
npm ci
npm run format:check
npm run lint
npm run build
npm run validate:schemas
npm run validate:valid
npm run validate:invalid
npm run validate:semantic
npm test
npm run conformance:core
npm run verify:ocrs -- C:\path\to\exact-ocrs-package.json
npm run conformance:ocrs -- C:\path\to\exact-ocrs-package.json
npm audit
```

`npm run conformance` is an alias for self-contained Core Conformance. OCRS-Input Profile Conformance requires actual supplied OCRS content and fails when the path is absent. A stored `claimedValidationStatus` never substitutes for that verification.

Supported reference runtimes are Node 22.13+ within Node 22 and Node 24. JSON Schema, the normative specification, canonicalization vectors, diagnostics, and conformance fixtures define the language-neutral contract; TypeScript is only the reference implementation.
