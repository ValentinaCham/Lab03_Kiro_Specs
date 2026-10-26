/**
 * Eval de cobertura del manifest (tarea 11.4).
 *
 * Verifica que el manifest de evals sea coherente con `requirements.md` y con
 * `design.md`: todo criterio de aceptación y toda propiedad de corrección
 * deben tener al menos un eval que los juzgue (BR-TST-02, BR-TST-03).
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  REQUIRED_CRITERIA,
  REQUIRED_PROPERTIES,
  evals,
  type EvalDefinition,
} from './evals.manifest';

const requirementsText = readFileSync(resolve(process.cwd(), 'requirements.md'), 'utf-8');
const designText = readFileSync(resolve(process.cwd(), 'design.md'), 'utf-8');

/** Extrae los identificadores `Req.N.M` de los criterios de aceptación. */
function extractCriteria(text: string): string[] {
  const criteria: string[] = [];
  let requirement = 0;
  let insideCriteria = false;

  for (const line of text.split('\n')) {
    const heading = /^###\s+Requisito\s+(\d+)\s*:/.exec(line);
    if (heading !== null) {
      requirement = Number(heading[1]);
      insideCriteria = false;
      continue;
    }
    if (/^####\s+Criterios de Aceptación/.test(line)) {
      insideCriteria = true;
      continue;
    }
    if (/^#{1,4}\s/.test(line)) {
      insideCriteria = false;
      continue;
    }
    const item = insideCriteria ? /^\s*(\d+)\.\s/.exec(line) : null;
    if (item !== null && requirement > 0) {
      criteria.push(`Req.${requirement}.${Number(item[1])}`);
    }
  }

  return criteria;
}

/** Extrae los identificadores `P-N` de las propiedades de corrección. */
function extractProperties(text: string): string[] {
  const properties: string[] = [];
  const heading = /^###\s+Property\s+(\d+)\s*:/;
  for (const line of text.split('\n')) {
    const match = heading.exec(line);
    if (match !== null) properties.push(`P${Number(match[1])}`);
  }
  return properties;
}

function coveredRequirements(entries: EvalDefinition[]): Set<string> {
  return new Set(entries.map((entry) => entry.requirement));
}

function coveredProperties(entries: EvalDefinition[]): Set<string> {
  return new Set(
    entries
      .map((entry) => entry.property)
      .filter((property): property is string => property !== undefined),
  );
}

describe('Manifest de evals', () => {
  it('DEBE contener al menos un eval por cada criterio de aceptación de requirements.md', () => {
    const criteria = extractCriteria(requirementsText);
    const covered = coveredRequirements(evals);
    const missing = criteria.filter((criterion) => !covered.has(criterion));

    expect(criteria.length).toBe(REQUIRED_CRITERIA.length);
    expect(missing).toEqual([]);
  });

  it('DEBE cubrir todos los criterios declarados en REQUIRED_CRITERIA', () => {
    const covered = coveredRequirements(evals);
    const missing = REQUIRED_CRITERIA.filter((criterion) => !covered.has(criterion));

    expect(missing).toEqual([]);
  });

  it('DEBE cubrir todas las propiedades de corrección de design.md', () => {
    const properties = extractProperties(designText);
    const covered = coveredProperties(evals);
    const missing = properties.filter((property) => !covered.has(property));

    expect(properties).toEqual([...REQUIRED_PROPERTIES]);
    expect(missing).toEqual([]);
  });

  it('DEBE usar identificadores de eval únicos', () => {
    const ids = evals.map((entry) => entry.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('DEBE apuntar a archivos de prueba existentes', () => {
    for (const entry of evals) {
      expect(entry.file, `El eval ${entry.id} no declara archivo`).toMatch(/\.test\.ts$/);
      expect(() => readFileSync(resolve(process.cwd(), entry.file))).not.toThrow();
    }
  });

  it('DEBE declarar un requisito y un criterio de aprobación válidos en cada eval', () => {
    for (const entry of evals) {
      expect(entry.requirement, `El eval ${entry.id} no ancla a un requisito`).toMatch(/^Req\.\d+\.\d+$/);
      expect(entry.description.length).toBeGreaterThan(0);
      expect(entry.passCriteria.length).toBeGreaterThan(0);
      expect(['property', 'contract', 'scenario']).toContain(entry.kind);
      if (entry.property !== undefined) {
        expect(entry.property, `El eval ${entry.id} declara una propiedad inválida`).toMatch(
          /^P\d+$/,
        );
      }
    }
  });

  it('DEBE cubrir cada requisito con un eval cuyo archivo exista en el árbol de pruebas', () => {
    const files = new Set(evals.map((entry) => entry.file));

    expect(files.size).toBeGreaterThan(0);
    for (const file of files) {
      expect(file.startsWith('src/') || file.startsWith('tests/')).toBe(true);
    }
  });
});
