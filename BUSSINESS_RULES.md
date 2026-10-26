# BUSSINESS_RULES.md — Reglas de Negocio de `weather-forecast-app`

> Catálogo normativo de las reglas que gobiernan la aplicación. Cada regla tiene un **ID estable** (`BR-*`), un **origen trazable** (requisito y/o propiedad) y un **modo de verificación** (cómo se comprueba que se cumple).
> Si una regla y el código discrepan, **manda la regla** (ver `CLAUDE.md` §Jerarquía de autoridad).

---

## 0. Convenciones de este documento

| Campo | Significado |
|-------|-------------|
| **ID** | Identificador estable de la regla. No se reutiliza ni se renumera. |
| **Origen** | `Req.N.M` = Requisito N, criterio de aceptación M (de `requirements.md`). `P-N` = Propiedad N (de `design.md`). `T-N.M` = tarea N.M (de `tasks.md`). |
| **Verificación** | `TDD` = prueba de ejemplo que falla primero · `EDD` = eval de propiedad/contrato en `tests/evals/` · `Manual` = inspección visual. |
| **Severidad** | `Bloqueante` = la app es incorrecta sin ella · `Importante` = afecta la experiencia · `Menor` = cosmético. |

---

## 1. Reglas de validación de entrada (UI)

| ID | Regla | Origen | Verificación | Sev. |
|----|-------|--------|--------------|------|
| BR-VAL-01 | El campo `City_Input` DEBE renderizarse en la página principal con `maxlength="100"`. | Req. 1.1 | TDD | Bloqueante |
| BR-VAL-02 | La búsqueda DEBE iniciarse con clic en el botón **o** con tecla `Enter` mientras `City_Input` tiene el foco. | Req. 1.2 | TDD | Bloqueante |
| BR-VAL-03 | Una entrada vacía DEBE producir un mensaje de validación y **NO** debe iniciar ninguna solicitud HTTP. | Req. 1.3, 2.5 | TDD + EDD (P1) | Bloqueante |
| BR-VAL-04 | Una entrada de solo espacios en blanco DEBE producir el mismo mensaje de validación que la entrada vacía. | Req. 1.4, 2.5 | TDD + EDD (P1) | Bloqueante |
| BR-VAL-05 | El valor enviado a la Geocoding API DEBE ser el valor **recortado** (`trim()`) del campo de texto. | Req. 1.5, 2.1 | TDD + EDD (P2) | Bloqueante |
| BR-VAL-06 | El mensaje de validación DEBE ser visible para el usuario sin necesidad de herramientas externas. | Req. 1.3, 1.4 | Manual | Importante |

> **Contrato de la validación:** el mensaje es exactamente `"El nombre de la ciudad es obligatorio."` y el tipo de error de dominio es `VALIDATION_EMPTY`.

---

## 2. Reglas de geocodificación

| ID | Regla | Origen | Verificación | Sev. |
|----|-------|--------|--------------|------|
| BR-GEO-01 | La solicitud DEBE enviar el nombre como parámetro `name` (URL-encoded) y `count=1`. | Req. 2.1 | EDD (P3, contrato) | Bloqueante |
| BR-GEO-02 | La URL base DEBE ser `https://geocoding-api.open-meteo.com/v1/search`. | Req. 2.1 | EDD (contrato) | Bloqueante |
| BR-GEO-03 | Ante uno o más resultados, las coordenadas DEBEN tomarse **del primer elemento** de `results`. | Req. 2.2 | TDD + EDD (P4) | Bloqueante |
| BR-GEO-04 | Los valores `latitude`, `longitude` y `name` se copian **sin transformación alguna** (round-trip exacto). | Req. 2.2, 5.1 | EDD (P4) | Bloqueante |
| BR-GEO-05 | Si `results` está ausente o vacío → error `CITY_NOT_FOUND`. | Req. 2.3 | TDD | Bloqueante |
| BR-GEO-06 | Si `latitude` o `longitude` del primer resultado falta, es `null` o no es numérico → error `CITY_NOT_FOUND` (se trata como cero resultados válidos). | Req. 2.6 | TDD + EDD (P5) | Bloqueante |
| BR-GEO-07 | Ante error de red o timeout → error de red (`NETWORK_ERROR` / `TIMEOUT`) con mensaje propio del servicio de geocodificación. | Req. 2.4 | TDD | Bloqueante |
| BR-GEO-08 | Un estado HTTP no-2xx DEBE tratarse como fallo e informar **qué servicio** falló. | Req. 2.7, 5.4 | TDD + EDD (P8) | Bloqueante |
| BR-GEO-09 | Un 2xx con cuerpo no parseable → error `INVALID_RESPONSE`. | Req. 5.5 | TDD + EDD (P9) | Bloqueante |

