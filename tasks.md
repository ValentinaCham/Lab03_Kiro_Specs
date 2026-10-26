# Implementation Plan: weather-forecast-app

## Overview

Implementación de una SPA estática (HTML/CSS/TypeScript vanilla) que permite al usuario buscar el pronóstico del clima de una ciudad. La aplicación consulta la Geocoding API y la Forecast API de Open-Meteo sin backend propio. Las capas son: Presentación → WeatherController → GeocodingService / ForecastService → Clientes HTTP. El framework de testing es Vitest + fast-check.

## Tasks

- [x] 1. Configurar la estructura del proyecto y la cadena de herramientas
  - Inicializar el proyecto con `npm init` y configurar TypeScript (`tsconfig.json`) con modo estricto.
  - Instalar Vite (dev server y build; justificado en `design.md` §Decisiones: el navegador no ejecuta TypeScript).
  - Instalar y configurar Vitest con entorno `jsdom`; instalar fast-check (fijar versión mayor; `fc.stringOf` no existe en v4) y `@testing-library/dom`.
  - Definir los scripts de `package.json`: `test`, `test:unit`, `test:property`, `test:e2e`, `eval`, `typecheck`, `verify` (`typecheck && test && eval`).
  - Crear la estructura de carpetas: `src/clients/`, `src/services/`, `src/components/`, `src/utils/`, `src/types/`, `tests/evals/`.
  - Crear `src/config.ts` con `API_TIMEOUT_MS = 10_000`, `GEOCODING_BASE_URL` y `FORECAST_BASE_URL`.
  - Crear `tests/evals/evals.manifest.ts` (interfaz `EvalDefinition` de `AGENTS.md` §5.3) y `tests/evals/fixtures.ts` con los seis fixtures de `AGENTS.md` §5.4.
  - Crear el punto de entrada `index.html` y `src/main.ts`.
  - _Requisitos: 1.1, 1.2_

- [ ] 2. Definir tipos e interfaces centrales
  - [x] 2.1
    - Definir `Coordinates`, `WeatherData`, `AppState`.
    - Definir los tipos discriminados `GeocodingResult`, `GeocodingError`, `ForecastResult`, `ForecastError`.
    - `Coordinates.cityName` es opcional (`cityName?: string`).
    - Definir las clases de error de cliente `TimeoutError` y `NetworkError` (BR-ERR-07).
    - Exportar todos los tipos para su uso en el resto de capas.
    - _Requisitos: 2.2, 3.2, 5.1, 5.2_

- [ ] 3. Implementar los clientes HTTP
  - [x] 3.1
    - Construir la URL hacia `https://geocoding-api.open-meteo.com/v1/search` con los parámetros `name` (URL-encoded) y `count=1`.
    - Implementar timeout con `API_TIMEOUT_MS` usando `AbortController` y `setTimeout`; `clearTimeout` al recibir la respuesta.
    - Retornar la respuesta cruda (`Response`) o lanzar `TimeoutError` (timeout) / `NetworkError` (otro fallo de `fetch`).
    - Usar `GEOCODING_BASE_URL` de `src/config.ts`.
    - _Requisitos: 2.1, 2.4_

  - [x] 3.2
    - **Propiedad 3: Construcción correcta de la URL de Geocodificación**
    - Usar `fc.string({ minLength: 1 })` para generar nombres de ciudad arbitrarios.
    - Decodificar la URL (`new URL(...).searchParams`) y verificar que `name` sea igual al nombre original y que `count=1` esté presente (no comparar cadenas: `+` y `%20` son equivalentes).
    - **Valida: Requisito 2.1**

  - [x] 3.3
    - Construir la URL hacia `https://api.open-meteo.com/v1/forecast` con `latitude`, `longitude` y `current=temperature_2m,relative_humidity_2m,precipitation`.
    - Implementar timeout con `API_TIMEOUT_MS` usando `AbortController` y `setTimeout`; `clearTimeout` al recibir la respuesta.
    - Retornar la respuesta cruda (`Response`) o lanzar `TimeoutError` / `NetworkError`.
    - Usar `FORECAST_BASE_URL` de `src/config.ts`.
    - _Requisitos: 3.1, 3.3_

  - [x] 3.4
    - **Propiedad 6: Construcción correcta de la URL de Pronóstico**
    - Usar `fc.tuple(fc.float({ min: -90, max: 90 }), fc.float({ min: -180, max: 180 }))` para generar pares de coordenadas.
    - Verificar que la URL contenga `latitude`, `longitude` y el parámetro `current` con las tres variables requeridas.
    - **Valida: Requisito 3.1**

  - [x] 3.5
    - Con `vi.useFakeTimers`: no aborta a 9 999 ms y aborta a 10 000 ms lanzando `TimeoutError`.
    - Un fallo de `fetch` lanza `NetworkError` (distinto de `TimeoutError`).
    - `clearTimeout` se invoca tras una respuesta exitosa.
    - El cliente devuelve la `Response` sin leer el cuerpo.
    - _Requisitos: 2.4, 3.3 · BR-ERR-01, BR-ERR-05, BR-ERR-07, BR-ERR-08_

