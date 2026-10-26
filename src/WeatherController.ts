/**
 * Orquestador del flujo de búsqueda del clima.
 *
 * Recibe el nombre de la ciudad ya validado y recortado, coordina los dos
 * servicios y actualiza la UI a partir de un `AppState`. **No valida la
 * entrada**: esa responsabilidad es de `CitySearchForm` (BR-UI-10).
 *
 * Cada búsqueda recibe un token; al resolver cualquier `await` se descarta el
 * resultado si el token ya no es el vigente, de modo que solo la búsqueda más
 * reciente actualiza la UI (Req. 4.8, BR-UI-09).
 */

import type { CitySearchForm } from './components/CitySearchForm';
import type { ErrorMessage } from './components/ErrorMessage';
import type { LoadingIndicator } from './components/LoadingIndicator';
import type { WeatherDisplay } from './components/WeatherDisplay';
import type { GeocodingServicePort } from './services/GeocodingService';
import type { ForecastServicePort } from './services/ForecastService';
import type { AppError, AppState, ServiceName } from './types';
import { getErrorMessage } from './utils/errorMessages';

export type CitySearchFormPort = Pick<CitySearchForm, 'onSearch' | 'focus'>;
export type WeatherDisplayPort = Pick<WeatherDisplay, 'render' | 'clear'>;
export type LoadingIndicatorPort = Pick<LoadingIndicator, 'show' | 'hide'>;
export type ErrorMessagePort = Pick<ErrorMessage, 'show' | 'clear'>;

export interface WeatherControllerDependencies {
  geocodingService: GeocodingServicePort;
  forecastService: ForecastServicePort;
  citySearchForm: CitySearchFormPort;
  weatherDisplay: WeatherDisplayPort;
  loadingIndicator: LoadingIndicatorPort;
  errorMessage: ErrorMessagePort;
}

export class WeatherController {
  private state: AppState = { status: 'idle' };
  private requestToken = 0;

  constructor(private readonly deps: WeatherControllerDependencies) {
    this.deps.citySearchForm.onSearch = (cityName: string) => {
      void this.handleSearch(cityName);
    };
  }

  getState(): AppState {
    return this.state;
  }

  async handleSearch(cityName: string): Promise<void> {
    const token = ++this.requestToken;

    this.state = { status: 'loading' };
    this.deps.weatherDisplay.clear();
    this.deps.errorMessage.clear();
    this.deps.loadingIndicator.show();

    const geocoding = await this.deps.geocodingService.geocode(cityName);
    if (!this.isCurrent(token)) return;

    if (!geocoding.success) {
      this.finishWithError('geocoding', geocoding.error);
      return;
    }

    const forecast = await this.deps.forecastService.getForecast(
      geocoding.data.latitude,
      geocoding.data.longitude,
    );
    if (!this.isCurrent(token)) return;

    if (!forecast.success) {
      this.finishWithError('forecast', forecast.error);
      return;
    }

    this.state = {
      status: 'success',
      cityName: geocoding.data.cityName ?? cityName,
      weather: forecast.data,
    };
    this.deps.weatherDisplay.render(forecast.data, geocoding.data.cityName, cityName);
    this.deps.loadingIndicator.hide();
    this.deps.citySearchForm.focus();
  }

  /** Indica si la búsqueda en curso sigue siendo la más reciente (BR-UI-09). */
  private isCurrent(token: number): boolean {
    return token === this.requestToken;
  }

  private finishWithError(service: ServiceName, error: AppError): void {
    const message = getErrorMessage(service, error);
    this.state = { status: 'error', message };
    this.deps.errorMessage.show(message);
    this.deps.loadingIndicator.hide();
    this.deps.citySearchForm.focus();
  }
}
