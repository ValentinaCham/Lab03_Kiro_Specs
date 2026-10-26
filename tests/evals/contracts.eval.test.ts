/**
 * Evals de contrato (tarea 11.4).
 *
 * Oráculos ejecutables sobre los contratos externos de la app: forma exacta de
 * las URLs, constantes de configuración y taxonomía de errores. No dependen de
 * la red: solo de la implementación y de sus tipos.
 */

import { describe, expect, it } from 'vitest';
import { buildForecastUrl } from '../../src/clients/ForecastClient';
import { buildGeocodingUrl } from '../../src/clients/GeocodingClient';
import {
  API_TIMEOUT_MS,
  CURRENT_FIELDS,
  FORECAST_BASE_URL,
  GEOCODING_BASE_URL,
  MAX_CITY_NAME_LENGTH,
} from '../../src/config';
import type { AppError, ServiceName } from '../../src/types';
import { getErrorMessage } from '../../src/utils/errorMessages';

describe('Evals de contrato', () => {
  it('DEBE construir la URL de geocodificación con la base, `name` y `count=1` exactos', () => {
    const url = new URL(buildGeocodingUrl('Nueva Delicia'));

    expect(`${url.origin}${url.pathname}`).toBe(GEOCODING_BASE_URL);
    expect(url.searchParams.get('name')).toBe('Nueva Delicia');
    expect(url.searchParams.get('count')).toBe('1');
    expect([...url.searchParams.keys()].sort()).toEqual(['count', 'name']);
  });

  it('DEBE construir la URL de pronóstico con la base y los tres campos actuales exactos', () => {
    const url = new URL(buildForecastUrl(-33.4489, -70.6693));

    expect(`${url.origin}${url.pathname}`).toBe(FORECAST_BASE_URL);
    expect(url.searchParams.get('latitude')).toBe('-33.4489');
    expect(url.searchParams.get('longitude')).toBe('-70.6693');
    expect(url.searchParams.get('current')).toBe(
      'temperature_2m,relative_humidity_2m,precipitation',
    );
    expect(CURRENT_FIELDS).toBe('temperature_2m,relative_humidity_2m,precipitation');
    expect([...url.searchParams.keys()].sort()).toEqual(['current', 'latitude', 'longitude']);
  });

  it('DEBE fijar el timeout en 10 000 ms y el nombre de ciudad en 100 caracteres', () => {
    expect(API_TIMEOUT_MS).toBe(10_000);
    expect(MAX_CITY_NAME_LENGTH).toBe(100);
  });

  it('DEBE traducir cada tipo de error a un mensaje no vacío para ambos servicios', () => {
    const sharedTypes = ['NETWORK_ERROR', 'TIMEOUT', 'INVALID_RESPONSE'] as const;
    const services: ServiceName[] = ['geocoding', 'forecast'];

    for (const service of services) {
      for (const type of sharedTypes) {
        const message = getErrorMessage(service, { type } as AppError);
        expect(message.length).toBeGreaterThan(0);
        expect(message).toMatch(/\.$/);
      }
      expect(
        getErrorMessage(service, { type: 'SERVICE_ERROR', statusCode: 500 }),
      ).toMatch(/\.$/);
    }
  });

  it('DEBE producir mensajes distintos para el mismo tipo de error en servicios distintos', () => {
    const sharedTypes = ['NETWORK_ERROR', 'TIMEOUT', 'INVALID_RESPONSE'] as const;

    for (const type of sharedTypes) {
      const error = { type } as AppError;
      expect(getErrorMessage('geocoding', error)).not.toBe(getErrorMessage('forecast', error));
    }
  });

  it('DEBE mapear el error de validación a un mensaje único e independiente del servicio', () => {
    const error: AppError = { type: 'VALIDATION_EMPTY' };

    expect(getErrorMessage('geocoding', error)).toBe('El nombre de la ciudad es obligatorio.');
    expect(getErrorMessage('forecast', error)).toBe('El nombre de la ciudad es obligatorio.');
  });
});
