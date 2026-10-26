/**
 * Panel de visualización del clima.
 *
 * Todo el contenido externo se escribe con `textContent`: nunca con `innerHTML`
 * (BR-SEC-01, Req. 6.5). El nombre de la ciudad se muestra tal como lo
 * devolvió la API y, si falta, se usa el que escribió el usuario (BR-UI-05).
 */

import type { WeatherData } from '../types';
import { formatHumidity, formatPrecipitation, formatTemperature } from '../utils/formatters';

export class WeatherDisplay {
  readonly root: HTMLElement;

  constructor(container: HTMLElement) {
    this.root = document.createElement('section');
    this.root.className = 'weather-display';
    this.root.setAttribute('aria-live', 'polite');
    container.appendChild(this.root);
  }

  /**
   * @param weather Valores crudos del clima.
   * @param apiCityName Nombre retornado por la Geocoding API; puede faltar.
   * @param typedCityName Nombre ingresado por el usuario, usado como fallback.
   */
  render(weather: WeatherData, apiCityName: string | undefined, typedCityName: string): void {
    const cityName =
      apiCityName !== undefined && apiCityName.trim().length > 0 ? apiCityName : typedCityName;

    const heading = document.createElement('h2');
    heading.className = 'weather-city';
    heading.textContent = cityName;

    const values = document.createElement('dl');
    values.className = 'weather-values';
    values.append(
      this.buildValue('Temperatura', 'weather-temperature', formatTemperature(weather.temperature)),
      this.buildValue('Humedad', 'weather-humidity', formatHumidity(weather.humidity)),
      this.buildValue(
        'Precipitación',
        'weather-precipitation',
        formatPrecipitation(weather.precipitation),
      ),
    );

    this.root.replaceChildren(heading, values);
  }

  /** Limpia el contenido del panel (Req. 4.6). */
  clear(): void {
    this.root.replaceChildren();
  }

  private buildValue(label: string, className: string, value: string): HTMLElement {
    const group = document.createElement('div');
    group.className = 'weather-value';

    const term = document.createElement('dt');
    term.textContent = label;

    const description = document.createElement('dd');
    description.className = className;
    description.textContent = value;

    group.append(term, description);
    return group;
  }
}
