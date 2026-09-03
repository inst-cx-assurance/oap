# OAP v0.1 audit pack

Audit date: 2026-09-02  
Release status: Private draft / experimental / not stable

## Audit conclusion

The draft is structurally and semantically testable and preserves the mandatory human authority boundary. It does not claim OAP ICxA Profile Conformance, certification, legal openness, evidence truth, professional judgment, or legal authority.

## Inventory summary

| Artifact                         | Count / status                        |
| -------------------------------- | ------------------------------------- |
| Draft 2020-12 schemas            | 30                                    |
| Profiles                         | 3: core, OCRS input, provisional ICxA |
| Canonical scenarios              | 5: four valid, one expected invalid   |
| Reason-specific invalid fixtures | 43                                    |
| Test files / tests               | 4 / 57                                |
| Supported Node lines             | 22.13+ within 22; 24                  |
| CI permissions                   | `contents: read`                      |

## Required proof sequence

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
npm run verify:ocrs -- ..\ocrs-1\examples\cw-101-reference\rfdc-ready.package.json
npm audit
npm run conformance
git diff --check
```

## Observed proof results

All required commands passed on 2026-09-02 after `npm ci`. The observed totals were 30 compiled schemas, three valid profiles, five valid package/scenario inputs, 43 expected-invalid fixtures, four passing test files, 57 passing tests, and zero dependency vulnerabilities. Verification against the supplied OCRS CW-101 package confirmed its declared identity, canonical content hash, and inventory digest. `npm run conformance` passed end to end.

The OCRS source repository remained at commit `dab249a1e99706fec8ce74f74297cbb6d1aed4bd` with a clean worktree and empty-diff SHA-256 `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`.

## Security review controls

The archive excludes source standards, `.git`, generated dependencies, build and coverage output, caches, logs, credentials, keys, temporary files and nested archives. External URLs are not fetched. Hashes provide change detection only, not signature, identity, authentication or non-repudiation.

## Archive result

The portable archive is created only after this report is finalized. Its entry count, byte size, and SHA-256 are therefore reported in the completion report outside the archive; embedding the archive's own final digest here would change that digest. The archive script verifies forward-slash names, portable readable permissions, and the stated exclusions before reporting success.

## Audit holds

See `docs/open-decisions.md` and `IMPLEMENTATION-REPORT.md`. Controlled source files remain outside the repository. OAP technical conformance does not establish conformity with or certification against an ICxA standard.
