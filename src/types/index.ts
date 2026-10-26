/**
 * Tipos del dominio de la aplicación.
 *
 * Los resultados de servicio son tipos discriminados por `success`: el
 * controlador decide qué pintar a partir de esa discriminante, sin `try/catch`
 * alrededor de la lógica de negocio (design.md §Servicios).
 */

/** Par de coordenadas geográficas de una ciudad. */
export interface Coordinates {
  latitude: number;
  longitude: number;
  /** Nombre retornado por la Geocoding API; puede faltar (BR-UI-05). */
  cityName?: string;
}

/** Datos meteorológicos actuales, con los valores crudos de la API (BR-FMT-01). */
export interface WeatherData {
  /** `temperature_2m` en °C. */
  temperature: number;
  /** `relative_humidity_2m` en %. */
  humidity: number;
  /** `precipitation` en mm. */
  precipitation: number;
}

export type GeocodingError =
  | { type: 'CITY_NOT_FOUND' }
  | { type: 'NETWORK_ERROR' }
  | { type: 'TIMEOUT' }
  | { type: 'SERVICE_ERROR'; statusCode: number }
  | { type: 'INVALID_RESPONSE' };

export type GeocodingResult =
  | { success: true; data: Coordinates }
  | { success: false; error: GeocodingError };

export type ForecastError =
  | { type: 'NETWORK_ERROR' }
  | { type: 'TIMEOUT' }
  | { type: 'SERVICE_ERROR'; statusCode: number }
  | { type: 'INCOMPLETE_DATA' }
  | { type: 'INVALID_RESPONSE' };

export type ForecastResult =
  | { success: true; data: WeatherData }
  | { success: false; error: ForecastError };

/** Error de validación de la entrada del usuario (Req. 1.3, 1.4). */
export interface ValidationError {
  type: 'VALIDATION_EMPTY';
}

/** Cualquier error de dominio que la UI pueda traducir a un mensaje. */
export type AppError = GeocodingError | ForecastError | ValidationError;

/** Servicio externo que falló; resuelve la identidad del error (D6). */
export type ServiceName = 'geocoding' | 'forecast';

export type AppState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; cityName: string; weather: WeatherData }
  | { status: 'error'; message: string };

/** Error lanzado por los clientes cuando la solicitud supera el timeout (BR-ERR-07). */
export class TimeoutError extends Error {
  constructor(message = 'La solicitud excedió el tiempo de espera.') {
    super(message);
    this.name = 'TimeoutError';
  }
}

/** Error lanzado por los clientes ante cualquier otro fallo de red (BR-ERR-07). */
export class NetworkError extends Error {
  constructor(message = 'No se pudo completar la solicitud de red.') {
    super(message);
    this.name = 'NetworkError';
  }
}