- [ ] 4. Implementar GeocodingService
  - [x] 4.1
    - Recibir `cityName: string` y llamar a `GeocodingClient`.
    - Validar que `results` exista y no esté vacío; si lo está, retornar `{ success: false, error: { type: 'CITY_NOT_FOUND' } }`.
    - Validar que `results[0].latitude` y `results[0].longitude` sean números finitos presentes y dentro de rango (lat ∈ [-90, 90], lon ∈ [-180, 180]); si alguno falta, es nulo, no numérico o está fuera de rango, retornar `CITY_NOT_FOUND` (BR-FCT-03).
    - Mapear `results[0]` a `Coordinates` sin transformar los valores.
    - Distinguir `TimeoutError` y `NetworkError` con `instanceof` y retornar `TIMEOUT` / `NETWORK_ERROR`.
    - Capturar respuestas HTTP no-2xx y retornar `SERVICE_ERROR` con el código de estado.
    - Capturar fallos de parseo JSON y retornar `INVALID_RESPONSE`.
    - `cityName` se copia sin transformar y puede quedar `undefined`.
    - _Requisitos: 2.2, 2.3, 2.4, 2.6, 2.7, 3.6, 5.1, 5.4, 5.5_

  - [x] 4.2
    - **Propiedad 4: Extracción de coordenadas del primer resultado**
    - Usar `fc.record({ latitude: fc.double({ min: -90, max: 90, noNaN: true }), longitude: fc.double({ min: -180, max: 180, noNaN: true }), name: fc.string() })` para generar resultados de API válidos (finitos).
    - Verificar que los valores extraídos sean numéricamente iguales a los del primer elemento sin ninguna transformación.
    - **Valida: Requisitos 2.2, 5.1**

  - [x] 4.3
    - **Propiedad 5: Validación de campos de coordenadas faltantes**
    - Generar `latitude` y `longitude` de forma **independiente**: `null`, `undefined`, ausente, string o fuera de rango; asegurar que al menos uno sea inválido (el otro puede ser válido).
    - Verificar que el resultado sea `CITY_NOT_FOUND` y que no se haya llamado a `ForecastService`.
    - **Valida: Requisitos 2.6, 3.6**

  - [x] 4.4
    - **Propiedad 8 (parte Geocoding): Respuestas HTTP no-2xx siempre generan error**
    - Usar `fc.integer({ min: 300, max: 599 })` para generar códigos de estado no exitosos.
    - Verificar que el resultado sea `{ success: false, error: { type: 'SERVICE_ERROR', statusCode } }` con el código generado.
    - **Valida: Requisitos 2.7, 5.4**

  - [x] 4.5
    - Probar: respuesta con 0 resultados → `CITY_NOT_FOUND`.
    - Probar: error de red → `NETWORK_ERROR`.
    - Probar: timeout simulado → `TIMEOUT`.
    - Probar: respuesta exitosa con un resultado válido → `{ success: true, data: Coordinates }`.
    - Probar: coordenadas fuera de rango → `CITY_NOT_FOUND`.
    - Probar: resultado sin `name` → éxito con `cityName` indefinido (no es error).
    - Probar: 2xx con HTML en lugar de JSON → `INVALID_RESPONSE`.
    - _Requisitos: 2.2, 2.3, 2.4, 2.6, 3.6, 5.5_

