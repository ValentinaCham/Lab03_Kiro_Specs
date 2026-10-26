/**
 * Fixtures de prueba derivados de `design.md` §Data Models.
 * Son la única fuente de datos de API dentro de las pruebas: nunca se llama a
 * la red real (BR-TST-01).
 */

export const geocodingOk = {
  results: [
    {
      id: 2950159,
      name: 'Berlin',
      latitude: 52.52437,
      longitude: 13.41053,
      country: 'Germany',
      country_code: 'DE',
      admin1: 'Berlin',
    },
  ],
};

export const geocodingEmpty = {
  results: [],
};

export const geocodingMissingCoords = {
  results: [
    {
      id: 2950160,
      name: 'Ciudad Sin Coordenadas',
      country: 'Nowhere',
    },
  ],
};

export const forecastOk = {
  latitude: 52.52,
  longitude: 13.42,
  generationtime_ms: 0.123,
  utc_offset_seconds: 0,
  timezone: 'GMT',
  current_units: {
    time: 'iso8601',
    temperature_2m: '°C',
    relative_humidity_2m: '%',
    precipitation: 'mm',
  },
  current: {
    time: '2024-01-15T12:00',
    temperature_2m: 8.4,
    relative_humidity_2m: 72,
    precipitation: 0.0,
  },
};

export const forecastIncomplete = {
  ...forecastOk,
  current: {
    time: '2024-01-15T12:00',
    temperature_2m: null,
    relative_humidity_2m: 72,
    precipitation: 0,
  },
};

/** Cuerpo que no es JSON: dispara `INVALID_RESPONSE`. */
export const forecastMalformed = '<html><body>No soy JSON</body></html>';

/** Construye una `Response` con cuerpo JSON. */
export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** Construye una `Response` con cuerpo de texto plano (no parseable como JSON). */
export function textResponse(body: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: { 'Content-Type': 'text/html' },
  });
}
