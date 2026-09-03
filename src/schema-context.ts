import Ajv2020Import, { type ErrorObject, type ValidateFunction } from 'ajv/dist/2020.js';
import addFormatsImport from 'ajv-formats';
import path from 'node:path';
import { jsonFiles, loadJson } from './io.js';

export interface SchemaContext {
  files: string[];
  validate: ValidateFunction;
  getSchema(id: string): ValidateFunction | undefined;
  errors(): ErrorObject[] | null | undefined;
}

export function createSchemaContext(root = process.cwd()): SchemaContext {
  const Ajv2020 = Ajv2020Import as unknown as new (options: Record<string, unknown>) => {
    validateSchema(schema: unknown): boolean;
    errors?: ErrorObject[] | null;
    addSchema(schema: unknown): void;
    getSchema(id: string): ValidateFunction | undefined;
  };
  const ajv = new Ajv2020({
    allErrors: true,
    strict: true,
    strictTypes: false,
    strictRequired: false,
  });
  (addFormatsImport as unknown as (value: typeof ajv) => void)(ajv);
  const files = jsonFiles(path.join(root, 'schemas'));
  for (const file of files) {
    const schema = loadJson(file);
    if (!ajv.validateSchema(schema))
      throw new Error(`Invalid schema ${file}: ${JSON.stringify(ajv.errors)}`);
    ajv.addSchema(schema);
  }
  const validate = ajv.getSchema('https://spec.oap.example/v0.1/schemas/oap-package.schema.json');
  if (!validate) throw new Error('OAP package schema was not registered.');
  return { files, validate, getSchema: (id) => ajv.getSchema(id), errors: () => validate.errors };
}
