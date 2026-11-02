import { createHash } from 'node:crypto';
import { canonicalize, inventoryDigest, sha256 } from './integrity.js';
import { type Diagnostic, type OapRecord } from './types.js';

interface OcrsManifest {
  packageId: string;
  manifestVersion: string;
  ocrsVersion: string;
  createdAt: string;
  producedByPartyId: string;
  projectId: string;
  boundaryIds: string[];
  profiles: Array<{ profileId: string; profileVersion: string }>;
  inventory: unknown;
  qualifications: string[];
  exclusions: string[];
  contentHash?: { algorithm: string; value: string };
}

export interface SuppliedExternalPackage {
  schemaVersion: string;
  manifest: OcrsManifest;
  systems?: Array<{ id: string }>;
  assets?: Array<{ id: string }>;
  interfaces?: Array<{ id: string }>;
  commissioningStageGates?: Array<{ profileId?: string; subjectIds?: string[] }>;
  operationalReadinessGates?: Array<{ profileId?: string; subjectIds?: string[] }>;
  [key: string]: unknown;
}

export function missingExternalPackageDiagnostic(referenceId = 'ocrs-input'): Diagnostic {
  return {
    code: 'EXTERNAL_VALIDATION_NOT_PERFORMED',
    path: `/${referenceId}`,
    message: 'OCRS content verification requires an explicitly supplied package path.',
    supportingRecordIds: referenceId === 'ocrs-input' ? [] : [referenceId],
  };
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
  const manifest = supplied.manifest;
  if (
    reference.sourceProtocolId !== 'OCRS' ||
    reference.sourceProtocolVersion !== manifest.ocrsVersion
  )
    push('EXTERNAL_PROTOCOL_MISMATCH', 'OCRS protocol identity or version does not match.');
  const profile = manifest.profiles.find((p) => p.profileId === reference.sourceProfileId);
  if (!profile || profile.profileVersion !== reference.sourceProfileVersion)
    push(
      'EXTERNAL_PROFILE_MISMATCH',
      'Referenced OCRS profile identity or version does not match.',
    );
  if (reference.packageId !== manifest.packageId)
    push('EXTERNAL_PACKAGE_IDENTITY_MISMATCH', 'OCRS package identifier does not match.');
  if (
    reference.packageSchemaVersion !== supplied.schemaVersion ||
    reference.manifestVersion !== manifest.manifestVersion
  )
    push(
      'EXTERNAL_PACKAGE_VERSION_MISMATCH',
      'OCRS root schema version or manifest version does not match.',
    );
  if (reference.canonicalizationMethod !== 'OCRS Canonical JSON v0.1')
    push('EXTERNAL_CANONICALIZATION_MISMATCH', 'Unsupported OCRS canonicalization method.');
  if (reference.projectIdentifier !== manifest.projectId)
    push('EXTERNAL_PROJECT_MISMATCH', 'OCRS project identifier does not match.');

  const applicableGates = [
    ...(supplied.commissioningStageGates ?? []),
    ...(supplied.operationalReadinessGates ?? []),
  ].filter((gate) => gate.profileId === reference.sourceProfileId);
  const availableSubjects = new Set<string>([
    ...(supplied.systems ?? []).map((item) => item.id),
    ...(supplied.assets ?? []).map((item) => item.id),
    ...(supplied.interfaces ?? []).map((item) => item.id),
    ...applicableGates.flatMap((gate) => gate.subjectIds ?? []),
  ]);
  if (!strings(reference.subjectIdentifiers).every((id) => availableSubjects.has(id)))
    push(
      'EXTERNAL_SUBJECT_MISMATCH',
      'An OCRS subject identifier is absent from the supplied package.',
    );
  if (!sameSet(strings(reference.boundaryIdentifiers), manifest.boundaryIds))
    push('EXTERNAL_BOUNDARY_MISMATCH', 'OCRS manifest boundary identifiers do not match.');
  if (reference.producingParty !== manifest.producedByPartyId)
    push('EXTERNAL_PRODUCER_MISMATCH', 'OCRS producing party does not match.');
  if (!sameSet(strings(reference.qualifications), manifest.qualifications))
    push('EXTERNAL_QUALIFICATION_MISMATCH', 'OCRS qualifications do not match.');
  if (!sameSet(strings(reference.exclusions), manifest.exclusions))
    push('EXTERNAL_EXCLUSION_MISMATCH', 'OCRS exclusions do not match.');
  if (reference.createdAtSource !== manifest.createdAt)
    push('EXTERNAL_CREATION_TIME_MISMATCH', 'OCRS package creation time does not match.');
  if (reference.supersessionStatus !== 'current')
    push(
      'EXTERNAL_SUPERSESSION_MISMATCH',
      'Only a current supplied OCRS package can verify as current.',
    );

  if (
    !reference.contentHash ||
    !manifest.contentHash ||
    (reference.contentHash as { algorithm: string; value: string }).algorithm !==
      manifest.contentHash.algorithm ||
    (reference.contentHash as { value: string }).value !== manifest.contentHash.value
  )
    push(
      'EXTERNAL_PACKAGE_HASH_MISMATCH',
      'OCRS declared digest does not match the OAP reference.',
    );
  const copy = structuredClone(supplied);
  delete copy.manifest.contentHash;
  if (!validDigest(manifest.contentHash, canonicalize(copy)))
    push('EXTERNAL_PACKAGE_HASH_MISMATCH', 'OCRS content does not match its declared digest.');
  if (
    !reference.inventoryDigest ||
    !validDigest(reference.inventoryDigest, canonicalize(manifest.inventory))
  )
    push('EXTERNAL_INVENTORY_DIGEST_MISMATCH', 'OCRS inventory does not match its bound digest.');
  return unique(diagnostics);
}

