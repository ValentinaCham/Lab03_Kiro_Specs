/**
 * Traducción de errores de dominio a mensajes visibles para el usuario.
 *
 * Aquí se resuelve la identidad del servicio que falló: `SERVICE_ERROR` (y el
 * resto de tipos compartidos) significan cosas distintas según el servicio
 * (D6, BR-ERR-02). El catálogo es el de `BUSSINESS_RULES.md` §7.
 */

import type { AppError, ServiceName } from '../types';

export const VALIDATION_EMPTY_MESSAGE = 'El nombre de la ciudad es obligatorio.';

export const CITY_NOT_FOUND_MESSAGE =
  'No se encontró la ciudad ingresada. Verifica el nombre e intenta de nuevo.';

export const INCOMPLETE_DATA_MESSAGE = 'Los datos meteorológicos recibidos están incompletos.';

/** Nombre del servicio tal como aparece en los mensajes al usuario. */
const SERVICE_LABEL: Record<ServiceName, string> = {
  geocoding: 'geocodificación',
  forecast: 'pronóstico',
};

export function getErrorMessage(service: ServiceName, error: AppError): string {
  switch (error.type) {
    case 'VALIDATION_EMPTY':
      return VALIDATION_EMPTY_MESSAGE;
    case 'CITY_NOT_FOUND':
      return CITY_NOT_FOUND_MESSAGE;
    case 'INCOMPLETE_DATA':
      return INCOMPLETE_DATA_MESSAGE;
    case 'NETWORK_ERROR':
      return `El servicio de ${SERVICE_LABEL[service]} no está disponible. Verifica tu conexión.`;
    case 'TIMEOUT':
      return `El servicio de ${SERVICE_LABEL[service]} no respondió a tiempo.`;
    case 'SERVICE_ERROR':
      return `El servicio de ${SERVICE_LABEL[service]} retornó un error.`;
    case 'INVALID_RESPONSE':
      return `Los datos recibidos del servicio de ${SERVICE_LABEL[service]} no son válidos.`;
  }
}
