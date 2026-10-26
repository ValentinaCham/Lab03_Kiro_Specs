import { fireEvent, getByLabelText, getByRole } from '@testing-library/dom';
import { describe, expect, it, vi, afterEach } from 'vitest';
import { CitySearchForm } from './CitySearchForm';

function mount() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const onSearch = vi.fn();
  const form = new CitySearchForm(container, onSearch);
  return { container, onSearch, form };
}

function cityInput(container: HTMLElement): HTMLInputElement {
  const input = container.querySelector('input');
  if (input === null) throw new Error('City_Input no encontrado');
  return input;
}

function validationMessage(container: HTMLElement): Element {
  const message = container.querySelector('.validation-message');
  if (message === null) throw new Error('Zona de validación no encontrada');
  return message;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('CitySearchForm', () => {
  it('DEBE renderizar el campo City_Input con maxlength=100', () => {
    const { container } = mount();

    expect(cityInput(container).getAttribute('maxlength')).toBe('100');
  });

  it('DEBE renderizar un botón de envío de tipo submit', () => {
    const { container } = mount();

    const button = container.querySelector('button');
    expect(button).not.toBeNull();
    expect(button?.type).toBe('submit');
  });

  it('DEBE iniciar la búsqueda con un clic en el botón', () => {
    const { container, onSearch } = mount();
    cityInput(container).value = 'Berlin';

    fireEvent.click(getByRole(container, 'button'));

    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith('Berlin');
  });

  it('DEBE iniciar la búsqueda con la tecla Enter mientras City_Input está enfocado', () => {
    const { container, onSearch } = mount();
    const input = cityInput(container);
    input.value = 'Berlin';
    input.focus();

    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith('Berlin');
  });

  it('DEBE asociar un label visible al campo City_Input', () => {
    const { container } = mount();

    const label = container.querySelector('label');
    expect(label?.textContent?.trim()).not.toBe('');
    expect(getByLabelText(container, 'Ciudad')).toBe(cityInput(container));
  });

  it('DEBE exponer el mensaje de validación en una región aria-live', () => {
    const { container } = mount();

    expect(validationMessage(container).getAttribute('aria-live')).not.toBeNull();
  });

  it('DEBE mostrar un mensaje de validación y no iniciar la búsqueda con la entrada vacía', () => {
    const { container, onSearch } = mount();

    fireEvent.click(getByRole(container, 'button'));

    expect(onSearch).not.toHaveBeenCalled();
    expect(validationMessage(container).textContent).toBe(
      'El nombre de la ciudad es obligatorio.',
    );
  });

  it('DEBE mostrar un mensaje de validación y no iniciar la búsqueda con solo espacios', () => {
    const { container, onSearch } = mount();
    cityInput(container).value = '   ';

    fireEvent.click(getByRole(container, 'button'));

    expect(onSearch).not.toHaveBeenCalled();
    expect(validationMessage(container).textContent).toBe(
      'El nombre de la ciudad es obligatorio.',
    );
  });

  it('DEBE limpiar el mensaje de validación al editar el campo', () => {
    const { container } = mount();
    const input = cityInput(container);

    fireEvent.click(getByRole(container, 'button'));
    expect(validationMessage(container).textContent).not.toBe('');

    input.value = 'Ber';
    fireEvent.input(input);

    expect(validationMessage(container).textContent).toBe('');
  });

  it('DEBE devolver el foco a City_Input con focus()', () => {
    const { container, form } = mount();
    const input = cityInput(container);

    form.focus();

    expect(document.activeElement).toBe(input);
    expect(input.disabled).toBe(false);
  });
});
