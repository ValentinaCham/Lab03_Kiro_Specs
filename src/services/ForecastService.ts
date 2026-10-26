/**
 * Servicio de pronóstico.
 *
 * Traduce la respuesta cruda de la Forecast API a un resultado discriminado:
 * o bien `WeatherData` con los valores crudos, o bien un error de dominio
 * tipado. No toca el DOM ni conoce la URL de la API (design.md §Servicios).
 */

import { ForecastClient } from '../clients/ForecastClient';
import { NetworkError, TimeoutError } from '../types';
import type { ForecastResult, WeatherData } from '../types';
import { isFiniteNumber, isRecord } from '../utils/guards';

export type ForecastClientPort = Pick<ForecastClient, 'getForecast'>;

/** Superficie que el controlador necesita del servicio de pronóstico. */
export type ForecastServicePort = Pick<ForecastService, 'getForecast'>;

export class ForecastService {
  constructor(private readonly client: ForecastClientPort = new ForecastClient()) {}

  async getForecast(latitude: number, longitude: number): Promise<ForecastResult> {
    let response: Response;
    try {
      response = await this.client.getForecast(latitude, longitude);
    } catch (error) {
      if (error instanceof TimeoutError) {
        return { success: false, error: { type: 'TIMEOUT' } };
      }
      if (error instanceof NetworkError) {
        return { success: false, error: { type: 'NETWORK_ERROR' } };
      }
      // Cualquier otro fallo se reporta como error de red: el servicio siempre
      // devuelve un resultado discriminado, nunca lanza.
      return { success: false, error: { type: 'NETWORK_ERROR' } };
    }

    if (!response.ok) {
      return { success: false, error: { type: 'SERVICE_ERROR', statusCode: response.status } };
    }

    let body: unknown;
    try {
      body = await response.json();
    } catch {
      return { success: false, error: { type: 'INVALID_RESPONSE' } };
    }

    if (!isRecord(body) || !isRecord(body['current'])) {
      return { success: false, error: { type: 'INVALID_RESPONSE' } };
    }

    const current = body['current'];
    const temperature = current['temperature_2m'];
    const humidity = current['relative_humidity_2m'];
    const precipitation = current['precipitation'];

    if (
      !isFiniteNumber(temperature) ||
      !isFiniteNumber(humidity) ||
      !isFiniteNumber(precipitation)
    ) {
      // Un valor ausente, nulo, no numérico o no finito deja los datos
      // meteorológicos incompletos (Req. 3.5). El valor 0 sí es válido.
      return { success: false, error: { type: 'INCOMPLETE_DATA' } };
    }

    const weather: WeatherData = { temperature, humidity, precipitation };
    return { success: true, data: weather };
  }
}
