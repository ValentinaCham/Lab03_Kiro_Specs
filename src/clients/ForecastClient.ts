/**
 * Cliente HTTP de la Forecast API de Open-Meteo.
 *
 * Solo construye la URL, aplica el timeout y devuelve la `Response` cruda:
 * no interpreta el cuerpo (BR-ERR-05).
 */

import { CURRENT_FIELDS, FORECAST_BASE_URL } from '../config';
import { requestWithTimeout } from './request';

/** Construye la URL del pronóstico con las coordenadas y las variables actuales (BR-FCT-01). */
export function buildForecastUrl(latitude: number, longitude: number): string {
  const url = new URL(FORECAST_BASE_URL);
  url.searchParams.set('latitude', String(latitude));
  url.searchParams.set('longitude', String(longitude));
  url.searchParams.set('current', CURRENT_FIELDS);
  return url.toString();
}

export class ForecastClient {
  /**
   * @returns La respuesta cruda de la Forecast API.
   * @throws {TimeoutError} Si la API no responde en `API_TIMEOUT_MS`.
   * @throws {NetworkError} Ante cualquier otro fallo de red.
   */
  async getForecast(latitude: number, longitude: number): Promise<Response> {
    return requestWithTimeout(buildForecastUrl(latitude, longitude));
  }
}