- [ ] 5. Implementar ForecastService
  - [x] 5.1
    - Recibir `lat: number, lon: number` y llamar a `ForecastClient`.
    - Validar que `current.temperature_2m`, `current.relative_humidity_2m` y `current.precipitation` sean valores numéricos presentes (no nulos ni undefined); si alguno falta, retornar `{ success: false, error: { type: 'INCOMPLETE_DATA' } }`.
    - Mapear `current` a `WeatherData` sin transformar los valores crudos.
    - Validar además que los tres valores sean números finitos (no `NaN`) y tratar `0` como válido.
    - Capturar errores de red, timeout (por tipo de error), HTTP no-2xx e `INVALID_RESPONSE` de forma análoga a `GeocodingService`.
    - _Requisitos: 3.2, 3.3, 3.4, 3.5, 5.2, 5.4, 5.5_

  - [x] 5.2
    - **Propiedad 7: Round-trip de parseo de la respuesta Forecast → WeatherData**
    - Usar `fc.record({ temperature_2m: fc.double({ noNaN: true, noDefaultInfinity: true, min: -100, max: 100 }), relative_humidity_2m: fc.double({ noNaN: true, noDefaultInfinity: true, min: 0, max: 100 }), precipitation: fc.double({ noNaN: true, noDefaultInfinity: true, min: 0, max: 1000 }) })` para generar objetos `current` válidos.
    - Verificar que los valores en `WeatherData` sean numéricamente iguales a los del JSON crudo.
    - **Valida: Requisitos 3.2, 5.2**

  - [x] 5.3
    - **Propiedad 10: Campos meteorológicos faltantes generan error de datos incompletos**
    - Generar combinaciones de objetos `current` donde al menos uno de los tres campos sea `null`, `undefined` o esté ausente.
    - Verificar que el resultado sea `{ success: false, error: { type: 'INCOMPLETE_DATA' } }`.
    - **Valida: Requisito 3.5**

  - [x] 5.4
    - **Propiedad 8 (parte Forecast): Respuestas HTTP no-2xx siempre generan error**
    - Usar `fc.integer({ min: 300, max: 599 })` para generar códigos de estado no exitosos.
    - Verificar que el resultado sea `{ success: false, error: { type: 'SERVICE_ERROR', statusCode } }`.
    - **Valida: Requisitos 3.4, 5.4**

  - [x] 5.5
    - **Propiedad 9 (parte Forecast): Respuestas 2xx con cuerpo inválido generan error**
    - Generar strings malformados u objetos sin los campos requeridos del JSON de Forecast.
    - Verificar que el resultado sea `{ success: false, error: { type: 'INVALID_RESPONSE' } }`.
    - **Valida: Requisito 5.5**

  - [x] 5.6
    - Probar: error de red → `NETWORK_ERROR`.
    - Probar: timeout simulado → `TIMEOUT`.
    - Probar: respuesta exitosa con todos los campos presentes → `{ success: true, data: WeatherData }`.
    - Probar: valor `0` en un campo meteorológico es válido (BR §10).
    - _Requisitos: 3.2, 3.3, 3.4, 3.5_

- [x] 6. Punto de control — Verificar servicios y clientes
  - Asegurarse de que todas las pruebas de los módulos `clients/` y `services/` pasen sin errores. Consultar al usuario si surge alguna duda.

