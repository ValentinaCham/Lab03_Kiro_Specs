# AGENTS.md — Protocolo operativo del agente

> Instrucciones vinculantes para cualquier agente de IA (Claude Code, Kilo, Cursor, etc.) que implemente este repositorio.
> Complementa a `CLAUDE.md` (contexto y panorama) y a `BUSSINESS_RULES.md` (reglas de negocio).
> Si este documento y `CLAUDE.md` discrepan, prevalece **`AGENTS.md`** para el *cómo* y `CLAUDE.md` para el *contexto*.

---

## 1. Alcance

Este protocolo aplica a **todo** el trabajo dentro de `Lab03_Kiro_Specs/`:

- Implementación de la aplicación `weather-forecast-app`.
- Creación y modificación de pruebas y evals.
- Modificación de `requirements.md`, `design.md`, `tasks.md` y `BUSSINESS_RULES.md`.

**No aplica** a: consultas de solo lectura, explicaciones del spec o del stack, o tareas administrativas.

---

## 2. Perfiles de trabajo

El agente puede asumir uno de estos perfiles según la tarea. El perfil determina **qué artefactos** produce y **qué gates** debe atravesar.

| Perfil | Entrada | Salida | Gates |
|--------|---------|--------|-------|
| **Spec** | Necesidad del usuario o hueco detectado | `requirements.md` / `design.md` / `tasks.md` actualizados | G0 |
| **Implementer** | Una tarea de `tasks.md` | Código + pruebas RED-first | G0 → G5 |
| **QA / Eval** | Código implementado | Pruebas, evals y manifest | G1 → G3 |
| **Reviewer** | Cambio completo | Checklist + hallazgos | G6 |

El agente **cambia de perfil** dentro de la misma sesión: primero Spec (si hay ambigüedad), luego Implementer, luego QA, luego Reviewer.

---

## 3. Reglas obligatorias

### 3.1 Reglas del flujo Spec-Driven

| # | Regla |
|---|-------|
| S1 | Toda implementación debe poder rastrearse a **un** requisito de `requirements.md` y **una** tarea de `tasks.md`. |
| S2 | Si el requisito es ambiguo, contradictorio o falta: **parar y preguntar**. No inventar comportamiento ni "rellenar" criterios. |
| S3 | Los documentos se actualizan **antes** que el código cuando el comportamiento cambia; nunca al revés (salvo bug del código, en cuyo caso se arregla el código). |
| S4 | Toda propiedad P1–P13 tiene un requisito y una tarea asociados. Si agregas una propiedad, agrega su requisito y su tarea. |
| S5 | Al completar una tarea, se marcan sus checkboxes en `tasks.md` y se anotan los requisitos cubiertos (no se reescribe el plan). |
| S6 | `design.md` es la autoridad sobre interfaces y contratos (nombres de tipos, firmas, campos, mensajes). Si el código cambia una firma, se actualiza `design.md` en el mismo cambio. |

### 3.2 Reglas de TDD

| # | Regla |
|---|-------|
| T1 | **RED primero, siempre.** No se escribe código de producción sin una prueba que ya exista y falle. |
| T2 | El RED debe fallar por la **razón esperada** (assertion fallida), no por un error de compilación, de import o de setup. Si el fallo es de compilación, primero se escribe un stub mínimo que compile y *todavía* falle en la aserción. |
| T3 | Se documenta la evidencia del RED: el nombre del test y el mensaje de fallo, antes de implementar. |
| T4 | **GREEN mínimo.** Solo el código necesario para pasar la prueba nueva. Nada de "de paso" refactors o features extra. |
| T5 | **REFACTOR con la suite en verde.** El refactor no cambia comportamiento: si cambia, es una prueba nueva y vuelve a RED. |
| T6 | Una prueba que se Corrige para que pase, en lugar de corregir el código, es un **incidente**: se revierte la prueba y se investiga la causa raíz. |
| T7 | Cada rama de error del dominio necesita su propio test (red, timeout, HTTP no-2xx, cuerpo inválido, datos incompletos). |
| T8 | Prohibido `it.skip`, `xit`, `describe.skip`, `it.only` en el código entregado. Si un test está pendiente, la tarea está pendiente. |

### 3.3 Reglas de EDD

