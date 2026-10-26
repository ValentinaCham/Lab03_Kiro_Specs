import { describe, expect, it, vi } from 'vitest';
import { NetworkError, TimeoutError } from '../types';
import { ForecastService } from './ForecastService';

function responseWithBody(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

function responseWithInvalidJson(status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.reject(new SyntaxError('Unexpected token < in JSON at position 0')),
  } as unknown as Response;
}

function clientReturning(response: Response) {
  return { getForecast: vi.fn().mockResolvedValue(response) };
}

describe('ForecastService', () => {
  it('DEBE devolver NETWORK_ERROR ante un error de red', async () => {
    const client = { getForecast: vi.fn().mockRejectedValue(new NetworkError('sin red')) };
    const service = new ForecastService(client);

    const result = await service.getForecast(52.52, 13.42);

    expect(result).toEqual({ success: false, error: { type: 'NETWORK_ERROR' } });
  });

  it('DEBE devolver TIMEOUT cuando la solicitud excede el tiempo de espera', async () => {
    const client = { getForecast: vi.fn().mockRejectedValue(new TimeoutError('timeout')) };
    const service = new ForecastService(client);

    const result = await service.getForecast(52.52, 13.42);

    expect(result).toEqual({ success: false, error: { type: 'TIMEOUT' } });
  });

  it('DEBE devolver SERVICE_ERROR con el código de estado ante un HTTP no-2xx', async () => {
    const service = new ForecastService(clientReturning(responseWithBody({}, 500)));

    const result = await service.getForecast(52.52, 13.42);

    expect(result).toEqual({ success: false, error: { type: 'SERVICE_ERROR', statusCode: 500 } });
  });

  it('DEBE devolver INVALID_RESPONSE ante un 2xx con cuerpo no parseable', async () => {
    const service = new ForecastService(clientReturning(responseWithInvalidJson()));

    const result = await service.getForecast(52.52, 13.42);

    expect(result).toEqual({ success: false, error: { type: 'INVALID_RESPONSE' } });
  });

  it('DEBE devolver los valores crudos del clima ante una respuesta exitosa', async () => {
    const body = {
      current: {
        time: '2024-01-15T12:00',
        temperature_2m: 8.4,
        relative_humidity_2m: 72,
        precipitation: 0.5,
      },
    };
    const service = new ForecastService(clientReturning(responseWithBody(body)));

    const result = await service.getForecast(52.52, 13.42);

    expect(result).toEqual({
      success: true,
      data: { temperature: 8.4, humidity: 72, precipitation: 0.5 },
    });
  });

  it('DEBE devolver INCOMPLETE_DATA cuando un campo meteorológico es nulo', async () => {
    const body = { current: { temperature_2m: null, relative_humidity_2m: 72, precipitation: 0 } };
    const service = new ForecastService(clientReturning(responseWithBody(body)));

    const result = await service.getForecast(52.52, 13.42);

    expect(result).toEqual({ success: false, error: { type: 'INCOMPLETE_DATA' } });
  });

  it('DEBE considerar válido un valor cero en un campo meteorológico', async () => {
    const body = { current: { temperature_2m: 0, relative_humidity_2m: 0, precipitation: 0 } };
    const service = new ForecastService(clientReturning(responseWithBody(body)));

    const result = await service.getForecast(52.52, 13.42);

    expect(result).toEqual({
      success: true,
      data: { temperature: 0, humidity: 0, precipitation: 0 },
    });
  });

  it('DEBE devolver INCOMPLETE_DATA cuando un valor no es numérico', async () => {
    const body = {
      current: { temperature_2m: '8.4', relative_humidity_2m: 72, precipitation: 0 },
    };
    const service = new ForecastService(clientReturning(responseWithBody(body)));

    const result = await service.getForecast(52.52, 13.42);

    expect(result).toEqual({ success: false, error: { type: 'INCOMPLETE_DATA' } });
  });
});
