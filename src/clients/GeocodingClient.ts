/**
 * Cliente HTTP de la Geocoding API de Open-Meteo.
 *
 * Solo construye la URL, aplica el timeout y devuelve la `Response` cruda:
 * no interpreta el cuerpo (BR-ERR-05).
 */

import { GEOCODING_BASE_URL } from '../config';
import { requestWithTimeout } from './request';

/** Construye la URL de búsqueda con el nombre de la ciudad y `count=1` (BR-GEO-01). */
export function buildGeocodingUrl(cityName: string): string {
  const url = new URL(GEOCODING_BASE_URL);
  url.searchParams.set('name', cityName);
  url.searchParams.set('count', '1');
  return url.toString();
}

export class GeocodingClient {
  /**
   * @returns La respuesta cruda de la Geocoding API.
   * @throws {TimeoutError} Si la API no responde en `API_TIMEOUT_MS`.
   * @throws {NetworkError} Ante cualquier otro fallo de red.
   */
  async search(cityName: string): Promise<Response> {
    return requestWithTimeout(buildGeocodingUrl(cityName));
  }
}
