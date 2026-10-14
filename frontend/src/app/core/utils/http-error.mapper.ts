import { HttpErrorResponse } from '@angular/common/http';

import { ErrorResponse } from '../models/reconciliation.model';

export interface UiError {
  message: string;
  details: string[];
}

const FALLBACK_BY_STATUS: Record<number, string> = {
  0: 'No fue posible conectar con el servidor. Verifica que el backend esté en ejecución e inténtalo de nuevo.',
  400: 'Uno de los archivos no es válido. Revisa que sea un CSV con datos.',
  413: 'Uno de los archivos supera el tamaño máximo permitido (2 MB).',
  422: 'Los archivos no tienen el formato esperado.',
  500: 'Ocurrió un error inesperado en el servidor. Inténtalo de nuevo más tarde.',
};

const GENERIC_MESSAGE = 'No fue posible procesar los archivos. Inténtalo de nuevo.';

function isErrorResponse(body: unknown): body is ErrorResponse {
  return (
    typeof body === 'object' &&
    body !== null &&
    typeof (body as ErrorResponse).message === 'string' &&
    (body as ErrorResponse).message.trim().length > 0
  );
}

/** Maps any error to a user-facing Spanish message. The backend `message` wins when present. */
export function mapHttpError(error: unknown): UiError {
  if (!(error instanceof HttpErrorResponse)) {
    return { message: GENERIC_MESSAGE, details: [] };
  }
  if (error.status !== 0 && isErrorResponse(error.error)) {
    const details = Array.isArray(error.error.details)
      ? error.error.details.filter((d): d is string => typeof d === 'string')
      : [];
    return { message: error.error.message, details };
  }
  return { message: FALLBACK_BY_STATUS[error.status] ?? GENERIC_MESSAGE, details: [] };
}
