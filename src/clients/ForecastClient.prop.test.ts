import fc from 'fast-check';
import { describe, expect, it, vi } from 'vitest';
import { CURRENT_FIELDS, FORECAST_BASE_URL } from '../config';
import { assertPropertyAsync } from '../../tests/evals/props';
import { ForecastClient } from './ForecastClient';

function capturedRequestUrl(fetchMock: ReturnType<typeof vi.fn>): URL {
  const [rawUrl] = fetchMock.mock.calls[0] as [string, RequestInit];
  return new URL(rawUrl);
}

describe('ForecastClient', () => {
  // Feature: weather-forecast-app, Propiedad 6: Construcción correcta de la URL de Pronóstico
  it('P6: construcción correcta de la URL de pronóstico', async () => {
    await assertPropertyAsync(
      fc.asyncProperty(
        fc.double({ min: -90, max: 90, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: -180, max: 180, noNaN: true, noDefaultInfinity: true }),
        async (latitude, longitude) => {
          const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
          vi.stubGlobal('fetch', fetchMock);

          await new ForecastClient().getForecast(latitude, longitude);

          const url = capturedRequestUrl(fetchMock);
          expect(`${url.origin}${url.pathname}`).toBe(FORECAST_BASE_URL);
          expect(url.searchParams.get('latitude')).toBe(String(latitude));
          expect(url.searchParams.get('longitude')).toBe(String(longitude));

          const current = url.searchParams.get('current');
          expect(current).not.toBeNull();
          const fields = (current ?? '').split(',');
          expect(fields).toContain('temperature_2m');
          expect(fields).toContain('relative_humidity_2m');
          expect(fields).toContain('precipitation');
          expect(fields).toHaveLength(CURRENT_FIELDS.split(',').length);
        },
      ),
    );
  });
});
