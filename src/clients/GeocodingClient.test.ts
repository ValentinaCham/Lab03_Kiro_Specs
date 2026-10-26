import { afterEach, describe, expect, it, vi } from 'vitest';
import { API_TIMEOUT_MS } from '../config';
import { NetworkError, TimeoutError } from '../types';
import { GeocodingClient } from './GeocodingClient';

/**
 * `fetch` que nunca resuelve por sí solo y solo se rechaza cuando la señal
 * se aborta: permite observar exactamente en qué momento dispara el timeout.
 */
function hangingFetch() {
  const state = { aborted: false };
  const mock = vi.fn(
    (_url: string, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          state.aborted = true;
          reject(new DOMException('The operation was aborted.', 'AbortError'));
        });
      }),
  );
  return { mock, state };
}

describe('GeocodingClient', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('DEBE abortar a los 10 000 ms exactos y lanzar TimeoutError', async () => {
    vi.useFakeTimers();
    const { mock, state } = hangingFetch();
    vi.stubGlobal('fetch', mock);

    const promise = new GeocodingClient().search('Berlin');
    const rejection = expect(promise).rejects.toBeInstanceOf(TimeoutError);

    await vi.advanceTimersByTimeAsync(API_TIMEOUT_MS - 1);
    expect(state.aborted).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    expect(state.aborted).toBe(true);

    await rejection;
  });

  it('DEBE lanzar NetworkError ante un fallo de red distinto del timeout', async () => {
    const failure = new TypeError('Failed to fetch');
    const mock = vi.fn().mockRejectedValue(failure);
    vi.stubGlobal('fetch', mock);

    await expect(new GeocodingClient().search('Berlin')).rejects.toBeInstanceOf(NetworkError);
  });

  it('DEBE lanzar NetworkError y no TimeoutError cuando la red falla', async () => {
    const mock = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    vi.stubGlobal('fetch', mock);

    const error = await new GeocodingClient()
      .search('Berlin')
      .then(() => null)
      .catch((thrown: unknown) => thrown);

    expect(error).toBeInstanceOf(NetworkError);
    expect(error).not.toBeInstanceOf(TimeoutError);
  });

  it('DEBE cancelar el timeout con clearTimeout tras una respuesta exitosa', async () => {
    vi.useFakeTimers();
    const response = new Response('{}', { status: 200 });
    const mock = vi.fn().mockResolvedValue(response);
    vi.stubGlobal('fetch', mock);
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');

    const result = await new GeocodingClient().search('Berlin');

    expect(result).toBe(response);
    expect(clearTimeoutSpy).toHaveBeenCalled();
  });

  it('DEBE devolver la Response sin leer el cuerpo', async () => {
    const response = new Response('{"results":[]}', { status: 200 });
    const mock = vi.fn().mockResolvedValue(response);
    vi.stubGlobal('fetch', mock);

    const result = await new GeocodingClient().search('Berlin');

    expect(result).toBe(response);
    expect(result.bodyUsed).toBe(false);
  });

  it('DEBE enviar la señal de cancelación al fetch', async () => {
    const response = new Response('{}', { status: 200 });
    const mock = vi.fn().mockResolvedValue(response);
    vi.stubGlobal('fetch', mock);

    await new GeocodingClient().search('Berlin');

    const [, init] = mock.mock.calls[0] as [string, RequestInit];
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });
});