---

## 3. Reglas de pronóstico

| ID | Regla | Origen | Verificación | Sev. |
|----|-------|--------|--------------|------|
| BR-FCT-01 | La solicitud DEBE incluir `latitude`, `longitude` y `current=temperature_2m,relative_humidity_2m,precipitation`. | Req. 3.1 | EDD (P6, contrato) | Bloqueante |
| BR-FCT-02 | La URL base DEBE ser `https://api.open-meteo.com/v1/forecast`. | Req. 3.1 | EDD (contrato) | Bloqueante |
| BR-FCT-03 | Solo se consulta el pronóstico si las coordenadas son válidas: latitud ∈ [-90, 90] y longitud ∈ [-180, 180]. Fuera de rango → `CITY_NOT_FOUND` y **no** se pide el pronóstico (la validación vive en `GeocodingService`). | Req. 3.1, 3.6 | TDD + EDD (P6) | Bloqueante |
| BR-FCT-04 | Ante respuesta exitosa, los tres valores (`temperature_2m`, `relative_humidity_2m`, `precipitation`) se extraen **sin transformación** y quedan disponibles para render. | Req. 3.2, 5.2 | EDD (P7, round-trip) | Bloqueante |
| BR-FCT-05 | Si cualquiera de los tres campos falta, es `null` o no es numérico → error `INCOMPLETE_DATA`. | Req. 3.5 | TDD + EDD (P10) | Bloqueante |
| BR-FCT-06 | Ante error de red o timeout → error propio del servicio de pronóstico. | Req. 3.3 | TDD | Bloqueante |
| BR-FCT-07 | Un estado HTTP no-2xx → fallo, indicando el servicio de pronóstico. | Req. 3.4, 5.4 | TDD + EDD (P8) | Bloqueante |
| BR-FCT-08 | Un 2xx con cuerpo no parseable → error `INVALID_RESPONSE`. | Req. 5.5 | TDD + EDD (P9) | Bloqueante |

---

## 4. Reglas de formato (capa de presentación)

| ID | Regla | Origen | Verificación | Sev. |
|----|-------|--------|--------------|------|
| BR-FMT-01 | El formateo ocurre **solo** en la capa de presentación; los servicios almacenan valores crudos. | Req. 5.2, 5.3 | EDD (P7) | Bloqueante |
| BR-FMT-02 | Temperatura: máximo **1 decimal**, sufijo `" °C"`. Implementación: `value.toFixed(1) + ' °C'`. | Req. 4.2, 5.3 | TDD + EDD (P11) | Bloqueante |
| BR-FMT-03 | Humedad: **entero sin decimales**, sufijo `" %"`. Implementación: `Math.round(value) + ' %'`. | Req. 4.3, 5.3 | TDD + EDD (P11) | Bloqueante |
| BR-FMT-04 | Precipitación: máximo **1 decimal**, sufijo `" mm"`. Implementación: `value.toFixed(1) + ' mm'`. | Req. 4.4, 5.3 | TDD + EDD (P11) | Bloqueante |
| BR-FMT-05 | El `Weather_Display` DEBE contener el nombre de la ciudad, el valor de temperatura seguido de `°C`, la humedad seguida de `%` y la precipitación seguida de `mm`. | Req. 4.1–4.4 | TDD + EDD (P12) | Bloqueante |

