# OAP v0.1 audit pack

Audit date: 2026-09-03

Release status: Private draft / experimental / not stable

Baseline commit: `3e6d0f0e56e39b496683ae06e14d27e631712d1a`

## Audit conclusion

The focused hardening and final correction passes close the independent semantic counterexamples. JSON Schema validity alone is insufficient: Core Conformance also enforces full OEN criterion coverage, assessment/package relationships, exact context and causal chronology, declaration-local risk identity, condition backlinks and closure-evidence mapping, authorization effectiveness, lifecycle authority, delegation-specific scope, timely conflicts, complete supersession graphs, profile agreement, and stable diagnostics.

The human authority boundary remains intact. OAP does not claim ICxA Profile Conformance, certification, legal openness, evidence truth, professional judgment, or legal authority.

## Inventory summary

| Artifact                               | Count / status                        |
| -------------------------------------- | ------------------------------------- |
| Draft 2020-12 schemas                  | 30                                    |
| Profiles                               | 3: core, OCRS input, provisional ICxA |
| Canonical scenarios                    | 5: four valid, one expected invalid   |
| Additional valid conformance scenarios | 7                                     |
| Reason-specific invalid fixtures       | 99                                    |
| Test files / tests                     | 5 / 150                               |
| Supported Node lines                   | 22.13+ within 22; 24                  |
| Locally executed Node                  | 22.19.0 only                          |
| CI permissions                         | `contents: read`                      |

## Proof sequence and observed results

```text
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
npm run verify:ocrs -- C:\Users\paulc\ocrs-1\examples\cw-101-reference\rfdc-ready.package.json
npm run conformance:ocrs -- C:\Users\paulc\ocrs-1\examples\cw-101-reference\rfdc-ready.package.json
npm audit
git diff --check
```

All commands passed on Node 22.19.0. `npm ci` installed 141 and audited 142 packages. Thirty schemas compiled, three profiles and 11 valid inputs passed, all 99 invalid fixtures produced their expected diagnostic, all 11 valid inputs passed semantic validation, and five test files containing 150 tests passed. Dependency audit found zero vulnerabilities. `git diff --check` exited 0 with Windows line-ending notices only.

The supplied OCRS package passed verification for protocol/profile, package/root/manifest versions, canonicalization, package and inventory digests, project, subject, boundary, producer, qualifications, exclusions, creation time, and supersession. The reproducibility tuple is OCRS commit `dab249a1e99706fec8ce74f74297cbb6d1aed4bd`, OCRS audit-archive SHA-256 `ad27054849b375d7c00544e63f90f3a0b9120536812b03c030620b87fe6ba2c1`, package content hash `f68b7e5ed934330633919534ea6e074582d1e9b6edf14482efdec8960b5fb7d2`, and relative path `examples/cw-101-reference/rfdc-ready.package.json`. Running `npm run verify:ocrs` without a path failed as designed with `EXTERNAL_VALIDATION_NOT_PERFORMED`.

Node 24 was not installed locally. The CI workflow tests Node 22 and Node 24, pins checkout/setup-node to full commit SHAs with release comments, uses `contents: read`, and performs clean installation, Core Conformance, build (inside Core Conformance), and dependency audit. CI does not claim real OCRS verification because no controlled external package is copied into OAP.

## Boundary and security verification

- OCRS remained at commit `dab249a1e99706fec8ce74f74297cbb6d1aed4bd`; its pre-existing untracked `ocrs-1.code-workspace` remained unchanged.
- OAP contains no OCRS ontology copy and no automatic conversion of a Level 2 result into a Level 1 record.
- Human evaluation, determination, acceptance, authorization, withdrawal, and revocation remain supplied records.
- Withdrawal and revocation preserve the current historical authorization record version while making it deterministically ineffective; record currency is not effectiveness.
- Controlled ICxA source files, credentials, private keys, and secrets were not found in repository-content scans.
- Hashing is described only as change detection, never signature, identity authentication, or non-repudiation.
- ICxA profile status remains provisional/verification-required and is not claimed as conformant.

## Archive procedure

`scripts/create-audit-archive.ps1` creates `oap-v0.1-audit.zip` with forward-slash entry names and regular-file mode `0644`. It excludes `.git`, `node_modules`, `dist`, coverage, caches, temporary files, controlled sources, credentials/key forms, logs, and every ZIP (including nested archives). The final entry count, byte size, and SHA-256 are reported outside the archive after it is closed; embedding its final digest inside itself is impossible without changing the digest.

## Audit holds

See `docs/open-decisions.md` and `IMPLEMENTATION-REPORT.md`. Controlled source wording, detailed review-edition mappings, licenses, governance appointments, namespace, profile approval, certification, signatures/trust, delegation/lifecycle policy, and public release remain unresolved.
