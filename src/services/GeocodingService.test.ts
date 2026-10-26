import { describe, expect, it, vi } from 'vitest';
import { NetworkError, TimeoutError, type GeocodingResult } from '../types';
import { GeocodingService } from './GeocodingService';

/** Respuesta con cuerpo JSON controlable, sin pasar por `JSON.stringify`. */
function responseWithBody(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

/** Respuesta 2xx cuyo cuerpo no se puede parsear como JSON. */
function responseWithInvalidJson(status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.reject(new SyntaxError('Unexpected token < in JSON at position 0')),
  } as unknown as Response;
}

function clientReturning(response: Response) {
  return { search: vi.fn().mockResolvedValue(response) };
}

describe('GeocodingService', () => {
  it('DEBE devolver CITY_NOT_FOUND cuando la API no retorna resultados', async () => {
    const service = new GeocodingService(clientReturning(responseWithBody({ results: [] })));

    const result = await service.geocode('Ciudad Inexistente');

    expect(result).toEqual({ success: false, error: { type: 'CITY_NOT_FOUND' } });
  });

  it('DEBE devolver CITY_NOT_FOUND cuando la respuesta no trae el campo results', async () => {
    const service = new GeocodingService(clientReturning(responseWithBody({})));

    const result = await service.geocode('Ciudad Inexistente');

    expect(result).toEqual({ success: false, error: { type: 'CITY_NOT_FOUND' } });
  });

  it('DEBE devolver NETWORK_ERROR ante un error de red', async () => {
    const client = { search: vi.fn().mockRejectedValue(new NetworkError('sin red')) };
    const service = new GeocodingService(client);

    const result = await service.geocode('Berlin');

    expect(result).toEqual({ success: false, error: { type: 'NETWORK_ERROR' } });
  });

  it('DEBE devolver TIMEOUT cuando la solicitud excede el tiempo de espera', async () => {
    const client = { search: vi.fn().mockRejectedValue(new TimeoutError('timeout')) };
    const service = new GeocodingService(client);

    const result = await service.geocode('Berlin');

    expect(result).toEqual({ success: false, error: { type: 'TIMEOUT' } });
  });

  it('DEBE devolver SERVICE_ERROR con el código de estado ante un HTTP no-2xx', async () => {
    const service = new GeocodingService(clientReturning(responseWithBody({}, 503)));

    const result = await service.geocode('Berlin');

    expect(result).toEqual({ success: false, error: { type: 'SERVICE_ERROR', statusCode: 503 } });
  });

  it('DEBE devolver INVALID_RESPONSE ante un 2xx con cuerpo no parseable', async () => {
    const service = new GeocodingService(clientReturning(responseWithInvalidJson()));

    const result = await service.geocode('Berlin');

    expect(result).toEqual({ success: false, error: { type: 'INVALID_RESPONSE' } });
  });

  it('DEBE devolver las coordenadas del primer resultado sin transformarlas', async () => {
    const body = {
      results: [
        { id: 1, name: 'Berlin', latitude: 52.52437, longitude: 13.41053 },
        { id: 2, name: 'Otra', latitude: 0, longitude: 0 },
      ],
    };
    const service = new GeocodingService(clientReturning(responseWithBody(body)));

    const result = await service.geocode('Berlin');

    expect(result).toEqual({
      success: true,
      data: { latitude: 52.52437, longitude: 13.41053, cityName: 'Berlin' },
    });
  });

  it('DEBE devolver CITY_NOT_FOUND cuando las coordenadas están fuera de rango', async () => {
    const body = { results: [{ name: 'Imposible', latitude: 120, longitude: 13.41 }] };
    const service = new GeocodingService(clientReturning(responseWithBody(body)));

    const result = await service.geocode('Imposible');

    expect(result).toEqual({ success: false, error: { type: 'CITY_NOT_FOUND' } });
  });

  it('DEBE devolver CITY_NOT_FOUND cuando la longitud está fuera de rango', async () => {
    const body = { results: [{ name: 'Imposible', latitude: 52.5, longitude: 220 }] };
    const service = new GeocodingService(clientReturning(responseWithBody(body)));

    const result = await service.geocode('Imposible');

    expect(result).toEqual({ success: false, error: { type: 'CITY_NOT_FOUND' } });
  });

  it('DEBE devolver éxito con cityName indefinido cuando el resultado no trae nombre', async () => {
    const body = { results: [{ id: 1, latitude: 52.5, longitude: 13.4 }] };
    const service = new GeocodingService(clientReturning(responseWithBody(body)));

    const result: GeocodingResult = await service.geocode('Ciudad Sin Nombre');

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.cityName).toBeUndefined();
    expect(result.data.latitude).toBe(52.5);
  });
});
