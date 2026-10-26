import fc from 'fast-check';
import { describe, expect, it, vi } from 'vitest';
import { GEOCODING_BASE_URL } from '../config';
import { assertPropertyAsync } from '../../tests/evals/props';
import { GeocodingClient } from './GeocodingClient';

/** Extrae la URL con la que se invocó `fetch`. */
function capturedRequestUrl(fetchMock: ReturnType<typeof vi.fn>): URL {
  const [rawUrl] = fetchMock.mock.calls[0] as [string, RequestInit];
  return new URL(rawUrl);
}

describe('GeocodingClient', () => {
  // Feature: weather-forecast-app, Propiedad 3: Construcción correcta de la URL de Geocodificación
  it('P3: construcción correcta de la URL de geocodificación', async () => {
    await assertPropertyAsync(
      fc.asyncProperty(fc.string({ minLength: 1 }), async (cityName) => {
        const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
        vi.stubGlobal('fetch', fetchMock);

        await new GeocodingClient().search(cityName);

        const url = capturedRequestUrl(fetchMock);
        expect(`${url.origin}${url.pathname}`).toBe(GEOCODING_BASE_URL);
        expect(url.searchParams.get('name')).toBe(cityName);
        expect(url.searchParams.get('count')).toBe('1');
      }),
    );
  });
});
