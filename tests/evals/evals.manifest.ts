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
 * menos un eval (BR-TST-02). Se verifica contra el documento en la tarea 11.4.
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

/**
 * Evals registrados. Se completa en la tarea 11.4, cuando las pruebas de
 * propiedad, contrato y escenario ya existen.
 */
export const evals: EvalDefinition[] = [];
