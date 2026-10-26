import fc from 'fast-check';
import { describe, expect, it, vi } from 'vitest';
import { assertPropertyAsync } from '../../tests/evals/props';
import { ForecastService } from './ForecastService';

function responseWithBody(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

type WeatherField = 'temperature_2m' | 'relative_humidity_2m' | 'precipitation';
type CorruptionMode = 'null' | 'undefined' | 'absent';

interface Corruption {
  field: WeatherField;
  mode: CorruptionMode;
}

const corruption: fc.Arbitrary<Corruption> = fc.record({
  field: fc.constantFrom<WeatherField>(
    'temperature_2m',
    'relative_humidity_2m',
    'precipitation',
  ),
  mode: fc.constantFrom<CorruptionMode>('null', 'undefined', 'absent'),
});

describe('ForecastService', () => {
  // Feature: weather-forecast-app, Propiedad 7: Round-trip de parseo de la respuesta Forecast → WeatherData
  it('P7: round-trip de parseo de la respuesta Forecast → WeatherData', async () => {
    await assertPropertyAsync(
      fc.asyncProperty(
        fc.record({
          temperature_2m: fc.double({
            noNaN: true,
            noDefaultInfinity: true,
            min: -100,
            max: 100,
          }),
          relative_humidity_2m: fc.double({
            noNaN: true,
            noDefaultInfinity: true,
            min: 0,
            max: 100,
          }),
          precipitation: fc.double({
            noNaN: true,
            noDefaultInfinity: true,
            min: 0,
            max: 1000,
          }),
        }),
        async (current) => {
          const client = {
            getForecast: vi.fn().mockResolvedValue(responseWithBody({ current })),
          };

          const result = await new ForecastService(client).getForecast(52.52, 13.42);

          expect(result.success).toBe(true);
          if (!result.success) return;
          expect(result.data.temperature).toBe(current.temperature_2m);
          expect(result.data.humidity).toBe(current.relative_humidity_2m);
          expect(result.data.precipitation).toBe(current.precipitation);
        },
      ),
    );
  });

  // Feature: weather-forecast-app, Propiedad 10: Campos meteorológicos faltantes generan error de datos incompletos
  it('P10: campos meteorológicos faltantes generan error de datos incompletos', async () => {
    await assertPropertyAsync(
      fc.asyncProperty(corruption, async ({ field, mode }) => {
        const current: Record<string, unknown> = {
          temperature_2m: 8.4,
          relative_humidity_2m: 72,
          precipitation: 0.5,
        };

        if (mode === 'null') {
          current[field] = null;
        } else if (mode === 'undefined') {
          current[field] = undefined;
        } else {
          delete current[field];
        }

        const client = {
          getForecast: vi.fn().mockResolvedValue(responseWithBody({ current })),
        };

        const result = await new ForecastService(client).getForecast(52.52, 13.42);

        expect(result).toEqual({ success: false, error: { type: 'INCOMPLETE_DATA' } });
      }),
    );
  });

  // Feature: weather-forecast-app, Propiedad 8: Respuestas HTTP no-2xx siempre generan error
  it('P8: respuestas HTTP no-2xx siempre generan error', async () => {
    await assertPropertyAsync(
      fc.asyncProperty(fc.integer({ min: 300, max: 599 }), async (statusCode) => {
        const client = {
          getForecast: vi.fn().mockResolvedValue(responseWithBody({ current: {} }, statusCode)),
        };

        const result = await new ForecastService(client).getForecast(52.52, 13.42);

        expect(result.success).toBe(false);
        if (result.success) return;
        expect(result.error).toEqual({ type: 'SERVICE_ERROR', statusCode });
      }),
    );
  });

  // Feature: weather-forecast-app, Propiedad 9: Respuestas 2xx con cuerpo inválido generan error
  it('P9: respuestas 2xx con cuerpo inválido generan error', async () => {
    const malformedBody: fc.Arbitrary<unknown> = fc.oneof(
      fc.string(),
      fc.constant(null),
      fc.constant(42),
      fc.constant(true),
      fc.constant([]),
      fc.constant({}),
      fc.record({ current: fc.constant(null) }),
      fc.record({ current: fc.constant('no es un objeto') }),
      fc.record({ current: fc.constant([]) }),
    );

    await assertPropertyAsync(
      fc.asyncProperty(malformedBody, async (body) => {
        const client = {
          getForecast: vi.fn().mockResolvedValue(responseWithBody(body)),
        };

        const result = await new ForecastService(client).getForecast(52.52, 13.42);

        expect(result).toEqual({ success: false, error: { type: 'INVALID_RESPONSE' } });
      }),
    );
  });
});