- [ ] 7. Implementar utilidades de formateo
  - [x] 7.1
    - Exportar `formatTemperature(value: number): string` → `value.toFixed(1) + ' °C'`.
    - Exportar `formatHumidity(value: number): string` → `Math.round(value) + ' %'`.
    - Exportar `formatPrecipitation(value: number): string` → `value.toFixed(1) + ' mm'`.
    - _Requisitos: 5.3_

  - [x] 7.2
    - **Propiedad 11: Formateo numérico correcto de los valores del clima**
    - Usar `fc.double({ noNaN: true, noDefaultInfinity: true, min: -1e6, max: 1e6 })` para temperatura y precipitación; verificar que la cadena resultante tenga como máximo 1 dígito decimal.
    - Usar el mismo generador para humedad; verificar que la cadena resultante no contenga punto decimal.
    - **Valida: Requisito 5.3**

  - [x] 7.3
    - Exportar `getErrorMessage(service: 'geocoding' | 'forecast', error): string` con el catálogo exacto de `BUSSINESS_RULES.md` §7 (incluye `VALIDATION_EMPTY` y `CITY_NOT_FOUND`).
    - Resolver aquí la identidad del servicio que falló (`SERVICE_ERROR` es igual en ambos servicios).
    - _Requisitos: 1.3, 1.4, 2.3, 2.4, 2.7, 3.3, 3.4, 3.5, 5.4, 5.5_

  - [x] 7.4
    - Probar los 11 casos del catálogo con el mensaje **exacto** y que los dos servicios producen mensajes distintos para el mismo tipo de error.
    - _Requisitos: 2.4, 2.7, 3.3, 3.4, 5.4 · BR-ERR-02, BR-TST-08_