---

## 5. Reglas de UI y estado

| ID | Regla | Origen | Verificación | Sev. |
|----|-------|--------|--------------|------|
| BR-UI-01 | Mientras haya una solicitud en curso DEBE mostrarse un indicador de carga. | Req. 1.5, 4.5 | TDD | Bloqueante |
| BR-UI-02 | El indicador de carga DEBE ocultarse cuando la búsqueda termine, con datos **o** con error de **cualquiera** de los dos servicios. | Req. 4.5 | TDD | Bloqueante |
| BR-UI-03 | Al iniciar una nueva búsqueda, el contenido previo del `Weather_Display` DEBE limpiarse **antes** de emitir la nueva solicitud. | Req. 4.6 | TDD + EDD (P13) | Bloqueante |
| BR-UI-04 | El estado de error previo también DEBE limpiarse al iniciar una nueva búsqueda. | `design.md` §Error Handling 6 | TDD | Importante |
| BR-UI-05 | Si la API no devuelve nombre de ciudad (ausente, vacío o solo espacios), el `Weather_Display` DEBE mostrar el nombre **ingresado por el usuario**. | Req. 4.7 | TDD | Bloqueante |
| BR-UI-06 | Ante cualquier error, `City_Input` DEBE permanecer habilitado y accesible, y recibir el foco, para permitir el reintento. | Req. 1.6 | TDD | Bloqueante |
| BR-UI-07 | El flujo es secuencial: **primero** geocodificación, **luego** pronóstico. El pronóstico no se pide si la geocodificación falla. | `design.md` §Overview | TDD | Bloqueante |
| BR-UI-08 | La UI debe ser accesible: `<label>` asociado al campo, foco visible, contraste ≥ 4.5:1 y región `aria-live` para carga y error. | Req. 6.1–6.4 | Manual + TDD (atributos del DOM) | Importante |
| BR-UI-09 | Si se inicia una búsqueda mientras otra sigue en curso, la respuesta de la anterior se **descarta** (token de petición); solo la más reciente actualiza la UI. | Req. 4.8 | TDD | Bloqueante |
| BR-UI-10 | El texto de validación se limpia al iniciar una búsqueda válida o al editar el campo; la validación ocurre **solo** en `CitySearchForm`, no en el controlador. | Req. 1.3, 1.4 | TDD | Menor |

---

## 6. Reglas de robustez (red y contratos HTTP)

| ID | Regla | Origen | Verificación | Sev. |
|----|-------|--------|--------------|------|
| BR-ERR-01 | Ambas solicitudes tienen un timeout de **10 000 ms** implementado con `AbortController`. | Req. 2.4, 3.3 | TDD | Bloqueante |
| BR-ERR-02 | Un timeout se distingue de un error de red: el usuario recibe mensajes distintos. | Req. 2.4, 3.3 | TDD | Importante |
| BR-ERR-03 | La validación de entrada ocurre **antes** de cualquier llamada de red. | Req. 2.5 | TDD | Bloqueante |
| BR-ERR-04 | Un 2xx con cuerpo que no se puede parsear al objeto esperado se trata como **fallo**, nunca como éxito parcial. | Req. 5.5 | TDD + EDD (P9) | Bloqueante |
| BR-ERR-05 | Los clientes HTTP no interpretan el cuerpo de la respuesta: solo construyen la URL, aplican el timeout y devuelven la `Response` o lanzan. | `design.md` §Architecture | Manual / Review | Importante |
| BR-ERR-06 | El JSON se parsea dentro de `try/catch`; un fallo de parseo produce `INVALID_RESPONSE`. | `design.md` §Error Handling 4 | TDD | Bloqueante |
| BR-ERR-07 | Los clientes lanzan errores **tipados** (`TimeoutError` para el timeout, `NetworkError` para el resto); los servicios los distinguen por tipo, nunca por el mensaje. | `design.md` §Clientes HTTP | TDD | Bloqueante |
| BR-ERR-08 | El timeout se prueba con `vi.useFakeTimers`: aborta a los 10 000 ms exactos (no a 9 999) y se cancela con `clearTimeout` al recibir la respuesta. | Req. 2.4, 3.3 | TDD | Bloqueante |
| BR-SEC-01 | Todo texto proveniente de una API externa (nombre de ciudad) se renderiza con `textContent`; **prohibido** `innerHTML` con datos externos. | Req. 6.5 | TDD | Bloqueante |

