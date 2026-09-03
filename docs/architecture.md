# Architecture guide

OAP consists of a normative draft specification, modular Draft 2020-12 schemas, versioned profiles, semantic conformance rules, and an optional TypeScript validator. Applications sit outside the protocol.

```text
Outcome + OEN -> integrity-bound external submission -> complete criterion assessments
  -> human Auditor evaluation -> residual-risk declaration
  -> human Director determination -> human residual-risk acceptance
  -> human Outcome Authorization -> conditions or lifecycle changes
```

The validator checks exact context and identity at every arrow, nonempty evidence bases, role authority, delegation, conflicts, chronology, and append-only history. It never generates human evaluation, determination, acceptance, authorization, withdrawal, or revocation acts. External packages remain authoritative at their source; OAP preserves exact references and the Level 1 record chain.
