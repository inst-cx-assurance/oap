# Verification status and remaining decisions

Updated 2 November 2026. This register distinguishes implementation corrections from decisions that tests cannot settle. Passing conformance does not mean every finding is resolved. No normative specification or licensing change is included.

| Finding | Status                         | Behavior and remaining action                                                                                                                                       |
| ------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1       | Implemented                    | Schema failures explicitly report that semantic validation was not performed.                                                                                       |
| 2       | Documented enforcement stages  | Structural guards can also be defensive semantic checks. Historical R-rule numbering is not a public coverage count.                                                |
| 3       | Implemented                    | A shared conclusion computation consistently treats stale evidence as insufficient.                                                                                 |
| 4       | Verified                       | Unresolved appointments do not compare as a role conflict.                                                                                                          |
| 5       | Implemented with limitation    | Unused withdrawn/expired delegations are retained; reliance still requires an active delegation. A historical withdrawal-event model remains a governance decision. |
| 6       | Implemented with decision hold | Boundary sets use a stable duplicate key. The current decision-grouping policy is preserved.                                                                        |
| 7       | Verified                       | Semantic prerelease precedence is covered by regression tests.                                                                                                      |
| 8       | Verified                       | Successor timestamps must be strictly later.                                                                                                                        |
| 9       | Decision required              | Choose multi-boundary per-reference, union, or one-boundary scope. Existing equality rules are preserved.                                                           |
| 10      | Decision required              | External subject existence and OAP scope equality have different operands; partial coverage requires policy.                                                        |
| 11      | Implemented                    | SHA-256 and SHA-512 digests are recomputed using the declared algorithm; unsupported/malformed digests fail.                                                        |
| 12      | Decision required              | Supersession/reassessment permission equivalence remains unchanged.                                                                                                 |
| 13      | Documented; decision required  | Current validator checks require declarations for every checked act. Confirm the universal normative coverage.                                                      |
| 14      | Implemented                    | Matching determinations are selected by chronology with deterministic tie ordering.                                                                                 |
| 15      | Implemented                    | Schema diagnostics select the record entityType branch.                                                                                                             |
| 16      | Implemented                    | Historical evaluations use cited assessments; current evaluations require current complete coverage.                                                                |
| 17      | Verified                       | Multiple RFDC gates are rejected explicitly.                                                                                                                        |
| 18      | Decision required              | No dependencies remains indeterminate; no implicit readiness is inferred from absence.                                                                              |
| 19      | Implemented                    | The OAP example is rebound to the current OCRS fixture and CI pins/verifies the companion version.                                                                  |
| 20      | Decision required              | Last-condition closure and successor inheritance remain governed by the current draft rules.                                                                        |
| 21      | Implemented                    | Operational-gate evaluations can support reviews; review and evaluation must identify the same gate.                                                                |
| 22      | Decision required              | Proposed handover acceptance fields remain required by the existing schema. No fabricated acceptance data is recommended.                                           |
| 23      | Partial; decision required     | Pending review cannot satisfy RFDC. Accepted status does not prove reviewer identity or independent authentication.                                                 |
| 24      | Implemented                    | Canonical deep-equality uniqueness avoids pairwise inventory checks; duplicate inventory IDs are rejected. Schemas remain unchanged.                                |
| 25      | Decision required              | Official NCR/stage/evidence mappings require ICxA approval; no classification is inferred solely from labels.                                                       |
| 26      | Published policy preserved     | Named evaluation/commercial terms and separately reserved specification terms remain unchanged; this is not a new open-license grant.                               |

## Enforcement and authority boundaries

Schema validation enforces structural versions, identifier formats, required fields, enums and hash lengths. Semantic validation runs only after structural success and checks references, scope, chronology, roles, history and exact inventory. A structural failure explicitly reports that semantic validation was not performed; defensive checks in semantic code are not counted as independently reachable whole-package rules.

OAP currently requires applicable conflict declarations for evidence submission, assessment/evaluation, risk declaration, determination, risk acceptance, authorization, condition management and human lifecycle changes. This describes current implementation coverage; final universal policy requires ICxA review.

External OCRS verification checks selected subject identifiers exist in supplied content. OAP semantic validation separately checks the declared authorization-boundary mapping. Digest integrity does not establish signatures, trust, human approval or evidence truth.

No-dependency declarations, conditional-authorization closure/inheritance, lifecycle action permissions, reviewer authentication, and official evidence/category mappings are not added by this correction. The proposed-handover schema remains unchanged pending approval. Current licensing is defined by the published LICENSE files.
