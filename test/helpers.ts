import path from 'node:path';
import { loadJson } from '../src/io.js';
import { mutate, type ControlledScenario } from '../src/fixtures.js';
import { packageHash } from '../src/integrity.js';
import { type OapPackage } from '../src/types.js';

export const root = process.cwd();
export const baseFile = path.join(
  root,
  'examples',
  'canonical',
  'scenario-a-authorization-supported.package.json',
);
export const base = () => loadJson<OapPackage>(baseFile);

export function scenario(name: string): OapPackage {
  const source = loadJson<ControlledScenario>(path.join(root, 'examples', 'canonical', name));
  const pkg = mutate(base(), source.mutations);
  pkg.manifest.packageId = source.packageId;
  pkg.manifest.inventory = pkg.records.map((r) => ({
    recordId: r.id,
    entityType: r.entityType,
    recordVersion: r.recordVersion,
    supersessionStatus: r.supersessionStatus === 'superseded' ? 'superseded' : 'current',
  }));
  pkg.manifest.contentHash.value = packageHash(pkg);
  return pkg;
}
