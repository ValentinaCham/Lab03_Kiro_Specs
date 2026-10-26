import fc from 'fast-check';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { assertPropertyAsync } from '../tests/evals/props';
import { CitySearchForm } from './components/CitySearchForm';
import { ErrorMessage } from './components/ErrorMessage';
import { LoadingIndicator } from './components/LoadingIndicator';
import { WeatherDisplay } from './components/WeatherDisplay';
import type { GeocodingResult } from './types';
import { WeatherController } from './WeatherController';

const finiteValue = (): fc.Arbitrary<number> =>
  fc.double({ noNaN: true, noDefaultInfinity: true, min: -1e6, max: 1e6 });

afterEach(() => {
  document.body.innerHTML = '';
});

describe('WeatherController', () => {
  // Feature: weather-forecast-app, Propiedad 13: Limpieza del Weather_Display al iniciar nueva búsqueda
  it('P13: limpieza del Weather_Display al iniciar nueva búsqueda', async () => {
    await assertPropertyAsync(
      fc.asyncProperty(
        fc.record({
          temperature: finiteValue(),
          humidity: finiteValue(),
          precipitation: finiteValue(),
        }),
        fc.string({ minLength: 1 }),
        async (weather, cityName) => {
          const container = document.createElement('div');
          document.body.appendChild(container);

          const citySearchForm = new CitySearchForm(document.createElement('div'));
          const weatherDisplay = new WeatherDisplay(document.createElement('div'));
          const loadingIndicator = new LoadingIndicator(document.createElement('div'));
          const errorMessage = new ErrorMessage(document.createElement('div'));

          // Estado previo: el display contiene datos de una búsqueda anterior.
          weatherDisplay.render(weather, 'Ciudad Previa', 'Ciudad Previa');
          expect(weatherDisplay.root.textContent).not.toBe('');

          const callOrder: string[] = [];
          vi.spyOn(weatherDisplay, 'clear').mockImplementation(() => {
            callOrder.push('display.clear');
          });

          const geocodeResult: GeocodingResult = {
            success: true,
            data: { latitude: 52.52, longitude: 13.42, cityName: 'Ciudad Previa' },
          };
          const geocode = vi.fn(async (_cityName: string): Promise<GeocodingResult> => {
            callOrder.push('geocode');
            return geocodeResult;
          });

          const controller = new WeatherController({
            geocodingService: { geocode },
            forecastService: {
              getForecast: async () => ({
                success: true,
                data: { temperature: 0, humidity: 0, precipitation: 0 },
              }),
            },
            citySearchForm,
            weatherDisplay,
            loadingIndicator,
            errorMessage,
          });

          await controller.handleSearch(cityName);

          expect(callOrder).toContain('display.clear');
          expect(callOrder).toContain('geocode');
          expect(callOrder.indexOf('display.clear')).toBeLessThan(callOrder.indexOf('geocode'));
        },
      ),
    );
  });
});
