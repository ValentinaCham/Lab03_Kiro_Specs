/**
 * Manifest de evals (EDD).
 *
 * Un eval es un oráculo ejecutable que juzga si una implementación satisface un
 * requisito. Este manifest es la fuente de verdad de la cobertura eval → requisito
 * y eval → propiedad de corrección (AGENTS.md §5.3, BR-TST-05).
 *
 * `file` apunta al archivo de prueba que ejecuta el eval.
 */

export type EvalKind = 'property' | 'contract' | 'scenario';

export interface EvalDefinition {
  /** Identificador estable del eval. */
  id: string;
  /** Criterio de aceptación que juzga: `Req.N.M`. */
  requirement: string;
  /** Propiedad de corrección que cubre: `P-N` (opcional). */
  property?: string;
  /** Ruta relativa a la raíz del proyecto del archivo que ejecuta el eval. */
  file: string;
  /** Qué comprueba el eval. */
  description: string;
  /** Condición que debe cumplirse para que el eval pase. */
  passCriteria: string;
  /** Clase de eval. */
  kind: EvalKind;
}

/**
 * Criterios de aceptación de `requirements.md` que deben estar cubiertos por al
 * menos un eval (BR-TST-02).
 */
export const REQUIRED_CRITERIA = [
  'Req.1.1',
  'Req.1.2',
  'Req.1.3',
  'Req.1.4',
  'Req.1.5',
  'Req.1.6',
  'Req.2.1',
  'Req.2.2',
  'Req.2.3',
  'Req.2.4',
  'Req.2.5',
  'Req.2.6',
  'Req.2.7',
  'Req.3.1',
  'Req.3.2',
  'Req.3.3',
  'Req.3.4',
  'Req.3.5',
  'Req.3.6',
  'Req.4.1',
  'Req.4.2',
  'Req.4.3',
  'Req.4.4',
  'Req.4.5',
  'Req.4.6',
  'Req.4.7',
  'Req.4.8',
  'Req.5.1',
  'Req.5.2',
  'Req.5.3',
  'Req.5.4',
  'Req.5.5',
  'Req.6.1',
  'Req.6.2',
  'Req.6.3',
  'Req.6.4',
  'Req.6.5',
] as const;

/** Propiedades de corrección de `design.md` que deben estar cubiertas (BR-TST-03). */
export const REQUIRED_PROPERTIES = [
  'P1',
  'P2',
  'P3',
  'P4',
  'P5',
  'P6',
  'P7',
  'P8',
  'P9',
  'P10',
  'P11',
  'P12',
  'P13',
] as const;