---

## 7. Catálogo de errores

Dos niveles: el **error de dominio** (tipo del servicio) y el **mensaje visible** (identificador de UI). El mapeo es 1:1 y no se altera sin actualizar `design.md`.

| Error de dominio | Servicio | Identificador UI | Mensaje al usuario | Origen |
|------------------|----------|------------------|--------------------|--------|
| `VALIDATION_EMPTY` | UI | `VALIDATION_EMPTY` | "El nombre de la ciudad es obligatorio." | Req. 1.3, 1.4 |
| `CITY_NOT_FOUND` | Geocoding | `CITY_NOT_FOUND` | "No se encontró la ciudad ingresada. Verifica el nombre e intenta de nuevo." | Req. 2.3, 2.6 |
| `NETWORK_ERROR` | Geocoding | `GEOCODING_NETWORK_ERROR` | "El servicio de geocodificación no está disponible. Verifica tu conexión." | Req. 2.4 |
| `TIMEOUT` | Geocoding | `GEOCODING_TIMEOUT` | "El servicio de geocodificación no respondió a tiempo." | Req. 2.4 |
| `SERVICE_ERROR` | Geocoding | `GEOCODING_SERVICE_ERROR` | "El servicio de geocodificación retornó un error." | Req. 2.7, 5.4 |
| `INVALID_RESPONSE` | Geocoding | `GEOCODING_INVALID_RESPONSE` | "Los datos recibidos del servicio de geocodificación no son válidos." | Req. 5.5 |
| `NETWORK_ERROR` | Forecast | `FORECAST_NETWORK_ERROR` | "El servicio de pronóstico no está disponible. Verifica tu conexión." | Req. 3.3 |
| `TIMEOUT` | Forecast | `FORECAST_TIMEOUT` | "El servicio de pronóstico no respondió a tiempo." | Req. 3.3 |
| `SERVICE_ERROR` | Forecast | `FORECAST_SERVICE_ERROR` | "El servicio de pronóstico retornó un error." | Req. 3.4, 5.4 |
| `INCOMPLETE_DATA` | Forecast | `FORECAST_INCOMPLETE_DATA` | "Los datos meteorológicos recibidos están incompletos." | Req. 3.5 |
| `INVALID_RESPONSE` | Forecast | `FORECAST_INVALID_RESPONSE` | "Los datos recibidos del servicio de pronóstico no son válidos." | Req. 5.5 |

`SERVICE_ERROR` transporta además el `statusCode` original (rango esperado: 300–599).

> **Quién traduce:** el mapeo *error de dominio + servicio → identificador UI → mensaje* vive en `src/utils/errorMessages.ts` (tarea 7.3). `ErrorMessage` solo pinta el string; el controlador consulta el mapeo. Como `SERVICE_ERROR` es idéntico en ambos servicios, la identidad del servicio que falló se resuelve **aquí**, no en el servicio.

---

## 8. Invariantes

Estas afirmaciones DEBEN ser verdaderas en **todo** momento de la ejecución, incluso con entradas arbitrarias. Son las candidatas naturales a pruebas de propiedad y a evals de contrato.

