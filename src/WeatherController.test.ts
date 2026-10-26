import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, getByRole } from '@testing-library/dom';
import { geocodingOk, forecastOk, jsonResponse } from '../tests/evals/fixtures';
import { CitySearchForm } from './components/CitySearchForm';
import { ErrorMessage } from './components/ErrorMessage';
import { LoadingIndicator } from './components/LoadingIndicator';
import { WeatherDisplay } from './components/WeatherDisplay';
import { GeocodingService } from './services/GeocodingService';
import { ForecastService } from './services/ForecastService';
import type { ForecastResult, GeocodingResult } from './types';
import { WeatherController } from './WeatherController';

const OK_GEOCODING: GeocodingResult = {
  success: true,
  data: { latitude: 52.52437, longitude: 13.41053, cityName: 'Berlin' },
};

const OK_FORECAST: ForecastResult = {
  success: true,
  data: { temperature: 8.4, humidity: 72, precipitation: 0.5 },
};

function setup(options?: {
  geocoding?: GeocodingResult;
  forecast?: ForecastResult;
}) {
  const container = document.createElement('div');
  document.body.appendChild(container);

  const searchContainer = document.createElement('div');
  const loadingContainer = document.createElement('div');
  const errorContainer = document.createElement('div');
  const weatherContainer = document.createElement('div');
  container.append(searchContainer, loadingContainer, errorContainer, weatherContainer);

  const geocode = vi.fn(
    async (_cityName: string): Promise<GeocodingResult> => options?.geocoding ?? OK_GEOCODING,
  );
  const getForecast = vi.fn(
    async (_latitude: number, _longitude: number): Promise<ForecastResult> =>
      options?.forecast ?? OK_FORECAST,
  );

  const citySearchForm = new CitySearchForm(searchContainer);
  const weatherDisplay = new WeatherDisplay(weatherContainer);
  const loadingIndicator = new LoadingIndicator(loadingContainer);
  const errorMessage = new ErrorMessage(errorContainer);

  const controller = new WeatherController({
    geocodingService: { geocode },
    forecastService: { getForecast },
    citySearchForm,
    weatherDisplay,
    loadingIndicator,
    errorMessage,
  });

  return {
    controller,
    citySearchForm,
    weatherDisplay,
    loadingIndicator,
    errorMessage,
    geocode,
    getForecast,
  };
}

