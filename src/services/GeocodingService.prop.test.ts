import fc from 'fast-check';
import { describe, expect, it, vi } from 'vitest';
import { assertPropertyAsync } from '../../tests/evals/props';
import { GeocodingService } from './GeocodingService';

function responseWithBody(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

type CoordinateField = 'latitude' | 'longitude';
type CorruptionMode = 'null' | 'undefined' | 'absent' | 'string' | 'nan' | 'infinity' | 'outOfRange';

interface Corruption {
  field: CoordinateField;
  mode: CorruptionMode;
}

const corruption: fc.Arbitrary<Corruption> = fc.record({
  field: fc.constantFrom<CoordinateField>('latitude', 'longitude'),
  mode: fc.constantFrom<CorruptionMode>(
    'null',
    'undefined',
    'absent',
    'string',
    'nan',
    'infinity',
    'outOfRange',
  ),
});

/** Aplica una corrupción a un resultado de la API. */
function corrupt(result: Record<string, unknown>, { field, mode }: Corruption): void {
  switch (mode) {
    case 'null':
      result[field] = null;
      return;
    case 'undefined':
      result[field] = undefined;
      return;
    case 'absent':
      delete result[field];
      return;
    case 'string':
      result[field] = '52.52437';
      return;
    case 'nan':
      result[field] = Number.NaN;
      return;
    case 'infinity':
      result[field] = Number.POSITIVE_INFINITY;
      return;
    case 'outOfRange':
      result[field] = 500;
  }
}

describe('GeocodingService', () => {
  // Feature: weather-forecast-app, Propiedad 4: Extracción de coordenadas del primer resultado
  it('P4: extracción de coordenadas del primer resultado', async () => {
    await assertPropertyAsync(
      fc.asyncProperty(
        fc.record({
          latitude: fc.double({ min: -90, max: 90, noNaN: true, noDefaultInfinity: true }),
          longitude: fc.double({ min: -180, max: 180, noNaN: true, noDefaultInfinity: true }),
          name: fc.string(),
        }),
        async (first) => {
          const body = {
            results: [first, { latitude: 999, longitude: 999, name: 'No debe usarse' }],
          };
          const client = {
            search: vi.fn().mockResolvedValue(responseWithBody(body)),
          };

          const result = await new GeocodingService(client).geocode('Ciudad');

          expect(result.success).toBe(true);
          if (!result.success) return;
          expect(result.data.latitude).toBe(first.latitude);
          expect(result.data.longitude).toBe(first.longitude);
          expect(result.data.cityName).toBe(first.name);
        },
      ),
    );
  });

  // Feature: weather-forecast-app, Propiedad 5: Validación de campos de coordenadas faltantes
  it('P5: validación de campos de coordenadas faltantes', async () => {
    await assertPropertyAsync(
      fc.asyncProperty(
        corruption,
        fc.option(corruption),
        async (primary, secondary) => {
          const result: Record<string, unknown> = {
            id: 1,
            name: 'Ciudad',
            latitude: 52.52437,
            longitude: 13.41053,
          };
          corrupt(result, primary);
          if (secondary !== null) {
            corrupt(result, secondary);
          }

          const client = {
            search: vi.fn().mockResolvedValue(responseWithBody({ results: [result] })),
          };

          const outcome = await new GeocodingService(client).geocode('Ciudad');

          expect(outcome).toEqual({ success: false, error: { type: 'CITY_NOT_FOUND' } });
        },
      ),
    );
  });

  // Feature: weather-forecast-app, Propiedad 8: Respuestas HTTP no-2xx siempre generan error
  it('P8: respuestas HTTP no-2xx siempre generan error', async () => {
    await assertPropertyAsync(
      fc.asyncProperty(fc.integer({ min: 300, max: 599 }), async (statusCode) => {
        const client = {
          search: vi.fn().mockResolvedValue(responseWithBody({ results: [] }, statusCode)),
        };

        const result = await new GeocodingService(client).geocode('Ciudad');

        expect(result.success).toBe(false);
        if (result.success) return;
        expect(result.error).toEqual({ type: 'SERVICE_ERROR', statusCode });
      }),
    );
  });
});