| ID | Invariante | Origen | Eval |
|----|-----------|--------|------|
| INV-01 | Ninguna solicitud HTTP se emite con un nombre de ciudad vacío o de solo whitespace. | Req. 1.3, 1.4, 2.5 | P1 |
| INV-02 | El parámetro `name` recibido por la Geocoding API siempre es igual a `trim()` del valor del usuario. | Req. 1.5 | P2 |
| INV-03 | La URL de geocodificación siempre contiene `name` (URL-encoded) y `count=1`. | Req. 2.1 | P3 |
| INV-04 | Las coordenadas obtenidas son **numéricamente idénticas** a las del primer resultado de la API. | Req. 2.2, 5.1 | P4 |
| INV-05 | Un resultado sin `latitude` o `longitude` válidos nunca produce éxito: siempre `CITY_NOT_FOUND`. | Req. 2.6 | P5 |
| INV-06 | La URL de pronóstico siempre contiene `latitude`, `longitude` y los tres campos de `current`. | Req. 3.1 | P6 |
| INV-07 | Los valores internos del clima coinciden exactamente con el JSON crudo antes de formatear. | Req. 3.2, 5.2 | P7 |
| INV-08 | Todo estado HTTP en [300, 599] produce fallo, nunca éxito. | Req. 3.4, 5.4 | P8 |
| INV-09 | Todo 2xx con cuerpo no parseable produce fallo, nunca éxito parcial. | Req. 5.5 | P9 |
| INV-10 | Un campo meteorológico nulo, ausente o no numérico nunca produce éxito: siempre `INCOMPLETE_DATA`. | Req. 3.5 | P10 |
| INV-11 | La representación de temperatura y precipitación tiene como máximo 1 decimal; la de humedad no tiene decimales. | Req. 5.3 | P11 |
| INV-12 | El `Weather_Display` renderizado contiene siempre nombre de ciudad + los tres valores con su unidad. | Req. 4.1–4.4 | P12 |
| INV-13 | El `Weather_Display` está vacío mientras una nueva búsqueda está en curso. | Req. 4.6 | P13 |
| INV-14 | Ningún camino de error deja el `City_Input` deshabilitado o inaccesible. | Req. 1.6 | P-escenario |
| INV-15 | Ningún camino de error —de geocodificación **o** de pronóstico— deja el indicador de carga visible. | Req. 4.5 | P-escenario |
| INV-16 | Una respuesta de una búsqueda anterior nunca modifica la UI después de iniciada una más reciente. | Req. 4.8 | P-escenario |

---

## 9. Matriz de trazabilidad

Regla → requisito → propiedad → tarea de `tasks.md` → verificación.

