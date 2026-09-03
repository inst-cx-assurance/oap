# State-transition matrix

| State/record                     | Required prior basis                                                                             | Positive decision forced? |
| -------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------- |
| Submitted                        | Outcome, OEN, boundary, exact external package                                                   | No                        |
| Under review                     | Valid submission and Auditor assignment                                                          | No                        |
| Evaluated                        | Complete current assessments, nonempty exact basis, human Auditor act                            | No                        |
| Determined                       | Same-context evaluation and risk declaration, complete basis, human Director act                 | No                        |
| Authorized / conditional         | Exact determination/evaluation/risk chain, same Director; open linked condition when conditional | No                        |
| Withheld/deferred/not authorized | Director decision basis                                                                          | No                        |
| Expired                          | `validTo` reached; optional deterministic system-capture record                                  | No                        |
| Withdrawn/revoked                | Current historical authorization record plus authorized human change; effectiveness is false     | No                        |
| Superseded                       | Preserved prior record and coherent current successor                                            | No                        |
| Reassessment required            | Changed evidence/boundary/basis; system detection is not a decision                              | No                        |
