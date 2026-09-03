# Authority matrix

| Act                          | Required role                    | Required separation                  | Software role                 |
| ---------------------------- | -------------------------------- | ------------------------------------ | ----------------------------- |
| Submit evidence              | Evidence submitter               | Separate from Auditor evaluation     | Validate and route            |
| Evaluate evidence            | Outcome Auditor                  | Independent of delivery and Director | Validate supplied record only |
| Determine support            | Outcome Director                 | Separate from Auditor                | Validate supplied record only |
| Accept residual risk         | Same Outcome Director assignment | Coherent with determination          | Validate supplied record only |
| Issue/withhold authorization | Same Outcome Director assignment | Based on separate Auditor evaluation | Record and validate only      |
| Manage condition             | Condition owner                  | Within condition scope               | Track supplied status         |
| Withdraw/revoke/supersede    | Applicable Outcome Director      | Same authorization context           | Validate supplied human act   |
| Detect expiry                | No human act required            | At or after declared `validTo`       | Deterministic time comparison |
| Detect reassessment trigger  | No human act required            | Preserve existing decision and basis | Flag only; never decide       |
