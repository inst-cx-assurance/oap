# Validation guide

`npm run validate:schemas` meta-validates and compiles all Draft 2020-12 schemas. `validate:valid` resolves the canonical and valid conformance scenarios. `validate:invalid` requires every counterexample's named diagnostic. Except for fixtures explicitly testing package hash or inventory corruption, invalid mutations are rebuilt with an exact inventory and content hash before validation so a semantic test does not pass merely because its mutation broke package integrity. `validate:semantic` applies schema, reference, inventory, integrity, context, complete causal chronology, assessment, decision-chain, risk-ID, authority, delegated-scope, conflict, condition-closure mapping, lifecycle effectiveness, profile, and supersession checks to complete resolved packages.

`npm run conformance:core` runs the reproducible repository-only suite. `npm run conformance` is its compatibility alias. Neither command claims that external OCRS bytes were verified.

`npm run verify:ocrs -- <exact-path>` compares the canonical OAP reference against explicitly supplied OCRS content. It checks the protocol/profile, package and schema/manifest versions, content and inventory digests, project, subjects, boundaries, producer, qualifications, exclusions, creation time, canonicalization, and supersession state. It fails with `EXTERNAL_VALIDATION_NOT_PERFORMED` when no path is supplied. `npm run conformance:ocrs -- <exact-path>` combines Core Conformance and that content verification.

No command fetches evidence. A stored `claimedValidationStatus` is an assertion, not proof that this validation run performed verification.