| # | Regla |
|---|-------|
| E1 | Todo requisito tocado debe quedar cubierto por **al menos un eval** registrado en `tests/evals/evals.manifest.ts`. |
| E2 | Un eval es un **oráculo ejecutable**: la falla del eval significa "no cumple el requisito", aunque el código "funcione". |
| E3 | Los tres tipos de eval (propiedad, contrato, escenario) complementan a las pruebas de ejemplo: **no** son intercambiables. Las pruebas de ejemplo fijan el comportamiento en casos concretos; los evals de propiedad lo generalizan. |
| E4 | Cada eval se ancla a `Req.N.M` y, cuando aplique, a `Propiedad P-N`. Un eval sin anclaje se elimina. |
| E5 | Determinismo: los evals de propiedad fijan `seed` y `numRuns`; el `seed` es reproducible con `FC_SEED=<n> npm run eval`. |
| E6 | Los evals nunca golpean la red real. Se usan fixtures y `fetch` mockeado. |
| E7 | El reporte de `npm run eval` debe terminar con **0 evals fallidos**; el comando sale con código ≠ 0 si hay cualquiera. |
| E8 | Cuando un eval falla, la causa raíz se corrige en el **código o en el spec**, nunca relajando el eval. |

---

## 4. Protocolo por tarea (ejecutable)

Este es el bucle que el agente sigue para **cada** tarea de `tasks.md`.

### Paso 0 — Contexto (obligatorio antes de escribir código)

```bash
# 1. Leer el requisito y la propiedad de la tarea
# 2. Leer la regla BR-* correspondiente en BUSSINESS_RULES.md
# 3. Confirmar que las tareas predecesoras están completas (tasks.md → Task Dependency Graph)
```

### Paso 1 — RED

1. Crear el archivo de prueba junto al código (sufijo `.test.ts` para ejemplos, `.prop.test.ts` para propiedades).
2. Escribir **una** prueba que exprese el comportamiento esperado, tomada del criterio de aceptación (no del código que imaginas).
3. Ejecutar solo esa prueba y **capturar el fallo**:

```bash
npx vitest run src/services/GeocodingService.test.ts
```

4. Si la prueba pasa sin tocar el código de producción → **la prueba es incorrecta**. Volver a escribirla.

### Paso 2 — GREEN

1. Escribir la implementación mínima.
2. Ejecutar la prueba: debe pasar.
3. Ejecutar la suite completa para detectar regresiones:

```bash
npm test
```

### Paso 3 — REFACTOR

1. Mejorar nombres, estructura y duplicación **sin** cambiar comportamiento.
2. `npm test` en verde tras cada refactorización.

### Paso 4 — EVAL (EDD)

1. Registrar el eval en `tests/evals/evals.manifest.ts`.
2. Si la tarea toca una propiedad P1–P13, implementar/actualizar el test de propiedad correspondiente.
3. Ejecutar:

```bash
npm run eval
```

4. Si el eval falla: se corrige la implementación (Paso 2) o se actualiza el spec si el eval encodeaba una expectativa equivocada.

### Paso 5 — Verificación final

```bash
npm run verify     # typecheck + test + eval
```

### Paso 6 — Cierre documental

1. Marcar en `tasks.md` los checkboxes de la tarea y de sus subtareas.
2. Actualizar `BUSSINESS_RULES.md` si apareció una regla nueva (asignar el siguiente `BR-*` libre; **no renumerar**).
3. Registrar en `design.md` cualquier cambio de interfaz, contrato o propiedad.

---

## 5. Estructura de las pruebas y evals

### 5.1 Convenciones de nombre

```typescript
// Ejemplo / unitario  → src/services/GeocodingService.test.ts
describe('GeocodingService', () => {
  describe('geocode', () => {
    it('DEBE devolver CITY_NOT_FOUND cuando results está vacío', () => { ... });
  });
});

// Propiedad            → src/services/GeocodingService.prop.test.ts
// Feature: weather-forecast-app, Propiedad 4: Extracción de coordenadas del primer resultado
it('P4: extracción de coordenadas del primer resultado', () => { ... });

// Eval de contrato     → tests/evals/geocoding.contract.eval.test.ts
// Eval de escenario    → tests/evals/search-flow.e2e.eval.test.ts
```

