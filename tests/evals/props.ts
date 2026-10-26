/**
 * Configuración compartida de las pruebas de propiedad (fast-check).
 *
 * Todas las propiedades se ejecutan con la misma seed y el mismo número de
 * iteraciones, de modo que un fallo siempre sea reproducible (BR-TST-04).
 * La seed puede fijarse con la variable de entorno `FC_SEED`.
 */

import fc from 'fast-check';

export const PROP_SEED = Number(process.env.FC_SEED ?? 20260101);

export const PROP_NUM_RUNS = Number(process.env.FC_NUM_RUNS ?? 100);

/** Ejecuta una propiedad síncrona con seed y número de iteraciones deterministas. */
export function assertProperty<Ts>(property: fc.IRawProperty<Ts>): void {
  fc.assert(property, { seed: PROP_SEED, numRuns: PROP_NUM_RUNS });
}

/**
 * Ejecuta una propiedad asíncrona con seed y número de iteraciones deterministas.
 * Es obligatorio usar `fc.asyncProperty`: con `fc.property` un predicado que
 * devuelve una promesa se evaluaría como `true` y la propiedad pasaría vacua.
 */
export async function assertPropertyAsync<Ts>(property: fc.IAsyncProperty<Ts>): Promise<void> {
  await fc.assert(property, { seed: PROP_SEED, numRuns: PROP_NUM_RUNS });
}
