/**
 * Servicio de geocodificación.
 *
 * Traduce la respuesta cruda de la Geocoding API a un resultado discriminado:
 * o bien `Coordinates`, o bien un error de dominio tipado. No toca el DOM ni
 * conoce la URL de la API (design.md §Servicios).
 */

import { GeocodingClient } from '../clients/GeocodingClient';
import { NetworkError, TimeoutError } from '../types';
import type { Coordinates, GeocodingResult } from '../types';
import { isFiniteNumber, isRecord } from '../utils/guards';

export type GeocodingClientPort = Pick<GeocodingClient, 'search'>;

/** Superficie que el controlador necesita del servicio de geocodificación. */
export type GeocodingServicePort = Pick<GeocodingService, 'geocode'>;

const LATITUDE_MIN = -90;
const LATITUDE_MAX = 90;
const LONGITUDE_MIN = -180;
const LONGITUDE_MAX = 180;

function isValidLatitude(value: unknown): value is number {
  return isFiniteNumber(value) && value >= LATITUDE_MIN && value <= LATITUDE_MAX;
}

function isValidLongitude(value: unknown): value is number {
  return isFiniteNumber(value) && value >= LONGITUDE_MIN && value <= LONGITUDE_MAX;
}

export class GeocodingService {
  constructor(private readonly client: GeocodingClientPort = new GeocodingClient()) {}

  async geocode(cityName: string): Promise<GeocodingResult> {
    let response: Response;
    try {
      response = await this.client.search(cityName);
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

    if (!isRecord(body)) {
      return { success: false, error: { type: 'INVALID_RESPONSE' } };
    }

    const results = body['results'];
    if (results === undefined) {
      // Sin resultados la API puede omitir el campo (design.md §Data Models).
      return { success: false, error: { type: 'CITY_NOT_FOUND' } };
    }
    if (!Array.isArray(results)) {
      return { success: false, error: { type: 'INVALID_RESPONSE' } };
    }
    if (results.length === 0) {
      return { success: false, error: { type: 'CITY_NOT_FOUND' } };
    }

    const first = results[0];
    if (!isRecord(first)) {
      return { success: false, error: { type: 'CITY_NOT_FOUND' } };
    }

    const latitude = first['latitude'];
    const longitude = first['longitude'];
    if (!isValidLatitude(latitude) || !isValidLongitude(longitude)) {
      // Coordenadas ausentes, no numéricas o fuera de rango: cero resultados
      // válidos (Req. 2.6, Req. 3.6).
      return { success: false, error: { type: 'CITY_NOT_FOUND' } };
    }

    const coordinates: Coordinates = { latitude, longitude };
    const apiCityName = first['name'];
    if (typeof apiCityName === 'string') {
      coordinates.cityName = apiCityName;
    }

    return { success: true, data: coordinates };
  }
}
