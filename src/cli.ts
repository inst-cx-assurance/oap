import path from 'node:path';
import { createSchemaContext } from './schema-context.js';
import { jsonFiles, loadJson } from './io.js';
import { mutate, type ControlledScenario, type InvalidFixture } from './fixtures.js';
import { packageHash } from './integrity.js';
import { verifyExternalPackage, type SuppliedExternalPackage } from './external-verifier.js';
import { type OapPackage } from './types.js';
import { validatePackage } from './validator.js';

const root = process.cwd();
const mode = process.argv[2] ?? 'semantic';
const context = createSchemaContext(root);
const validFiles = [
  ...jsonFiles(path.join(root, 'examples', 'canonical')).filter(
    (f) =>
      f.endsWith('.package.json') ||
      (f.endsWith('.scenario.json') && !f.endsWith('.expected-invalid.scenario.json')),
  ),
  ...jsonFiles(path.join(root, 'conformance', 'valid')).filter((f) => f.endsWith('.scenario.json')),
];

if (mode === 'schemas') {
  console.log(`Validated and compiled ${context.files.length} Draft 2020-12 schemas.`);
} else if (mode === 'valid' || mode === 'semantic') {
  if (mode === 'valid') {
    const profileValidator = context.getSchema(
      'https://spec.oap.example/v0.1/schemas/profile-declaration.schema.json',
    );
    for (const file of jsonFiles(path.join(root, 'profiles'))) {
      if (!profileValidator || !profileValidator(loadJson(file)))
        throw new Error(`Invalid profile ${file}: ${JSON.stringify(profileValidator?.errors)}`);
      console.log(`Valid profile: ${path.relative(root, file)}`);
    }
  }
  for (const file of validFiles) {
    const diagnostics = validatePackage(loadResolved(file), context);
    if (diagnostics.length) throw new Error(`${file}: ${JSON.stringify(diagnostics, null, 2)}`);
    console.log(
      `${mode === 'semantic' ? 'Semantic integrity verified' : 'Valid OAP package'}: ${path.relative(root, file)}`,
    );
  }
} else if (mode === 'invalid') {
  const base = loadJson<OapPackage>(
    path.join(root, 'examples', 'canonical', 'scenario-a-authorization-supported.package.json'),
  );
  for (const file of jsonFiles(path.join(root, 'conformance', 'invalid')).filter((f) =>
    f.endsWith('.fixture.json'),
  )) {
    const fixture = loadJson<InvalidFixture>(file);
    const diagnostics = validatePackage(mutate(base, fixture.mutations), context);
    if (!diagnostics.some((d) => d.code === fixture.expectedCode))
      throw new Error(
        `${file} expected ${fixture.expectedCode}; got ${JSON.stringify(diagnostics, null, 2)}`,
      );
    console.log(`Expected failure ${fixture.expectedCode}: ${path.relative(root, file)}`);
  }
} else if (mode === 'verify-ocrs') {
  const pkg = loadJson<OapPackage>(
    path.join(root, 'examples', 'canonical', 'scenario-a-authorization-supported.package.json'),
  );
  const reference = pkg.records.find(
    (r) => r.entityType === 'external-package-reference' && r.sourceProtocolId === 'OCRS',
  );
  if (
    !reference ||
    reference.validationStatus !== 'verified' ||
    !reference.contentHash ||
    !reference.inventoryDigest
  )
    throw new Error('Canonical OCRS reference is not integrity-bound and verified.');
  const suppliedFile = process.argv[3];
  if (suppliedFile) {
    const supplied = loadJson<SuppliedExternalPackage>(path.resolve(root, suppliedFile));
    const diagnostics = verifyExternalPackage(reference, supplied);
    if (diagnostics.length)
      throw new Error(`OCRS package verification failed: ${JSON.stringify(diagnostics, null, 2)}`);
  }
  console.log(
    `OCRS evidence-input reference verified${suppliedFile ? ' against supplied package content' : ' for required bindings'}: ${reference.packageId}@${reference.manifestVersion}; no OCRS authority imported.`,
  );
} else {
  throw new Error(`Unknown mode ${mode}.`);
}

function loadResolved(file: string): OapPackage {
  const input = loadJson<OapPackage | ControlledScenario>(file);
  if (!('basePackage' in input)) return input;
  if (path.isAbsolute(input.basePackage))
    throw new Error('Scenario basePackage must be repository-relative.');
  const basePath = path.resolve(root, input.basePackage);
  if (!basePath.startsWith(`${path.resolve(root)}${path.sep}`))
    throw new Error('Scenario basePackage escapes the repository.');
  const pkg = mutate(loadJson<OapPackage>(basePath), input.mutations);
  pkg.manifest.packageId = input.packageId;
  pkg.manifest.inventory = pkg.records.map((r) => ({
    recordId: r.id,
    entityType: r.entityType,
    recordVersion: r.recordVersion,
    supersessionStatus: r.supersessionStatus === 'superseded' ? 'superseded' : 'current',
  }));
  pkg.manifest.contentHash.value = packageHash(pkg);
  return pkg;
}
