/**
 * Pruebas de integración de extremo a extremo (tarea 11.3).
 *
 * Montan la aplicación completa —la misma que construye `src/app.ts`— con
 * `fetch` mockeado y comprueban el flujo observable en el DOM.
 */

import { fireEvent, getByRole } from '@testing-library/dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../../src/app';
import { forecastOk, geocodingEmpty, geocodingOk, jsonResponse } from './fixtures';

function mountApp() {
  const root = document.createElement('div');
  document.body.appendChild(root);

  const search = document.createElement('div');
  const loading = document.createElement('div');
  const error = document.createElement('div');
  const weather = document.createElement('div');
  root.append(search, loading, error, weather);

  const app = createApp({ search, loading, error, weather });
  return { root, ...app };
}

function cityInput(root: HTMLElement): HTMLInputElement {
  const input = root.querySelector('input');
  if (input === null) throw new Error('City_Input no encontrado');
  return input;
}

function stubFetch(handler: (url: URL) => Response) {
  const fetchMock = vi.fn((input: string) => Promise.resolve(handler(new URL(input))));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('Flujo de extremo a extremo', () => {
  it('DEBE mostrar los datos del clima en el DOM tras una búsqueda exitosa', async () => {
    stubFetch((url) =>
      jsonResponse(url.hostname.includes('geocoding') ? geocodingOk : forecastOk),
    );
    const { root, weatherDisplay, loadingIndicator } = mountApp();

    cityInput(root).value = 'Berlin';
    fireEvent.click(getByRole(root, 'button'));

    await vi.waitFor(() => expect(weatherDisplay.root.textContent).toContain('Berlin'));

    expect(weatherDisplay.root.textContent).toContain('8.4 °C');
    expect(weatherDisplay.root.textContent).toContain('72 %');
    expect(weatherDisplay.root.textContent).toContain('0.0 mm');
    expect(loadingIndicator.root.hidden).toBe(true);
  });

  it('DEBE mostrar el mensaje de error y mantener City_Input accesible cuando falla la geocodificación', async () => {
    stubFetch(() => jsonResponse(geocodingEmpty));
    const { root, errorMessage, loadingIndicator } = mountApp();

    cityInput(root).value = 'Ciudad Inexistente';
    fireEvent.click(getByRole(root, 'button'));

    await vi.waitFor(() => expect(errorMessage.root.textContent).not.toBe(''));

    expect(errorMessage.root.textContent).toBe(
      'No se encontró la ciudad ingresada. Verifica el nombre e intenta de nuevo.',
    );
    expect(loadingIndicator.root.hidden).toBe(true);

    const input = cityInput(root);
    expect(input.disabled).toBe(false);
    expect(document.activeElement).toBe(input);
  });

  it('DEBE mostrar el mensaje de validación y no consultar la API con la entrada vacía', async () => {
    const fetchMock = stubFetch(() => jsonResponse(geocodingOk));
    const { root, errorMessage } = mountApp();

    fireEvent.click(getByRole(root, 'button'));

    await vi.waitFor(() =>
      expect(root.querySelector('.validation-message')?.textContent).toBe(
        'El nombre de la ciudad es obligatorio.',
      ),
    );

    expect(fetchMock).not.toHaveBeenCalled();
    expect(errorMessage.root.textContent).toBe('');
  });

  it('DEBE limpiar el resultado anterior al iniciar una nueva búsqueda', async () => {
    stubFetch((url) =>
      jsonResponse(url.hostname.includes('geocoding') ? geocodingOk : forecastOk),
    );
    const { root, weatherDisplay } = mountApp();

    cityInput(root).value = 'Berlin';
    fireEvent.click(getByRole(root, 'button'));
    await vi.waitFor(() => expect(weatherDisplay.root.textContent).toContain('Berlin'));

    cityInput(root).value = 'Paris';
    fireEvent.click(getByRole(root, 'button'));

    expect(weatherDisplay.root.textContent).toBe('');
  });
});