- [ ] 8. Implementar componentes de UI
  - [ ] 8.1 Implementar `src/components/CitySearchForm.ts`
    - Renderizar el campo `City_Input` con `maxlength="100"`, un `<label>` asociado y el botón de envío.
    - Manejar el evento `submit` del formulario y el evento `keydown` para la tecla Enter en `City_Input`.
    - Mostrar mensaje de validación inline (región `aria-live`) cuando la entrada esté vacía o sea solo whitespace; es la única validación de la app (BR-UI-10).
    - Limpiar el mensaje al editar el campo o al enviar una búsqueda válida.
    - Emitir un callback `onSearch(cityName: string)` hacia el controlador con el valor recortado.
    - Exponer `focus()` para devolver el foco tras un error.
    - _Requisitos: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 6.1, 6.3_

  - [ ] 8.2 Escribir prueba de propiedad para CitySearchForm — rechazo de entradas de solo whitespace
    - **Propiedad 1: Rechazo de entradas de solo whitespace**
    - Usar `fc.stringOf(fc.constantFrom(' ', '\t', '\n', '\r'))` para generar strings de solo whitespace (incluido el vacío).
    - Verificar que el callback `onSearch` no se invoque y que se muestre el mensaje de validación.
    - **Valida: Requisitos 1.3, 1.4, 2.5**

  - [ ] 8.3 Escribir prueba de propiedad para CitySearchForm — trim antes de enviar
    - **Propiedad 2: Trim del nombre de ciudad antes de enviar**
    - Usar strings con whitespace en los extremos pero con al menos un carácter no-whitespace en el centro.
    - Verificar que el valor recibido en el callback `onSearch` sea igual a `cityName.trim()` (tramo a de P2).
    - El tramo b (el `name` decodificado de la URL) se prueba en `WeatherController.test.ts` (tarea 9.3) con `fetch` mockeado.
    - **Valida: Requisito 1.5**

  - [ ] 8.4 Escribir pruebas unitarias para CitySearchForm
    - Probar: renderizado del campo con `maxlength=100`.
    - Probar: envío con clic en el botón.
    - Probar: envío con tecla Enter mientras `City_Input` está enfocado.
    - Probar: `City_Input` permanece accesible y `focus()` le devuelve el foco.
    - Probar: el `<label>` está asociado al campo y el mensaje de validación está en una región `aria-live`.
    - Probar: el mensaje de validación se limpia al editar el campo.
    - _Requisitos: 1.1, 1.2, 1.6, 6.1, 6.3_

  - [ ] 8.5 Implementar `src/components/WeatherDisplay.ts`
    - Firma `render(weather, apiCityName: string | undefined, typedCityName: string)`.
    - Renderizar nombre de ciudad, temperatura (°C), humedad (%) y precipitación (mm) usando las funciones de `formatters.ts`.
    - Aplicar fallback a `typedCityName` si `apiCityName` está ausente, vacío o solo espacios.
    - Escribir con `textContent`, nunca `innerHTML` (BR-SEC-01).
    - Exponer un método `clear()` para limpiar el contenido del display.
    - _Requisitos: 4.1, 4.2, 4.3, 4.4, 4.7, 6.5_

  - [ ] 8.6 Escribir prueba de propiedad para WeatherDisplay — display contiene todos los campos con unidades
    - **Propiedad 12: Weather_Display contiene todos los campos con sus unidades**
    - Usar `fc.record` con `fc.double({ noNaN: true, noDefaultInfinity: true, min: -1e6, max: 1e6 })` para generar objetos `WeatherData` arbitrarios.
    - Leer el resultado con `textContent` (no `innerHTML`).
    - Verificar que el HTML renderizado contenga el nombre de ciudad, el valor de temperatura seguido de "°C", humedad seguido de "%" y precipitación seguido de "mm".
    - **Valida: Requisitos 4.1, 4.2, 4.3, 4.4**

  - [ ] 8.7 Implementar `src/components/LoadingIndicator.ts`
    - Exponer métodos `show()` y `hide()` para controlar la visibilidad del indicador; su contenedor es una región `aria-live`.
    - _Requisitos: 1.5, 4.5, 6.3_

  - [ ] 8.8 Implementar `src/components/ErrorMessage.ts`
    - Recibir un string de mensaje (ya traducido por `errorMessages.ts`) y renderizarlo en la zona de errores, que es una región `aria-live`.
    - Exponer un método `clear()` para limpiar mensajes previos.
    - _Requisitos: 1.3, 1.4, 1.6, 2.3, 2.4, 3.3, 3.4, 3.5_

  - [ ] 8.9 Escribir pruebas unitarias para `WeatherDisplay`, `LoadingIndicator` y `ErrorMessage`
    - `WeatherDisplay`: fallback al nombre del usuario cuando `apiCityName` es `undefined`, `''` o solo espacios (BR-UI-05); `clear()` vacía el contenido; un nombre con `<b>`/`<script>` se muestra literal (BR-SEC-01).
    - `LoadingIndicator`: `show()` lo hace visible y `hide()` lo oculta; contenedor `aria-live`.
    - `ErrorMessage`: pinta el string recibido, `clear()` lo borra; contenedor `aria-live`.
    - _Requisitos: 4.5, 4.7, 6.3, 6.5 · BR-UI-01, BR-UI-02, BR-UI-05, BR-SEC-01_

