# Validation guide

`npm run validate:schemas` validates and compiles all schemas. `validate:valid` resolves all controlled scenarios. `validate:invalid` requires each counterexample's named diagnostic. `validate:semantic` checks complete resolved packages. `verify:ocrs` verifies that the canonical OCRS input reference is fully bound without importing authority. `npm run conformance` runs formatting, lint, build, schemas, packages, semantics, tests, and the OCRS boundary check.
