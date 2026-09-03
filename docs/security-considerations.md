# Security and integrity considerations

Use input byte/depth/record limits, timeouts, safe JSON parsers, host allowlists where retrieval is later enabled, and isolated verification. The reference implementation performs no network retrieval. It rejects unsafe local retrieval forms, invalid algorithm-specific hash lengths, duplicates, reference and evidence substitution, unsupported versions, incomplete inventory, silent replacement, supersession cycles, expired/superseded reliance, external metadata mismatches, authority conflicts, and automated human acts.

External verification binds protocol/profile versions, source root and manifest versions, package and inventory digests, project, subjects, boundaries, producer, qualifications, exclusions, creation time, and supersession. The package's `claimedValidationStatus` is not trusted as proof of verification. Replay prevention beyond version, context, chronology, and supersession checks requires a future trust policy.

Exclude secrets, credentials, keys, and unnecessary personal information. Human references should use privacy-preserving identifiers. Hashing detects change only and supplies no identity, signature, authentication, trust, encryption, or non-repudiation. Signing/trust policy remains open.
