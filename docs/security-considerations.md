# Security and integrity considerations

Use input byte/depth/record limits, timeouts, safe JSON parsers, host allowlists where retrieval is later enabled, and isolated verification. The reference implementation performs no network retrieval. It rejects unsafe paths, invalid hashes, duplicates, substitutions, unsupported versions, silent replacement, expired/superseded reliance, authority conflicts, and automated human acts.

Exclude secrets, credentials, keys, and unnecessary personal information. Human references should use privacy-preserving identifiers. Hashing detects change only and supplies no identity, signature, authentication, trust, encryption, or non-repudiation. Signing/trust policy remains open.
