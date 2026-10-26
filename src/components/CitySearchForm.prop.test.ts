import fc from 'fast-check';
import { fireEvent, getByRole } from '@testing-library/dom';
import { describe, expect, it, vi, afterEach } from 'vitest';
import { assertPropertyAsync } from '../../tests/evals/props';
import { CitySearchForm } from './CitySearchForm';

function mount() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const onSearch = vi.fn();
  const form = new CitySearchForm(container, onSearch);
  return { container, onSearch, form };
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('CitySearchForm', () => {
  // Feature: weather-forecast-app, Propiedad 1: Rechazo de entradas de solo whitespace
  it('P1: rechazo de entradas de solo whitespace', async () => {
    await assertPropertyAsync(
      fc.asyncProperty(
        fc.stringOf(fc.constantFrom(' ', '\t', '\n', '\r')),
        async (whitespace) => {
          const { container, onSearch } = mount();
          const input = container.querySelector('input');
          if (input === null) throw new Error('City_Input no encontrado');
          input.value = whitespace;

          fireEvent.click(getByRole(container, 'button'));

          expect(onSearch).not.toHaveBeenCalled();
          expect(
            container.querySelector('.validation-message')?.textContent,
          ).toBe('El nombre de la ciudad es obligatorio.');
        },
      ),
    );
  });

  // Feature: weather-forecast-app, Propiedad 2: Trim del nombre de ciudad antes de enviar
  it('P2: trim del nombre de ciudad antes de enviar', async () => {
    const surroundingWhitespace = fc.stringOf(fc.constantFrom(' ', '\t', '\n', '\r'));
    const core = fc
      .string({ minLength: 1 })
      .filter((value) => value.trim().length > 0);

    await assertPropertyAsync(
      fc.asyncProperty(
        fc.tuple(surroundingWhitespace, core, surroundingWhitespace),
        async ([leading, middle, trailing]) => {
          const { container, onSearch } = mount();
          const input = container.querySelector('input');
          if (input === null) throw new Error('City_Input no encontrado');
          const typed = `${leading}${middle}${trailing}`;
          input.value = typed;

          fireEvent.click(getByRole(container, 'button'));

          expect(onSearch).toHaveBeenCalledTimes(1);
          expect(onSearch).toHaveBeenCalledWith(typed.trim());
        },
      ),
    );
  });
});