export function createExternalContract(reference: OapRecord): SuppliedExternalPackage {
  const inventory = [
    { recordId: 'contract:record:one', entityType: 'contract-record', recordVersion: '1.0.0' },
  ];
  const supplied: SuppliedExternalPackage = {
    schemaVersion: String(reference.packageSchemaVersion),
    manifest: {
      packageId: String(reference.packageId),
      manifestVersion: String(reference.manifestVersion),
      ocrsVersion: String(reference.sourceProtocolVersion),
      createdAt: String(reference.createdAtSource),
      producedByPartyId: String(reference.producingParty),
      projectId: String(reference.projectIdentifier),
      boundaryIds: strings(reference.boundaryIdentifiers),
      profiles: [
        {
          profileId: String(reference.sourceProfileId),
          profileVersion: String(reference.sourceProfileVersion),
        },
      ],
      inventory,
      qualifications: strings(reference.qualifications),
      exclusions: strings(reference.exclusions),
      contentHash: { algorithm: 'sha256', value: '' },
    },
    systems: strings(reference.subjectIdentifiers).map((id) => ({ id })),
  };
  const withoutHash = structuredClone(supplied);
  delete withoutHash.manifest.contentHash;
  supplied.manifest.contentHash = {
    algorithm: 'sha256',
    value: sha256(canonicalize(withoutHash)),
  };
  reference.contentHash = supplied.manifest.contentHash;
  reference.inventoryDigest = { algorithm: 'sha256', value: inventoryDigest(inventory) };
  return supplied;
}

function strings(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}
function sameSet(left: string[], right: string[]): boolean {
  const sorted = [...right].sort();
  return left.length === right.length && [...left].sort().every((value, i) => value === sorted[i]);
}
function unique(values: Diagnostic[]): Diagnostic[] {
  const seen = new Set<string>();
  return values.filter((value) => {
    const key = `${value.code}|${value.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function validDigest(value: unknown, content: string): boolean {
  if (!value || typeof value !== 'object') return false;
  const hash = value as { algorithm?: unknown; value?: unknown };
  if (hash.algorithm !== 'sha256' && hash.algorithm !== 'sha512') return false;
  return (
    typeof hash.value === 'string' &&
    hash.value === createHash(hash.algorithm).update(content, 'utf8').digest('hex')
  );
}
