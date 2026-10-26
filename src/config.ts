/**
 * Constantes de configuración de la aplicación.
 * Ningún cliente HTTP debe hardcodear URLs ni tiempos de espera (BR-ERR-01).
 */

export const API_TIMEOUT_MS = 10_000;

export const GEOCODING_BASE_URL = 'https://geocoding-api.open-meteo.com/v1/search';

export const FORECAST_BASE_URL = 'https://api.open-meteo.com/v1/forecast';

/** Variables actuales del pronóstico solicitadas a la Forecast API (BR-FCT-01). */
export const CURRENT_FIELDS = 'temperature_2m,relative_humidity_2m,precipitation';

export const MAX_CITY_NAME_LENGTH = 100;
