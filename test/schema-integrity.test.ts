import { describe, expect, it } from 'vitest';
import { canonicalize, inventoryDigest, packageHash, sha256 } from '../src/integrity.js';
import { createSchemaContext } from '../src/schema-context.js';
import { validatePackage } from '../src/validator.js';
import { base } from './helpers.js';

describe('schemas and deterministic integrity', () => {
  it('meta-validates and compiles every Draft 2020-12 schema', () => {
    const context = createSchemaContext();
    expect(context.files).toHaveLength(30);
  });

  it('validates the exact canonical authorization package', () => {
    expect(validatePackage(base())).toEqual([]);
  });

  it('reproduces canonical JSON and SHA-256', () => {
    expect(canonicalize({ z: [2, { b: false, a: null }], a: 'é' })).toBe(
      '{"a":"é","z":[2,{"a":null,"b":false}]}',
    );
    expect(sha256('{"a":"é","z":[2,{"a":null,"b":false}]}')).toBe(
      'b22f45fae69eddcf4f51a274bda4cfd7bfe50552a33c8dd17d5bb9b9a894ac1d',
    );
  });

  it('binds package and inventory content deterministically', () => {
    const pkg = base();
    expect(packageHash(pkg)).toBe(pkg.manifest.contentHash.value);
    expect(inventoryDigest([])).toHaveLength(64);
  });
});
