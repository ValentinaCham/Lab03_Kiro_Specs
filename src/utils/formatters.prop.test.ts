import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { assertProperty } from '../../tests/evals/props';
import { formatHumidity, formatPrecipitation, formatTemperature } from './formatters';

const finiteValue = (): fc.Arbitrary<number> =>
  fc.double({ noNaN: true, noDefaultInfinity: true, min: -1e6, max: 1e6 });

/** Cantidad de dígitos decimales de la parte numérica de una cadena formateada. */
function decimalPlaces(formatted: string): number {
  const numeric = formatted.replace(/[^\d.-]/g, '');
  const dot = numeric.indexOf('.');
  return dot === -1 ? 0 : numeric.length - dot - 1;
}

describe('formatters', () => {
  // Feature: weather-forecast-app, Propiedad 11: Formateo numérico correcto de los valores del clima
  it('P11: formateo numérico correcto de los valores del clima', () => {
    assertProperty(
      fc.property(
        finiteValue(),
        finiteValue(),
        finiteValue(),
        (temperature, humidity, precipitation) => {
          const formattedTemperature = formatTemperature(temperature);
          expect(formattedTemperature.endsWith(' °C')).toBe(true);
          expect(decimalPlaces(formattedTemperature)).toBeLessThanOrEqual(1);
          expect(Number.parseFloat(formattedTemperature)).toBe(Number(temperature.toFixed(1)));

          const formattedHumidity = formatHumidity(humidity);
          expect(formattedHumidity.endsWith(' %')).toBe(true);
          expect(formattedHumidity).not.toContain('.');
          // `+ 0` normaliza -0 a +0: `String(-0)` es "0", así que el texto
          // formateado no puede conservar el signo del cero.
          expect(Number.parseInt(formattedHumidity, 10)).toBe(Math.round(humidity) + 0);

          const formattedPrecipitation = formatPrecipitation(precipitation);
          expect(formattedPrecipitation.endsWith(' mm')).toBe(true);
          expect(decimalPlaces(formattedPrecipitation)).toBeLessThanOrEqual(1);
          expect(Number.parseFloat(formattedPrecipitation)).toBe(Number(precipitation.toFixed(1)));
        },
      ),
    );
  });
});
