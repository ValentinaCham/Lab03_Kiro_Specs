/**
 * Zona de mensajes de error.
 *
 * Solo pinta el string que recibe: el mapeo *error de dominio + servicio →
 * mensaje* vive en `src/utils/errorMessages.ts` (D6). Su contenedor es una
 * región `aria-live` (Req. 6.3).
 */

export class ErrorMessage {
  readonly root: HTMLElement;

  constructor(container: HTMLElement) {
    this.root = document.createElement('div');
    this.root.className = 'error-message';
    this.root.setAttribute('role', 'alert');
    this.root.setAttribute('aria-live', 'assertive');
    this.root.hidden = true;
    container.appendChild(this.root);
  }

  show(message: string): void {
    this.root.textContent = message;
    this.root.hidden = false;
  }

  clear(): void {
    this.root.textContent = '';
    this.root.hidden = true;
  }
}