| Regla | Requisito | Propiedad | Tarea |
|-------|-----------|-----------|-------|
| BR-VAL-01 | 1.1 | — | 8.1 |
| BR-VAL-02 | 1.2 | — | 8.1, 8.4 |
| BR-VAL-03 / 04 | 1.3, 1.4, 2.5 | P1 | 8.2 |
| BR-VAL-05 | 1.5 | P2 | 8.3 |
| BR-GEO-01 / 02 | 2.1 | P3 | 3.1, 3.2 |
| BR-GEO-03 / 04 | 2.2, 5.1 | P4 | 4.1, 4.2 |
| BR-GEO-05 | 2.3 | — | 4.1, 4.5 |
| BR-GEO-06 | 2.6 | P5 | 4.1, 4.3 |
| BR-GEO-07 | 2.4 | — | 4.5 |
| BR-GEO-08 | 2.7, 5.4 | P8 | 4.4, 5.4 |
| BR-GEO-09 | 5.5 | P9 | 4.1 |
| BR-FCT-01 / 02 | 3.1 | P6 | 3.3, 3.4 |
| BR-FCT-03 | 3.1, 3.6 | P6 | 3.3, 3.4, 4.1, 4.6 |
| BR-FCT-04 | 3.2, 5.2 | P7 | 5.1, 5.2 |
| BR-FCT-05 | 3.5 | P10 | 5.1, 5.3 |
| BR-FCT-06 | 3.3 | — | 5.6 |
| BR-FCT-07 | 3.4, 5.4 | P8 | 5.4 |
| BR-FCT-08 | 5.5 | P9 | 5.5 |
| BR-FMT-01 | 5.2 | P7 | 7.1 |
| BR-FMT-02 | 4.2, 5.3 | P11 | 7.1, 7.2 |
| BR-FMT-03 | 4.3, 5.3 | P11 | 7.1, 7.2 |
| BR-FMT-04 | 4.4, 5.3 | P11 | 7.1, 7.2 |
| BR-FMT-05 | 4.1–4.4 | P12 | 8.5, 8.6 |
| BR-UI-01 / 02 | 1.5, 4.5 | — | 8.7, 8.9, 9.1, 9.3, 9.4 |
| BR-UI-03 | 4.6 | P13 | 8.5, 9.2 |
| BR-UI-04 | design §Err.6 | — | 9.1, 9.4 |
| BR-UI-05 | 4.7 | — | 8.5, 8.9 |
| BR-UI-06 | 1.6 | — | 8.4, 9.3, 9.4, 11.3 |
| BR-UI-07 | design §Overview | — | 9.1, 9.4 |
| BR-UI-08 | 6.1–6.4 | — | 8.1, 11.2, 11.5 |
| BR-UI-09 | 4.8 | — | 9.1, 9.4 |
| BR-UI-10 | 1.3, 1.4 | — | 8.1, 8.4 |
| BR-ERR-01 | 2.4, 3.3 | — | 3.1, 3.3, 4.5, 5.6 |
| BR-ERR-02 | 2.4, 3.3 | — | 4.5, 5.6 |
| BR-ERR-03 | 2.5 | P1 | 8.1, 8.2 |
| BR-ERR-04 | 5.5 | P9 | 5.5 |
| BR-ERR-05 | design §Architecture | — | 3.1, 3.3 |
| BR-ERR-06 | design §Err.4 | — | 4.1, 5.1 |
| BR-ERR-07 | design §Clientes HTTP | — | 3.1, 3.3, 3.5 |
| BR-ERR-08 | 2.4, 3.3 | — | 3.5 |
| BR-SEC-01 | 6.5 | — | 8.5, 8.9 |

---

## 10. Casos borde y decisiones ya tomadas