**Regla de nomenclatura de los tests:** el nombre empieza por **DEBE** o por el ID de la regla (`BR-…`) o de la propiedad (`P…:`). Un test cuyo nombre no dice qué verifica no es aceptable.

### 5.2 Formato de las pruebas de propiedad (fast-check)

```typescript
import fc from 'fast-check';

const SEED = Number(process.env.FC_SEED ?? 20260101);
const NUM_RUNS = 100;

it('P4: extracción de coordenadas del primer resultado', () => {
  fc.assert(
    fc.property(
      fc.record({
        latitude: fc.float(),
        longitude: fc.float(),
        name: fc.string(),
      }),
      (result) => {
        const coords = extractCoordinates({ results: [result] });
        expect(coords.latitude).toBe(result.latitude);
        expect(coords.longitude).toBe(result.longitude);
      },
    ),
    { seed: SEED, numRuns: NUM_RUNS },
  );
});
```

### 5.3 Manifest de evals

`tests/evals/evals.manifest.ts` — una entrada por eval:

```typescript
export interface EvalDefinition {
  id: string;              // 'EVAL-GEO-URL'
  requirement: string;     // 'Req.2.1'
  property?: string;       // 'P3'
  file: string;            // 'tests/evals/geocoding.contract.eval.test.ts'
  description: string;     // 'La URL de geocodificación incluye name URL-encoded y count=1'
  passCriteria: string;    // 'La URL contiene el parámetro name codificado y count=1 para cualquier ciudad no vacía'
  kind: 'property' | 'contract' | 'scenario';
}
```

### 5.4 Fixtures

Las respuestas de ejemplo provienen de `design.md` (Geocoding API y Forecast API). Los fixtures viven en `tests/evals/fixtures.ts` y se reutilizan en pruebas y evals:

- `geocodingOk` — 1 resultado válido (Berlin).
- `geocodingEmpty` — `results: []`.
- `geocodingMissingCoords` — resultado sin `latitude`/`longitude`.
- `forecastOk` — `current` con los tres campos.
- `forecastIncomplete` — `current` con `temperature_2m: null`.
- `forecastMalformed` — cuerpo no-JSON.

---

## 6. Checklist de revisión (Gate G6)

Antes de dar por cerrada una tarea, el agente revisa punto por punto:

### Arquitectura
- [ ] ¿La lógica de negocio quedó en la capa de servicio/util y no en un componente de UI?
- [ ] ¿Los componentes no conocen URLs ni la forma de la respuesta de la API?
- [ ] ¿Los clientes HTTP solo construyen URL, aplican timeout y devuelven `Response`?
- [ ] ¿`main.ts` es el único lugar que instancia y cablea objetos?

### Tipos
- [ ] ¿`tsc --noEmit` pasa en modo `strict`?
- [ ] ¿No hay `any`, ni `as` innecesarios en fronteras JSON?
- [ ] ¿Los resultados de servicio son tipos discriminados por `success`?

### Reglas de negocio
- [ ] ¿Se cumplen todas las reglas `BR-*` aplicables de `BUSSINESS_RULES.md`?
- [ ] ¿Los valores crudos llegan intactos al formateador (BR-FMT-01)?
- [ ] ¿Los mensajes de error coinciden **exactamente** con el catálogo de errores?

### Pruebas y evals
- [ ] ¿La prueba nueva falló antes de implementar (RED documentado)?
- [ ] ¿Hay cobertura de todos los caminos de error?
- [ ] ¿El eval está en el manifest con requisito y propiedad?
- [ ] ¿No hay tests skipped ni.only?

### Documentación
- [ ] ¿`tasks.md` refleja el estado real?
- [ ] ¿`design.md` refleja las interfaces realmente implementadas?
- [ ] ¿Apareció una regla nueva? → está en `BUSSINESS_RULES.md` con su ID.

---

## 7. Rúbrica de revisión del agente (eval de código generado)

Cuando el agente revisa un cambio (propio o de otro agente), puntúa cada dimensión de 0 a 2. **Total < 10/14 bloquea el cierre.**

