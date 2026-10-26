/**
 * Composition root de la aplicación.
 *
 * Instancia y cablea las cuatro capas (clientes → servicios → componentes →
 * controlador). Vive en su propio módulo para que la prueba de extremo a
 * extremo pueda montar exactamente la misma aplicación que el navegador.
 */

import { ForecastClient } from './clients/ForecastClient';
import { GeocodingClient } from './clients/GeocodingClient';
import { CitySearchForm } from './components/CitySearchForm';
import { ErrorMessage } from './components/ErrorMessage';
import { LoadingIndicator } from './components/LoadingIndicator';
import { WeatherDisplay } from './components/WeatherDisplay';
import { ForecastService } from './services/ForecastService';
import { GeocodingService } from './services/GeocodingService';
import { WeatherController } from './WeatherController';

export interface AppContainers {
  search: HTMLElement;
  loading: HTMLElement;
  error: HTMLElement;
  weather: HTMLElement;
}

export interface App {
  controller: WeatherController;
  citySearchForm: CitySearchForm;
  weatherDisplay: WeatherDisplay;
  loadingIndicator: LoadingIndicator;
  errorMessage: ErrorMessage;
}

export function createApp(containers: AppContainers): App {
  const citySearchForm = new CitySearchForm(containers.search);
  const weatherDisplay = new WeatherDisplay(containers.weather);
  const loadingIndicator = new LoadingIndicator(containers.loading);
  const errorMessage = new ErrorMessage(containers.error);

  const controller = new WeatherController({
    geocodingService: new GeocodingService(new GeocodingClient()),
    forecastService: new ForecastService(new ForecastClient()),
    citySearchForm,
    weatherDisplay,
    loadingIndicator,
    errorMessage,
  });

  return { controller, citySearchForm, weatherDisplay, loadingIndicator, errorMessage };
}