- [ ] 9. Implementar WeatherController
  - [ ] 9.1 Implementar `src/WeatherController.ts`
    - Orquestar el flujo completo: recibir `cityName` (ya validado y recortado) desde `CitySearchForm`, limpiar estado previo, mostrar `LoadingIndicator`, llamar a `GeocodingService`, luego a `ForecastService`, y actualizar la UI según el resultado. No valida la entrada.
    - Mantener un `AppState` y derivar de él lo que se pinta.
    - Limpiar el `WeatherDisplay` y el `ErrorMessage` **antes** de emitir la primera solicitud de cada nueva búsqueda.
    - Usar un token de petición: tras cada `await`, descartar el resultado si ya no es la búsqueda vigente (BR-UI-09). No deshabilitar `City_Input`.
    - Ocultar el `LoadingIndicator` ante **cualquier** terminación (datos, error de geocodificación o error de pronóstico).
    - Traducir errores con `getErrorMessage(service, error)`; no pedir el pronóstico si la geocodificación falla.
    - Devolver el foco a `City_Input` ante cualquier error.
    - _Requisitos: 1.5, 1.6, 2.1, 2.2, 2.3, 2.4, 2.6, 2.7, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.8_

  - [ ] 9.2 Escribir prueba de propiedad para WeatherController — limpieza del display al iniciar nueva búsqueda
    - **Propiedad 13: Limpieza del Weather_Display al iniciar nueva búsqueda**
    - Simular un estado previo con datos en `WeatherDisplay` y lanzar una nueva búsqueda con mocks de servicios.
    - Verificar el **orden de llamadas**: `WeatherDisplay.clear()` y `ErrorMessage.clear()` preceden a `GeocodingService.geocode`.
    - **Valida: Requisito 4.6**

  - [ ] 9.3 Escribir pruebas unitarias para WeatherController
    - Probar: flujo exitoso completo (geocoding → forecast → display renderizado).
    - Probar: `GeocodingService` retorna `CITY_NOT_FOUND` → mensaje correcto en `ErrorMessage`.
    - Probar: `ForecastService` retorna `INCOMPLETE_DATA` → mensaje correcto en `ErrorMessage`.
    - Probar: indicador de carga aparece al iniciar y desaparece al completar (éxito, error de geocodificación y error de pronóstico).
    - Probar (tramo b de P2): con `fetch` mockeado, el `name` decodificado de la URL de geocodificación es igual a `cityName.trim()`.
    - _Requisitos: 1.5, 4.5_

  - [ ] 9.4 Escribir pruebas unitarias de reglas del controlador (`WeatherController.test.ts`)
    - BR-UI-07: si la geocodificación falla, `ForecastService.getForecast` **no** se invoca.
    - BR-UI-04: el error previo se limpia al iniciar una nueva búsqueda.
    - BR-UI-09 / INV-16: con dos búsquedas solapadas, la respuesta de la primera se descarta aunque llegue después.
    - BR-UI-06: tras cada tipo de error `City_Input` sigue habilitado y recibe el foco.
    - Coordenadas fuera de rango: no se llama a `ForecastService` y se muestra `CITY_NOT_FOUND`.
    - _Requisitos: 1.6, 3.6, 4.5, 4.8 · BR-UI-04, BR-UI-06, BR-UI-07, BR-UI-09_

- [ ] 10. Punto de control — Verificar controlador y componentes UI
  - Asegurarse de que todas las pruebas de `components/` y `WeatherController` pasen. Consultar al usuario si surge alguna duda.

