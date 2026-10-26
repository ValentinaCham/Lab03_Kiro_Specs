import { describe, expect, it, afterEach } from 'vitest';
import { ErrorMessage } from './ErrorMessage';

function mount() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const errorMessage = new ErrorMessage(container);
  return { container, errorMessage };
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('ErrorMessage', () => {
  it('DEBE pintar el mensaje recibido', () => {
    const { errorMessage } = mount();

    errorMessage.show('El servicio de pronóstico no está disponible.');

    expect(errorMessage.root.textContent).toBe('El servicio de pronóstico no está disponible.');
  });

  it('DEBE estar vacío tras construirse', () => {
    const { errorMessage } = mount();

    expect(errorMessage.root.textContent).toBe('');
  });

  it('DEBE borrar el mensaje previo con clear()', () => {
    const { errorMessage } = mount();
    errorMessage.show('Error previo');

    errorMessage.clear();

    expect(errorMessage.root.textContent).toBe('');
  });

  it('DEBE vivir en una región aria-live', () => {
    const { errorMessage } = mount();

    expect(errorMessage.root.getAttribute('aria-live')).not.toBeNull();
  });

  it('DEBE mostrar el mensaje como texto plano', () => {
    const { errorMessage } = mount();

    errorMessage.show('<b>Error</b>');

    expect(errorMessage.root.querySelector('b')).toBeNull();
    expect(errorMessage.root.textContent).toBe('<b>Error</b>');
  });
});
