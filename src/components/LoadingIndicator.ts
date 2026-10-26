/**
 * Indicador de carga.
 *
 * Su contenedor es una región `aria-live` para que un lector de pantalla
 * comunique la búsqueda en curso (Req. 6.3).
 */

export class LoadingIndicator {
  readonly root: HTMLElement;

  constructor(container: HTMLElement) {
    this.root = document.createElement('div');
    this.root.className = 'loading-indicator';
    this.root.setAttribute('role', 'status');
    this.root.setAttribute('aria-live', 'polite');
    this.root.hidden = true;

    const message = document.createElement('p');
    message.textContent = 'Consultando el pronóstico del clima...';

    this.root.appendChild(message);
    container.appendChild(this.root);
  }

  show(): void {
    this.root.hidden = false;
  }

  hide(): void {
    this.root.hidden = true;
  }
}
