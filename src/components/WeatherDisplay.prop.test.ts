import fc from 'fast-check';
import { describe, expect, it, afterEach } from 'vitest';
import { assertPropertyAsync } from '../../tests/evals/props';
import { formatHumidity, formatPrecipitation, formatTemperature } from '../utils/formatters';
import { WeatherDisplay } from './WeatherDisplay';

const finiteValue = (): fc.Arbitrary<number> =>
  fc.double({ noNaN: true, noDefaultInfinity: true, min: -1e6, max: 1e6 });

afterEach(() => {
  document.body.innerHTML = '';
});

describe('WeatherDisplay', () => {
  // Feature: weather-forecast-app, Propiedad 12: Weather_Display contiene todos los campos con sus unidades
  it('P12: Weather_Display contiene todos los campos con sus unidades', async () => {
    await assertPropertyAsync(
      fc.asyncProperty(
        fc.record({
          temperature: finiteValue(),
          humidity: finiteValue(),
          precipitation: finiteValue(),
        }),
        fc.string(),
        async (weather, cityName) => {
          const container = document.createElement('div');
          document.body.appendChild(container);
          const display = new WeatherDisplay(container);

          display.render(weather, cityName, 'Nombre Escribido');

          const text = display.root.textContent ?? '';
          expect(text).toContain(cityName);
          expect(text).toContain(formatTemperature(weather.temperature));
          expect(text).toContain(formatHumidity(weather.humidity));
          expect(text).toContain(formatPrecipitation(weather.precipitation));
        },
      ),
    );
  });
});
