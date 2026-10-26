/**
 * Formulario de búsqueda de ciudad.
 *
 * Es el **único** punto de validación de la app (BR-UI-10): rejects la entrada
 * vacía o de solo espacios en blanco y entrega al controlador el valor ya
 * recortado. No realiza ninguna llamada de red (design.md §CitySearchForm).
 */

import { MAX_CITY_NAME_LENGTH } from '../config';
import { VALIDATION_EMPTY_MESSAGE } from '../utils/errorMessages';

/** Contador de instancias: garantiza que cada `id` del DOM sea único. */
let instanceCounter = 0;

export class CitySearchForm {
  readonly root: HTMLFormElement;
  private readonly input: HTMLInputElement;
  private readonly validationMessage: HTMLElement;

  /**
   * Callback de búsqueda. El controlador lo reasigna al construirse, de modo
   * que el formulario y el controlador no dependan del orden de instanciación.
   */
  onSearch: (cityName: string) => void;

  constructor(
    container: HTMLElement,
    onSearch: (cityName: string) => void = () => {},
  ) {
    this.onSearch = onSearch;
    this.root = document.createElement('form');
    this.root.className = 'search-form';
    this.root.noValidate = true;

    const inputId = `city-input-${++instanceCounter}`;

    const label = document.createElement('label');
    label.className = 'search-label';
    label.setAttribute('for', inputId);
    label.textContent = 'Ciudad';

    this.input = document.createElement('input');
    this.input.type = 'text';
    this.input.id = inputId;
    this.input.name = 'city';
    this.input.className = 'city-input';
    this.input.maxLength = MAX_CITY_NAME_LENGTH;
    this.input.autocomplete = 'off';

    const button = document.createElement('button');
    button.type = 'submit';
    button.className = 'search-button';
    button.textContent = 'Buscar';

    this.validationMessage = document.createElement('p');
    this.validationMessage.className = 'validation-message';
    this.validationMessage.setAttribute('aria-live', 'polite');
    this.validationMessage.hidden = true;

    this.root.append(label, this.input, button, this.validationMessage);
    container.appendChild(this.root);

    this.root.addEventListener('submit', this.handleSubmit);
    this.input.addEventListener('keydown', this.handleKeyDown);
    this.input.addEventListener('input', this.handleInput);
  }

  /** Devuelve el foco al campo de búsqueda (Req. 1.6). */
  focus(): void {
    this.input.focus();
  }

  get value(): string {
    return this.input.value;
  }

  private readonly handleSubmit = (event: Event): void => {
    event.preventDefault();
    this.submit();
  };

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== 'Enter') return;
    // Se cancela la sumisión implícita del formulario para no disparar dos
    // búsquedas con una sola pulsación de Enter.
    event.preventDefault();
    this.submit();
  };

  private readonly handleInput = (): void => {
    this.clearValidationMessage();
  };

  private submit(): void {
    const cityName = this.input.value.trim();
    if (cityName.length === 0) {
      this.showValidationMessage(VALIDATION_EMPTY_MESSAGE);
      return;
    }
    this.clearValidationMessage();
    this.onSearch(cityName);
  }

  private showValidationMessage(message: string): void {
    this.validationMessage.textContent = message;
    this.validationMessage.hidden = false;
  }

  private clearValidationMessage(): void {
    this.validationMessage.textContent = '';
    this.validationMessage.hidden = true;
  }
}
