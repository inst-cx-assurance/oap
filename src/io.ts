import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

export function loadJson<T>(file: string): T {
  return JSON.parse(readFileSync(file, 'utf8')) as T;
}

export function jsonFiles(root: string): string[] {
  const result: string[] = [];
  const walk = (directory: string) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile() && entry.name.endsWith('.json')) result.push(full);
    }
  };
  walk(root);
  return result.sort();
}
