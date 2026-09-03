# Architecture guide

OAP consists of a normative draft specification, modular Draft 2020-12 schemas, versioned profiles, semantic conformance rules, and an optional TypeScript validator. Applications sit outside the protocol.

```text
External Level 2 package -> integrity-bound submission -> human Auditor evaluation
  -> human Director determination + risk acceptance -> human Outcome Authorization
```

The validator checks the arrows and contexts. It never generates the four human acts. External packages remain authoritative at their source; OAP preserves only exact references and the Level 1 record chain.
