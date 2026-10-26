/**
 * Formateo de valores meteorológicos para la capa de presentación.
 *
 * Los servicios entregan valores crudos; el formateo ocurre únicamente aquí
 * (BR-FMT-01).
 */

/** Temperatura en grados Celsius con un máximo de un decimal (BR-FMT-02). */
export function formatTemperature(value: number): string {
  return `${value.toFixed(1)} °C`;
}

/** Humedad relativa en porcentaje, como número entero (BR-FMT-03). */
export function formatHumidity(value: number): string {
  return `${Math.round(value)} %`;
}

/** Precipitación en milímetros con un máximo de un decimal (BR-FMT-04). */
export function formatPrecipitation(value: number): string {
  return `${value.toFixed(1)} mm`;
}