export const evals: EvalDefinition[] = [
  // ---------- Requisito 1: entrada del nombre de ciudad ----------
  {
    id: 'EVAL-UI-INPUT-MAXLENGTH',
    requirement: 'Req.1.1',
    file: 'src/components/CitySearchForm.test.ts',
    description: 'El campo City_Input se renderiza con longitud máxima de 100 caracteres.',
    passCriteria: 'El atributo maxlength del input es exactamente "100".',
    kind: 'scenario',
  },
  {
    id: 'EVAL-UI-SUBMIT-TRIGGERS',
    requirement: 'Req.1.2',
    file: 'src/components/CitySearchForm.test.ts',
    description: 'La búsqueda se inicia con clic en el botón y con la tecla Enter.',
    passCriteria:
      'El callback onSearch se invoca exactamente una vez en ambos casos, con el nombre recortado.',
    kind: 'scenario',
  },
  {
    id: 'EVAL-UI-EMPTY-VALIDATION',
    requirement: 'Req.1.3',
    file: 'src/components/CitySearchForm.test.ts',
    description: 'Una entrada vacía muestra el mensaje de validación y no dispara la búsqueda.',
    passCriteria:
      'El mensaje de validación dice "El nombre de la ciudad es obligatorio." y onSearch no se invoca.',
    kind: 'scenario',
  },
  {
    id: 'EVAL-UI-WHITESPACE-VALIDATION',
    requirement: 'Req.1.4',
    property: 'P1',
    file: 'src/components/CitySearchForm.prop.test.ts',
    description: 'Toda entrada de solo espacios en blanco se rechaza con mensaje de validación.',
    passCriteria:
      'Para cualquier string de whitespace, onSearch no se invoca y el mensaje de validación está visible.',
    kind: 'property',
  },
  {
    id: 'EVAL-UI-TRIM-BEFORE-SEND',
    requirement: 'Req.1.5',
    property: 'P2',
    file: 'src/components/CitySearchForm.prop.test.ts',
    description: 'El nombre de la ciudad se recorta antes de entregarse al controlador.',
    passCriteria: 'onSearch recibe exactamente cityName.trim() para cualquier entrada con espacios en los extremos.',
    kind: 'property',
  },
  {
    id: 'EVAL-UI-TRIM-IN-URL',
    requirement: 'Req.1.5',
    property: 'P2',
    file: 'src/WeatherController.test.ts',
    description: 'Tramo b de P2: el parámetro name de la URL de geocodificación es el valor recortado.',
    passCriteria:
      'El name decodificado de la URL construida con fetch mockeado es igual a cityName.trim().',
    kind: 'scenario',
  },
  {
    id: 'EVAL-UI-INPUT-STAYS-ACCESSIBLE',
    requirement: 'Req.1.6',
    file: 'src/WeatherController.test.ts',
    description: 'Tras cualquier error, City_Input sigue habilitado y recupera el foco.',
    passCriteria: 'El input no está deshabilitado y document.activeElement es el input.',
    kind: 'scenario',
  },

  // ---------- Requisito 2: geocodificación ----------
  {
    id: 'EVAL-GEO-URL',
    requirement: 'Req.2.1',
    property: 'P3',
    file: 'src/clients/GeocodingClient.prop.test.ts',
    description: 'La URL de geocodificación lleva el nombre codificado y count=1.',
    passCriteria:
      'El name decodificado de la URL es igual al nombre original y count es "1" para cualquier ciudad no vacía.',
    kind: 'property',
  },
  {
    id: 'EVAL-GEO-FIRST-RESULT',
    requirement: 'Req.2.2',
    property: 'P4',
    file: 'src/services/GeocodingService.prop.test.ts',
    description: 'Las coordenadas se toman del primer resultado de la API.',
    passCriteria:
      'latitude y longitude extraídos son numéricamente iguales a los del primer elemento de results.',
    kind: 'property',
  },
  {
    id: 'EVAL-GEO-NO-RESULTS',
    requirement: 'Req.2.3',
    file: 'src/services/GeocodingService.test.ts',
    description: 'Cero resultados producen el error CITY_NOT_FOUND.',
    passCriteria: 'El resultado es { success: false, error: { type: "CITY_NOT_FOUND" } }.',
    kind: 'scenario',
  },
  {
    id: 'EVAL-GEO-NETWORK-TIMEOUT',
    requirement: 'Req.2.4',
    file: 'src/services/GeocodingService.test.ts',
    description: 'Un error de red o un timeout producen NETWORK_ERROR y TIMEOUT respectivamente.',
    passCriteria: 'Cada fallo de red se traduce al tipo de error de dominio que le corresponde.',
    kind: 'scenario',
  },
  {
    id: 'EVAL-GEO-NO-REQUEST-ON-EMPTY',
    requirement: 'Req.2.5',
    property: 'P1',
    file: 'src/components/CitySearchForm.prop.test.ts',
    description: 'Una entrada vacía o de solo whitespace no genera ninguna solicitud HTTP.',
    passCriteria: 'No se emite ninguna solicitud a la Geocoding API.',
    kind: 'property',
  },
  {
    id: 'EVAL-GEO-MISSING-COORDS',
    requirement: 'Req.2.6',
    property: 'P5',
    file: 'src/services/GeocodingService.prop.test.ts',
    description: 'Coordenadas ausentes, nulas, no numéricas o fuera de rango invalidan el resultado.',
    passCriteria: 'El resultado es siempre CITY_NOT_FOUND cuando alguna coordenada no es válida.',
    kind: 'property',
  },
  {
    id: 'EVAL-GEO-HTTP-ERROR',
    requirement: 'Req.2.7',
    property: 'P8',
    file: 'src/services/GeocodingService.prop.test.ts',
    description: 'Todo estado HTTP en [300, 599] se trata como fallo de la geocodificación.',
    passCriteria: 'El error es SERVICE_ERROR con el statusCode recibido, para cualquier código no-2xx.',
    kind: 'property',
  },

  // ---------- Requisito 3: consulta del pronóstico ----------
  {
    id: 'EVAL-FCT-URL',
    requirement: 'Req.3.1',
    property: 'P6',
    file: 'src/clients/ForecastClient.prop.test.ts',
    description: 'La URL de pronóstico lleva coordenadas y las tres variables actuales.',
    passCriteria:
      'La URL contiene latitude, longitude y current con temperature_2m, relative_humidity_2m y precipitation.',
    kind: 'property',
  },
  {
    id: 'EVAL-FCT-EXTRACT-CURRENT',
    requirement: 'Req.3.2',
    property: 'P7',
    file: 'src/services/ForecastService.prop.test.ts',
    description: 'Los valores actuales se extraen y se ponen a disposición para su visualización.',
    passCriteria:
      'Los valores de WeatherData coinciden exactamente con los del JSON crudo, sin transformación.',
    kind: 'property',
  },
  {
    id: 'EVAL-FCT-NETWORK-TIMEOUT',
    requirement: 'Req.3.3',
    file: 'src/services/ForecastService.test.ts',
    description: 'Un error de red o un timeout del pronóstico producen NETWORK_ERROR y TIMEOUT.',
    passCriteria: 'Cada fallo de red se traduce al tipo de error de dominio que le corresponde.',
    kind: 'scenario',
  },
  {
    id: 'EVAL-FCT-HTTP-ERROR',
    requirement: 'Req.3.4',
    property: 'P8',
    file: 'src/services/ForecastService.prop.test.ts',
    description: 'Todo estado HTTP en [300, 599] se trata como fallo del pronóstico.',
    passCriteria: 'El error es SERVICE_ERROR con el statusCode recibido, para cualquier código no-2xx.',
    kind: 'property',
  },
  {
    id: 'EVAL-FCT-INCOMPLETE-DATA',
    requirement: 'Req.3.5',
    property: 'P10',
    file: 'src/services/ForecastService.prop.test.ts',
    description: 'Un campo meteorológico nulo, indefinido o ausente deja los datos incompletos.',
    passCriteria: 'El resultado es INCOMPLETE_DATA cuando alguno de los tres campos no es un número finito.',
    kind: 'property',
  },
  {
    id: 'EVAL-FCT-OUT-OF-RANGE',
    requirement: 'Req.3.6',
    file: 'src/services/GeocodingService.test.ts',
    description: 'Coordenadas fuera de rango se tratan como cero resultados válidos.',
    passCriteria:
      'El servicio devuelve CITY_NOT_FOUND y el controlador no solicita el pronóstico para esas coordenadas.',
    kind: 'scenario',
  },

  // ---------- Requisito 4: visualización ----------
  {
    id: 'EVAL-DISPLAY-CITY-NAME',
    requirement: 'Req.4.1',
    file: 'src/components/WeatherDisplay.test.ts',
    description: 'El Weather_Display muestra el nombre de la ciudad retornado por la API.',
    passCriteria: 'El texto del display contiene el nombre provisto por la Geocoding API.',
    kind: 'scenario',
  },
  {
    id: 'EVAL-DISPLAY-TEMPERATURE',
    requirement: 'Req.4.2',
    property: 'P12',
    file: 'src/components/WeatherDisplay.prop.test.ts',
    description: 'El Weather_Display muestra la temperatura en grados Celsius.',
    passCriteria: 'El texto contiene el valor de temperatura seguido de "°C".',
    kind: 'property',
  },
  {
    id: 'EVAL-DISPLAY-HUMIDITY',
    requirement: 'Req.4.3',
    property: 'P12',
    file: 'src/components/WeatherDisplay.prop.test.ts',
    description: 'El Weather_Display muestra la humedad relativa como porcentaje.',
    passCriteria: 'El texto contiene el valor de humedad seguido de "%".',
    kind: 'property',
  },
  {
    id: 'EVAL-DISPLAY-PRECIPITATION',
    requirement: 'Req.4.4',
    property: 'P12',
    file: 'src/components/WeatherDisplay.prop.test.ts',
    description: 'El Weather_Display muestra la precipitación en milímetros.',
    passCriteria: 'El texto contiene el valor de precipitación seguido de "mm".',
    kind: 'property',
  },
  {
    id: 'EVAL-UI-LOADING-INDICATOR',
    requirement: 'Req.4.5',
    file: 'src/WeatherController.test.ts',
    description: 'El indicador de carga se muestra durante la consulta y se oculta al terminar.',
    passCriteria:
      'El indicador está visible mientras la solicitud está en curso y oculto tras el éxito o el error.',
    kind: 'scenario',
  },
  {
    id: 'EVAL-UI-CLEAR-BEFORE-REQUEST',
    requirement: 'Req.4.6',
    property: 'P13',
    file: 'src/WeatherController.prop.test.ts',
    description: 'El Weather_Display se limpia antes de emitir la nueva solicitud.',
    passCriteria: 'La llamada a clear() precede a la llamada a geocode() en el orden de invocaciones.',
    kind: 'property',
  },
  {
    id: 'EVAL-UI-CITY-NAME-FALLBACK',
    requirement: 'Req.4.7',
    file: 'src/components/WeatherDisplay.test.ts',
    description: 'Si la API no devuelve nombre, se muestra el nombre ingresado por el usuario.',
    passCriteria:
      'Con nombre de API ausente, vacío o de solo espacios, el display muestra el nombre tipeado.',
    kind: 'scenario',
  },
  {
    id: 'EVAL-UI-OVERLAPPING-SEARCHES',
    requirement: 'Req.4.8',
    file: 'src/WeatherController.test.ts',
    description: 'La respuesta de una búsqueda anterior se descarta si ya hay una más reciente.',
    passCriteria: 'Solo el resultado de la búsqueda más reciente se muestra en el Weather_Display.',
    kind: 'scenario',
  },

  // ---------- Requisito 5: corrección y round-trip ----------
  {
    id: 'EVAL-ROUNDTRIP-GEOCODING',
    requirement: 'Req.5.1',
    property: 'P4',
    file: 'src/services/GeocodingService.prop.test.ts',
    description: 'Cada campo presente del cuerpo de la geocodificación se mapea sin modificar.',
    passCriteria: 'Los valores mapeados son numéricamente iguales a los del JSON crudo.',
    kind: 'property',
  },
  {
    id: 'EVAL-ROUNDTRIP-FORECAST',
    requirement: 'Req.5.2',
    property: 'P7',
    file: 'src/services/ForecastService.prop.test.ts',
    description: 'Los valores mostrados coinciden con la respuesta parseada antes de formatear.',
    passCriteria: 'Los valores de WeatherData son numéricamente iguales a los del JSON crudo.',
    kind: 'property',
  },
  {
    id: 'EVAL-FORMAT-ROUNDING',
    requirement: 'Req.5.3',
    property: 'P11',
    file: 'src/utils/formatters.prop.test.ts',
    description: 'Temperatura y precipitación usan como máximo un decimal; la humedad es entera.',
    passCriteria:
      'La cadena de temperatura y precipitación tiene como máximo 1 decimal y la de humedad no tiene punto decimal.',
    kind: 'property',
  },
  {
    id: 'EVAL-ERROR-SERVICE-IDENTITY',
    requirement: 'Req.5.4',
    property: 'P8',
    file: 'src/utils/errorMessages.test.ts',
    description: 'El mensaje de error identifica qué servicio falló.',
    passCriteria:
      'Los dos servicios producen mensajes distintos para el mismo tipo de error y el catálogo es exacto.',
    kind: 'scenario',
  },
  {
    id: 'EVAL-INVALID-BODY',
    requirement: 'Req.5.5',
    property: 'P9',
    file: 'src/services/ForecastService.prop.test.ts',
    description: 'Un 2xx con cuerpo no parseable se trata como fallo.',
    passCriteria: 'El resultado es INVALID_RESPONSE para cualquier cuerpo que no se pueda parsear.',
    kind: 'property',
  },

  // ---------- Requisito 6: accesibilidad ----------
  {
    id: 'EVAL-A11Y-LABEL',
    requirement: 'Req.6.1',
    file: 'src/components/CitySearchForm.test.ts',
    description: 'Existe un label visible asociado al campo City_Input.',
    passCriteria: 'El campo es localizable por su etiqueta y el label tiene texto no vacío.',
    kind: 'scenario',
  },
  {
    id: 'EVAL-A11Y-FOCUS-VISIBLE',
    requirement: 'Req.6.2',
    file: 'tests/evals/a11y.eval.test.ts',
    description: 'El foco del teclado es visible sobre el campo y el botón.',
    passCriteria: 'La hoja de estilos define un indicador de foco visible y no elimina el outline.',
    kind: 'contract',
  },
  {
    id: 'EVAL-A11Y-LIVE-REGIONS',
    requirement: 'Req.6.3',
    file: 'tests/evals/a11y.eval.test.ts',
    description: 'Carga, errores y validación se anuncian mediante regiones aria-live.',
    passCriteria:
      'Los contenedores de carga, error y validación declaran aria-live en la aplicación montada.',
    kind: 'contract',
  },
  {
    id: 'EVAL-A11Y-CONTRAST',
    requirement: 'Req.6.4',
    file: 'tests/evals/a11y.eval.test.ts',
    description: 'El contraste entre texto y fondo es de al menos 4.5:1.',
    passCriteria:
      'La relación de contraste WCAG de los pares de color de la hoja de estilos es >= 4.5.',
    kind: 'contract',
  },
  {
    id: 'EVAL-SEC-TEXT-CONTENT',
    requirement: 'Req.6.5',
    file: 'src/components/WeatherDisplay.test.ts',
    description: 'El nombre de la ciudad se renderiza como texto plano.',
    passCriteria:
      'Un nombre con marcado HTML aparece literal en textContent y no crea nodos de marcado en el DOM.',
    kind: 'scenario',
  },
];
