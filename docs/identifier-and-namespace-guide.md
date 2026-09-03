# Identifier and namespace guide

Draft IDs use `namespace:entity-type:local-id`. `oap` and `icxa` are reserved; the official URI namespace is unapproved. Records use independent semantic `recordVersion`; OAP package, manifest, protocol, and profile versions remain distinct. External references preserve only version concepts actually supplied by the source protocol. For OCRS v0.1, `packageSchemaVersion` maps to root `schemaVersion`; no separate OCRS package version is inferred. Corrections use a new ID/version and `supersedes`; exact inventory identifies every current and historical tuple.
