/**
 * Utilidad compartida por los clientes HTTP.
 *
 * Concentra el timeout con `AbortController` y la traducción de fallos de red
 * a errores tipados, de modo que ambos clientes se comporten exactamente igual
 * (BR-ERR-01, BR-ERR-07, BR-ERR-08).
 */

import { API_TIMEOUT_MS } from '../config';
import { NetworkError, TimeoutError } from '../types';

/** Detecta el error de cancelación propio de `AbortController`. */
function isAbortError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    (error as { name?: unknown }).name === 'AbortError'
  );
}

/**
 * Ejecuta la solicitud con timeout de `API_TIMEOUT_MS`.
 *
 * @returns La `Response` cruda, sin leer el cuerpo (BR-ERR-05).
 * @throws {TimeoutError} Si se supera el timeout.
 * @throws {NetworkError} Ante cualquier otro fallo de `fetch`.
 */
export async function requestWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    return await fetch(url, { signal: controller.signal });
  } catch (error) {
    if (controller.signal.aborted || isAbortError(error)) {
      throw new TimeoutError();
    }
    throw new NetworkError();
  } finally {
    clearTimeout(timeoutId);
  }
}
