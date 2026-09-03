import { canonicalize, sha256 } from './integrity.js';
import { type Diagnostic, type OapRecord } from './types.js';

export interface SuppliedExternalPackage {
  manifest: {
    packageId: string;
    manifestVersion: string;
    ocrsVersion?: string;
    contentHash?: { algorithm: string; value: string };
    inventory: unknown;
  };
  [key: string]: unknown;
}

export function verifyExternalPackage(
  reference: OapRecord,
  supplied: SuppliedExternalPackage,
): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const push = (code: string, message: string) =>
    diagnostics.push({
      code,
      path: `/${reference.id}`,
      message,
      supportingRecordIds: [reference.id],
    });
  if (
    reference.packageId !== supplied.manifest.packageId ||
    reference.manifestVersion !== supplied.manifest.manifestVersion ||
    reference.sourceProtocolVersion !== supplied.manifest.ocrsVersion
  )
    push(
      'EXTERNAL_PACKAGE_IDENTITY_MISMATCH',
      'Supplied package identity or version does not match the OAP reference.',
    );
  if (
    reference.contentHash &&
    supplied.manifest.contentHash &&
    (reference.contentHash as { value: string }).value !== supplied.manifest.contentHash.value
  )
    push(
      'EXTERNAL_PACKAGE_HASH_MISMATCH',
      'Supplied package digest does not match the OAP evidence reference.',
    );
  const copy = structuredClone(supplied);
  delete copy.manifest.contentHash;
  const computed = sha256(canonicalize(copy));
  if (supplied.manifest.contentHash?.value !== computed)
    push(
      'EXTERNAL_PACKAGE_HASH_MISMATCH',
      'Supplied package content does not match its declared digest.',
    );
  if (
    reference.inventoryDigest &&
    (reference.inventoryDigest as { value: string }).value !==
      sha256(canonicalize(supplied.manifest.inventory))
  )
    push(
      'EXTERNAL_INVENTORY_DIGEST_MISMATCH',
      'Supplied package inventory does not match its bound digest.',
    );
  return diagnostics;
}