- [ ] 11. Conectar capas y construir la SPA final
  - [ ] 11.1 Conectar todo en `src/main.ts`
    - Instanciar `GeocodingClient`, `ForecastClient`, `GeocodingService`, `ForecastService`, los componentes UI y `WeatherController`.
    - Montar los componentes en el DOM del `index.html`.
    - Registrar el callback `onSearch` de `CitySearchForm` hacia `WeatherController`.
    - Importar las constantes de `src/config.ts`; ningún cliente hardcodea URL ni timeout.
    - _Requisitos: 1.1, 1.2, 4.5_

  - [ ] 11.2 Completar `index.html` con el marcado base y estilos CSS
    - Añadir la estructura HTML semántica: formulario de búsqueda, zona de indicador de carga, zona de errores y zona de display del clima.
    - Añadir estilos CSS básicos en `src/styles.css` que aseguren legibilidad y accesibilidad (contraste ≥ 4.5:1, foco visible, tamaño de fuente adecuado).
    - _Requisitos: 1.1, 4.1, 4.2, 4.3, 4.4, 6.1, 6.2, 6.4_

  - [ ] 11.3 Escribir pruebas de integración de extremo a extremo
    - Usar mocks de `GeocodingClient` y `ForecastClient` para simular flujos completos.
    - Probar el flujo exitoso: búsqueda → geocoding → forecast → datos visibles en el DOM.
    - Probar el flujo de error: geocoding falla → mensaje de error visible, `City_Input` accesible, indicador de carga oculto.
    - _Requisitos: 1.5, 1.6, 4.1, 4.5_

  - [ ] 11.4 Registrar y ejecutar los evals (EDD)
    - Registrar en `tests/evals/evals.manifest.ts` un eval por cada requisito y propiedad P1–P13 (propiedad por referencia a su `*.prop.test.ts`, más evals de contrato de URL y de escenario).
    - Implementar `npm run eval` (sale con código ≠ 0 si falla uno) con `seed` tomado de `FC_SEED`.
    - Ejecutar `npm run verify` en verde.
    - _Requisitos: todos · BR-TST-02, BR-TST-04, BR-TST-05, BR-TST-06_

  - [ ] 11.5 Verificar accesibilidad del DOM final
    - Prueba sobre `index.html`: `<label>` asociado, regiones `aria-live` para carga, error y validación, foco visible definido en CSS.
    - Revisión manual de contraste ≥ 4.5:1 (BR-UI-08).
    - _Requisitos: 6.1, 6.2, 6.3, 6.4_

- [ ] 12. Punto de control final — Verificar suite completa de pruebas
  - Ejecutar `vitest --run` y asegurarse de que todas las pruebas (unitarias, de propiedad e integración) pasen sin errores. Consultar al usuario si surge alguna duda.

## Notes

- Todas las tareas, incluidas las de pruebas y evals, son obligatorias (`CLAUDE.md` §0, `AGENTS.md` T1/E1, BR-TST-03). Se retiró el marcador `*` de "opcional".
- **RED primero:** aunque las subtareas conservan su numeración, el orden de ejecución dentro de cada par es *prueba (RED) → implementación (GREEN)*; el grafo de dependencias lo refleja poniendo cada prueba en una ola anterior a su implementación (con un stub mínimo que compile).
- Cada tarea referencia los requisitos específicos que cubre para facilitar la trazabilidad.
- Los puntos de control garantizan validación incremental antes de avanzar a la siguiente capa.
- Las pruebas de propiedad usan fast-check con `numRuns: 100` y `seed` fijo tomado de `FC_SEED` (BR-TST-04).
- Las pruebas de propiedad y las pruebas unitarias son complementarias: las primeras validan invariantes universales y las segundas validan escenarios concretos y casos de borde.
- El parámetro de humedad en la URL de la Forecast API es `relative_humidity_2m`; `requirements.md` ya fue corregido (D1 cerrado).

## Task Dependency Graph

Las olas ponen cada prueba (RED) antes de su implementación (GREEN). Los puntos de control 6, 10 y 12 aparecen al cierre de las olas correspondientes.

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2.1", "7.2", "7.4"] },
    { "id": 2, "tasks": ["7.1", "7.3", "3.2", "3.4", "3.5"] },
    { "id": 3, "tasks": ["3.1", "3.3"] },
    { "id": 4, "tasks": ["4.2", "4.3", "4.4", "4.5", "5.2", "5.3", "5.4", "5.5", "5.6"] },
    { "id": 5, "tasks": ["4.1", "5.1"] },
    { "id": 6, "tasks": ["6"] },
    { "id": 7, "tasks": ["8.2", "8.3", "8.4", "8.6", "8.9"] },
    { "id": 8, "tasks": ["8.1", "8.5", "8.7", "8.8"] },
    { "id": 9, "tasks": ["9.2", "9.3", "9.4"] },
    { "id": 10, "tasks": ["9.1"] },
    { "id": 11, "tasks": ["10"] },
    { "id": 12, "tasks": ["11.3", "11.4", "11.5"] },
    { "id": 13, "tasks": ["11.1", "11.2"] },
    { "id": 14, "tasks": ["12"] }
  ]
}
```
