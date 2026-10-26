import { describe, expect, it } from 'vitest';
import type { AppError } from '../types';
import { getErrorMessage } from './errorMessages';

describe('getErrorMessage', () => {
  it('DEBE traducir VALIDATION_EMPTY al mensaje de validación', () => {
    const error: AppError = { type: 'VALIDATION_EMPTY' };

    expect(getErrorMessage('geocoding', error)).toBe('El nombre de la ciudad es obligatorio.');
    expect(getErrorMessage('forecast', error)).toBe('El nombre de la ciudad es obligatorio.');
  });

  it('DEBE traducir CITY_NOT_FOUND al mensaje de ciudad no encontrada', () => {
    const error: AppError = { type: 'CITY_NOT_FOUND' };

    expect(getErrorMessage('geocoding', error)).toBe(
      'No se encontró la ciudad ingresada. Verifica el nombre e intenta de nuevo.',
    );
  });

  it('DEBE traducir NETWORK_ERROR con el nombre del servicio que falló', () => {
    const error: AppError = { type: 'NETWORK_ERROR' };

    expect(getErrorMessage('geocoding', error)).toBe(
      'El servicio de geocodificación no está disponible. Verifica tu conexión.',
    );
    expect(getErrorMessage('forecast', error)).toBe(
      'El servicio de pronóstico no está disponible. Verifica tu conexión.',
    );
  });

  it('DEBE traducir TIMEOUT con el nombre del servicio que falló', () => {
    const error: AppError = { type: 'TIMEOUT' };

    expect(getErrorMessage('geocoding', error)).toBe(
      'El servicio de geocodificación no respondió a tiempo.',
    );
    expect(getErrorMessage('forecast', error)).toBe(
      'El servicio de pronóstico no respondió a tiempo.',
    );
  });

  it('DEBE traducir SERVICE_ERROR con el nombre del servicio que falló', () => {
    const error: AppError = { type: 'SERVICE_ERROR', statusCode: 503 };

    expect(getErrorMessage('geocoding', error)).toBe(
      'El servicio de geocodificación retornó un error.',
    );
    expect(getErrorMessage('forecast', error)).toBe('El servicio de pronóstico retornó un error.');
  });

  it('DEBE traducir INVALID_RESPONSE con el nombre del servicio que falló', () => {
    const error: AppError = { type: 'INVALID_RESPONSE' };

    expect(getErrorMessage('geocoding', error)).toBe(
      'Los datos recibidos del servicio de geocodificación no son válidos.',
    );
    expect(getErrorMessage('forecast', error)).toBe(
      'Los datos recibidos del servicio de pronóstico no son válidos.',
    );
  });

  it('DEBE traducir INCOMPLETE_DATA al mensaje de datos meteorológicos incompletos', () => {
    const error: AppError = { type: 'INCOMPLETE_DATA' };

    expect(getErrorMessage('forecast', error)).toBe(
      'Los datos meteorológicos recibidos están incompletos.',
    );
  });

  it('DEBE producir mensajes distintos para el mismo tipo de error en servicios distintos', () => {
    const sharedTypes: AppError['type'][] = ['NETWORK_ERROR', 'TIMEOUT', 'INVALID_RESPONSE'];

    for (const type of sharedTypes) {
      const error = { type } as AppError;
      expect(getErrorMessage('geocoding', error)).not.toBe(getErrorMessage('forecast', error));
    }

    const serviceError = { type: 'SERVICE_ERROR', statusCode: 500 } as AppError;
    expect(getErrorMessage('geocoding', serviceError)).not.toBe(
      getErrorMessage('forecast', serviceError),
    );
  });
});
