import { createHash } from 'node:crypto';
import { type OapPackage } from './types.js';

export function canonicalize(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
  const object = value as Record<string, unknown>;
  return `{${Object.keys(object)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalize(object[key])}`)
    .join(',')}}`;
}

export function sha256(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

export function packageHash(pkg: OapPackage): string {
  const copy = structuredClone(pkg);
  delete (copy.manifest as Partial<OapPackage['manifest']>).contentHash;
  return sha256(canonicalize(copy));
}

export function inventoryDigest(inventory: unknown): string {
  return sha256(canonicalize(inventory));
}