| Dimensión | 0 | 1 | 2 |
|-----------|---|---|---|
| Trazabilidad | Sin anclaje a requisito/tarea | Anclaje parcial | Requisito + propiedad + tarea citados |
| RED-first | No hay evidencia | Evidencia informal | Evidencia explícita (test + mensaje) |
| GREEN mínimo | Implementa de más | Algo de más | Solo lo necesario |
| Capas | Lógica en la capa equivocada | Mezcla parcial | Separación estricta |
| Tipos | `any` / casts inseguros | Tipos laxos | Discriminados, strict |
| Reglas BR | Violaciones | Violación menor | Cumplimiento total |
| Evals | Sin eval | Eval sin manifest | Eval anclado y en manifest |
| Determinismo | Aleatorio / red real | Seed parcial | Seed + fixtures |
| Nombres | Opacos | Genéricos | Describen el comportamiento |
| Errores | Sin cobertura | Cobertura parcial | Todos los caminos |
| Accesibilidad | No se considera | Parcial | Label, foco, aria-live |
| Documentación | Desactualizada | Parcial | Al día en los 4 docs |
| Comentarios | Ruidosos / ausentes | Redundantes | Solo el "por qué" |

---

## 8. Cuándo detenerse y preguntar

El agente **debe** parar y consultar al usuario cuando:

1. El requisito es ambiguo o dos documentos se contradicen.
2. Una regla `BR-*` y un requisito entran en conflicto real (no aparente).
3. Se requiere una dependencia nueva no contemplada en el stack.
4. Se requiere cambiar una interfaz pública definida en `design.md`.
5. Se necesita tocar un archivo fuera del alcance del laboratorio o del repositorio.
6. Un test falla por una causa que apunta a un defecto del **spec** (no del código).
7. El usuario pide algo que contradice explícitamente un spec sin antes actualizarlo.

> **Nunca** se "resuelve" una ambigüedad silenciosamente. Se documenta la decisión tomada y su motivo, o se pregunta.

---

## 9. Acciones prohibidas

- ❌ Escribir código de producción antes de la prueba que lo justifica.
- ❌ Modificar `requirements.md` para acomodar el código ya escrito sin actualizar también `design.md`, `tasks.md` y `BUSSINESS_RULES.md`.
- ❌ Introducir frameworks de UI, ORMs, state managers o dependencias de red no previstas.
- ❌ Hacer llamadas a las APIs reales desde una prueba o desde el harness de evals.
- ❌ Relajar un test o un eval para que pase.
- ❌ Dejar `skip`, `only`, `todo`, `console.log` de depuración o código muerto.
- ❌ Hardcodear el API key / la URL base sin exponerla como constante configurable.
- ❌ Renumerar IDs existentes (`BR-*`, `P-N`, `Req.N.M`): son referencias históricas.
- ❌ Reordenar o renumerar el Task Dependency Graph de `tasks.md` sin actualizar las referencias cruzadas.

---

## 10. Resumen ejecutivo del protocolo

```
┌──────────────────────────────────────────────────────────────────┐
│ SPEC   ¿Qué?  requirements.md → design.md → tasks.md             │
│          Si hay ambigüedad → PARAR Y PREGUNTAR                   │
├──────────────────────────────────────────────────────────────────┤
│ RED    ¿Cómo falla?  test escrito primero, falla por la razón    │
│                      correcta, evidencia capturada               │
├──────────────────────────────────────────────────────────────────┤
│ GREEN ¿Mínimo?      implementación mínima que pasa el test       │
├──────────────────────────────────────────────────────────────────┤
│ REFACTOR ¿Limpio?   suite en verde durante todo el refactor      │
├──────────────────────────────────────────────────────────────────┤
│ EVAL  ¿Correcto?    eval en manifest, anclado a Req + P-N,       │
│                       determinista, 0 fallos en npm run eval     │
├──────────────────────────────────────────────────────────────────┤
│ VERIFY ¿Listo?      npm run verify en verde + checklist G6       │
├──────────────────────────────────────────────────────────────────┤
│ CLOSE  ¿Documentado? tasks.md marcado, design.md al día,         │
│                       BUSSINESS_RULES.md con las reglas nuevas   │
└──────────────────────────────────────────────────────────────────┘
```

Una tarea no se cierra por "funciona": se cierra por **está verde, está trazado y está documentado**.
