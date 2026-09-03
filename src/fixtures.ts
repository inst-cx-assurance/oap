import { type OapPackage } from './types.js';

export interface Mutation {
  op: 'add' | 'replace' | 'remove';
  path: string;
  value?: unknown;
}
export interface InvalidFixture {
  name: string;
  expectedCode: string;
  mutations: Mutation[];
}
export interface ControlledScenario {
  name: string;
  basePackage: string;
  packageId: string;
  mutations: Mutation[];
  expectedState: string;
}

export function mutate(pkg: OapPackage, mutations: Mutation[]): OapPackage {
  const copy = structuredClone(pkg) as unknown as Record<string, unknown>;
  for (const mutation of mutations) {
    const parts = mutation.path
      .split('/')
      .slice(1)
      .map((x) => x.replaceAll('~1', '/').replaceAll('~0', '~'));
    const last = parts.pop();
    if (last === undefined) throw new Error(`Bad mutation path ${mutation.path}`);
    let parent: any = copy;
    for (const part of parts) parent = parent[Array.isArray(parent) ? Number(part) : part];
    const key = Array.isArray(parent) ? Number(last) : last;
    if (mutation.op === 'remove') {
      if (Array.isArray(parent)) parent.splice(key as number, 1);
      else delete parent[key];
    } else if (mutation.op === 'add' && Array.isArray(parent))
      parent.splice(key as number, 0, mutation.value);
    else parent[key] = mutation.value;
  }
  return copy as unknown as OapPackage;
}