/** Montaje con los servicios reales y `fetch` mockeado (sin llamadas a la red). */
function setupWithRealServices() {
  const container = document.createElement('div');
  document.body.appendChild(container);

  const searchContainer = document.createElement('div');
  const loadingContainer = document.createElement('div');
  const errorContainer = document.createElement('div');
  const weatherContainer = document.createElement('div');
  container.append(searchContainer, loadingContainer, errorContainer, weatherContainer);

  const fetchMock = vi.fn((input: string) => {
    const url = new URL(input);
    const body = url.hostname.includes('geocoding') ? geocodingOk : forecastOk;
    return Promise.resolve(jsonResponse(body));
  });
  vi.stubGlobal('fetch', fetchMock);

  const citySearchForm = new CitySearchForm(searchContainer);
  const weatherDisplay = new WeatherDisplay(weatherContainer);
  const loadingIndicator = new LoadingIndicator(loadingContainer);
  const errorMessage = new ErrorMessage(errorContainer);

  const controller = new WeatherController({
    geocodingService: new GeocodingService(),
    forecastService: new ForecastService(),
    citySearchForm,
    weatherDisplay,
    loadingIndicator,
    errorMessage,
  });

  return { controller, citySearchForm, weatherDisplay, fetchMock };
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('WeatherController', () => {
  it('DEBE completar el flujo exitoso: geocodificación → pronóstico → display renderizado', async () => {
    const { controller, weatherDisplay, geocode, getForecast } = setup();

    await controller.handleSearch('Berlin');

    expect(geocode).toHaveBeenCalledWith('Berlin');
    expect(getForecast).toHaveBeenCalledWith(52.52437, 13.41053);
    expect(weatherDisplay.root.textContent).toContain('Berlin');
    expect(weatherDisplay.root.textContent).toContain('8.4 °C');
    expect(weatherDisplay.root.textContent).toContain('72 %');
    expect(weatherDisplay.root.textContent).toContain('0.5 mm');
    expect(controller.getState().status).toBe('success');
  });

  it('DEBE mostrar el mensaje de ciudad no encontrada y no pedir el pronóstico', async () => {
    const { controller, errorMessage, getForecast } = setup({
      geocoding: { success: false, error: { type: 'CITY_NOT_FOUND' } },
    });

    await controller.handleSearch('Ciudad Inexistente');

    expect(errorMessage.root.textContent).toBe(
      'No se encontró la ciudad ingresada. Verifica el nombre e intenta de nuevo.',
    );
    expect(getForecast).not.toHaveBeenCalled();
    expect(controller.getState().status).toBe('error');
  });

  it('DEBE mostrar el mensaje de datos meteorológicos incompletos', async () => {
    const { controller, errorMessage } = setup({
      forecast: { success: false, error: { type: 'INCOMPLETE_DATA' } },
    });

    await controller.handleSearch('Berlin');

    expect(errorMessage.root.textContent).toBe(
      'Los datos meteorológicos recibidos están incompletos.',
    );
  });

  it('DEBE mostrar el indicador de carga al iniciar y ocultarlo al completar', async () => {
    const { controller, loadingIndicator, geocode } = setup();
    let resolveGeocode: (result: GeocodingResult) => void = () => {};
    geocode.mockReturnValueOnce(
      new Promise<GeocodingResult>((resolve) => {
        resolveGeocode = resolve;
      }),
    );

    const promise = controller.handleSearch('Berlin');
    expect(loadingIndicator.root.hidden).toBe(false);

    resolveGeocode(OK_GEOCODING);
    await promise;

    expect(loadingIndicator.root.hidden).toBe(true);
  });

  it('DEBE ocultar el indicador de carga cuando falla la geocodificación', async () => {
    const { controller, loadingIndicator } = setup({
      geocoding: { success: false, error: { type: 'NETWORK_ERROR' } },
    });

    await controller.handleSearch('Berlin');

    expect(loadingIndicator.root.hidden).toBe(true);
  });

  it('DEBE ocultar el indicador de carga cuando falla el pronóstico', async () => {
    const { controller, loadingIndicator } = setup({
      forecast: { success: false, error: { type: 'TIMEOUT' } },
    });

    await controller.handleSearch('Berlin');

    expect(loadingIndicator.root.hidden).toBe(true);
  });

  it('DEBE limpiar el error previo al iniciar una nueva búsqueda', async () => {
    const { controller, errorMessage, geocode } = setup({
      geocoding: { success: false, error: { type: 'CITY_NOT_FOUND' } },
    });
    await controller.handleSearch('Ciudad Inexistente');
    expect(errorMessage.root.textContent).not.toBe('');

    geocode.mockResolvedValueOnce(OK_GEOCODING);
    const promise = controller.handleSearch('Berlin');

    expect(errorMessage.root.textContent).toBe('');

    await promise;
  });

  it('DEBE descartar la respuesta de una búsqueda anterior', async () => {
    const { controller, weatherDisplay, geocode, getForecast } = setup();
    let resolveFirst: (result: GeocodingResult) => void = () => {};
    geocode
      .mockReturnValueOnce(
        new Promise<GeocodingResult>((resolve) => {
          resolveFirst = resolve;
        }),
      )
      .mockResolvedValueOnce({
        success: true,
        data: { latitude: 1, longitude: 2, cityName: 'Segunda' },
      });

    const first = controller.handleSearch('Primera');
    const second = controller.handleSearch('Segunda');

    resolveFirst({
      success: true,
      data: { latitude: 9, longitude: 9, cityName: 'Primera' },
    });
    await first;
    await second;

    expect(getForecast).toHaveBeenCalledTimes(1);
    expect(getForecast).toHaveBeenCalledWith(1, 2);
    expect(weatherDisplay.root.textContent).toContain('Segunda');
    expect(weatherDisplay.root.textContent).not.toContain('Primera');
  });

  it('DEBE devolver el foco a City_Input tras un error y mantenerlo habilitado', async () => {
    const { controller, citySearchForm } = setup({
      geocoding: { success: false, error: { type: 'NETWORK_ERROR' } },
    });

    await controller.handleSearch('Berlin');

    const input = citySearchForm.root.querySelector('input');
    expect(input).not.toBeNull();
    expect(input?.disabled).toBe(false);
    expect(document.activeElement).toBe(input);
  });

  it('DEBE devolver el foco a City_Input tras un error del pronóstico', async () => {
    const { controller, citySearchForm } = setup({
      forecast: { success: false, error: { type: 'INVALID_RESPONSE' } },
    });

    await controller.handleSearch('Berlin');

    const input = citySearchForm.root.querySelector('input');
    expect(document.activeElement).toBe(input);
  });

  it('DEBE conectar el callback onSearch del formulario con el controlador', async () => {
    const { controller, citySearchForm, geocode } = setup();

    citySearchForm.onSearch('Berlin');

    await vi.waitFor(() => expect(geocode).toHaveBeenCalledWith('Berlin'));
    await vi.waitFor(() => expect(controller.getState().status).toBe('success'));
  });

  it('DEBE enviar el nombre recortado como parámetro name de la URL de geocodificación', async () => {
    const { controller, citySearchForm, fetchMock } = setupWithRealServices();

    // El recorte ocurre en `CitySearchForm` (D5): el controlador ya recibe el
    // valor recortado. La cadena completa se ejercita desde el formulario.
    const input = citySearchForm.root.querySelector('input');
    if (input === null) throw new Error('City_Input no encontrado');
    input.value = '  Berlin  ';
    fireEvent.click(getByRole(citySearchForm.root, 'button'));

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalled());

    const url = new URL(fetchMock.mock.calls[0]?.[0] as string);
    expect(url.searchParams.get('name')).toBe('Berlin');
    await vi.waitFor(() => expect(controller.getState().status).toBe('success'));
  });
});
