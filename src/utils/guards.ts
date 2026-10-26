/**
 * Guardas de tipo para las fronteras JSON de la API.
 *
 * Las respuestas externas se tratan como `unknown` y se estrechan con estas
 * funciones; nunca se usan `any` ni casts a ciegas (CLAUDE.md §8.2).
 */

/** Indica si el valor es un objeto plano (no `null`, no un array). */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Indica si el valor es un número finito (excluye `NaN` y `±Infinity`). */
export function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}