| Caso | Decisión | Origen |
|------|----------|--------|
| Ciudad válida pero ambigua (varias ciudades con el mismo nombre) | Se usa **siempre el primer resultado** (`count=1`). No hay desambiguación por país. | Req. 2.1, 2.2 |
| API devuelve `results` con un elemento sin `name` | No es error: el `name` se resuelve con el fallback al nombre del usuario. Solo `latitude`/`longitude` son obligatorios. | Req. 2.6, 4.7 |
| API devuelve un 2xx con `results: []` | `CITY_NOT_FOUND` (no es cuerpo inválido). | Req. 2.3 |
| API devuelve HTML en lugar de JSON | `INVALID_RESPONSE` (falla el parseo). | Req. 5.5 |
| Valor numérico `0` en un campo meteorológico | Es **válido**: solo `null`, `undefined` y no-numéricos son `INCOMPLETE_DATA`. | Req. 3.5 |
| Temperatura negativa | Válida; se formatea con `toFixed(1)` (p. ej. `-3.5 °C`). | Req. 5.3 |
| Humedad con decimales | Se redondea con `Math.round` al presentar. | Req. 5.3 |
| `0` o `0.0` en precipitación | Válido → `0.0 mm`. | Req. 4.4 |
| Búsqueda con el mismo nombre repetida | Se ejecuta el flujo completo de nuevo (limpia display y error antes). | Req. 4.6 |
| El usuario envía otra ciudad mientras hay una búsqueda en curso | Se limpia y se vuelve a empezar; la respuesta de la anterior se descarta con un token de petición (no se deshabilita `City_Input`). | Req. 4.6, 4.8 |
| Latitud/longitud fuera de rango en la respuesta de geocodificación | `CITY_NOT_FOUND`; no se pide el pronóstico. Sin error de dominio nuevo. | Req. 3.6 |
| `name` con solo espacios | Cuenta como ausente: se usa el fallback al nombre del usuario. | Req. 4.7 |
| Nombre de ciudad con marcado HTML (`<b>`, `<script>`) | Se muestra literal como texto. | Req. 6.5 |
| Codificación de espacios en la URL | `+` (de `URLSearchParams`) y `%20` son equivalentes: las pruebas **decodifican** la URL, no comparan cadenas. | Req. 2.1 |
| Generadores de fast-check para números | Solo finitos (`noNaN`, `noDefaultInfinity`): `NaN`/`Infinity` no sobreviven al JSON. Sin valores ≥ 1e21 (notación exponencial en `toFixed`). | Req. 5.2, 5.3 |
| Nombre de parámetro de humedad | **`relative_humidity_2m`** (API actual). `requirements.md` ya fue corregido (v1.1). | D1 |
| Aplicación de `trim()` | Solo al enviar; no se modifica el texto que el usuario ve mientras escribe. | Req. 1.5 |
| Timeout | 10 000 ms exactos, por solicitud, mediante `AbortController` + `setTimeout`. | Req. 2.4, 3.3 |

---

## 11. Reglas de testing derivadas (EDD)

Estas reglas gobiernan **cómo** se comprueba el cumplimiento de las anteriores.

| ID | Regla | Origen | Verificación |
|----|-------|--------|--------------|
| BR-TST-01 | Ningún test depende de la red real: `fetch` siempre está mockeado con fixtures de `design.md`. | design §Testing Strategy | Manual |
| BR-TST-02 | Cada criterio de aceptación EARS tiene al menos una prueba o eval que lo cubre. | design §Testing Strategy | EDD |
| BR-TST-03 | Cada propiedad P1–P13 se implementa como **una** prueba de propiedad con fast-check, mínimo 100 iteraciones. | design §Testing Strategy | EDD |
| BR-TST-04 | Las pruebas de propiedad fijan `seed` determinista y `numRuns` para reproducibilidad. | AGENTS.md §4 | EDD |
| BR-TST-05 | Cada eval está registrado en `tests/evals/evals.manifest.ts` con id, requisito, propiedad y criterio de aprobación. | AGENTS.md §4 | Manual |
| BR-TST-06 | `npm run verify` (typecheck + test + eval) debe estar en verde antes de cerrar cualquier tarea. | CLAUDE.md §9 | Manual |
| BR-TST-07 | Una prueba no puede reescribir el criterio de aceptación que verifica: si el criterio cambia, se actualiza el spec primero. | Jerarquía de autoridad | Manual |
| BR-TST-08 | Los casos de error se prueban en **todos** los estados de fallo: red, timeout, HTTP no-2xx, cuerpo inválido, datos incompletos. | design §Error Handling | TDD |

---

## 12. Registro de cambios

| Fecha | Cambio | Razón |
|-------|--------|-------|
| v1.0 | Creación del catálogo a partir de `requirements.md`, `design.md` y `tasks.md` | Base normativa del flujo Spec-Driven + TDD/EDD |
| v1.1 | Nuevas reglas BR-UI-09, BR-UI-10, BR-ERR-07, BR-ERR-08, BR-SEC-01 e INV-16; orígenes corregidos de BR-GEO-08, BR-FCT-03, BR-UI-08; casos borde ampliados; D1 cerrado en `requirements.md` | Revisión de la planificación (hallazgos A1, A5, A8, A9, A12, A13, A16) |
