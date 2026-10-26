import { describe, expect, it, afterEach } from 'vitest';
import type { WeatherData } from '../types';
import { WeatherDisplay } from './WeatherDisplay';

const weather: WeatherData = { temperature: 8.4, humidity: 72, precipitation: 0.5 };

function mount() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const display = new WeatherDisplay(container);
  return { container, display };
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('WeatherDisplay', () => {
  it('DEBE mostrar el nombre de la ciudad retornado por la API', () => {
    const { display } = mount();

    display.render(weather, 'Berlin', 'Berlín');

    expect(display.root.textContent).toContain('Berlin');
  });

  it('DEBE aplicar fallback al nombre del usuario si la API no devuelve nombre', () => {
    const { display } = mount();

    display.render(weather, undefined, 'Ciudad Escribida');

    expect(display.root.textContent).toContain('Ciudad Escribida');
  });

  it('DEBE aplicar fallback al nombre del usuario si el nombre de la API está vacío', () => {
    const { display } = mount();

    display.render(weather, '', 'Ciudad Escribida');

    expect(display.root.textContent).toContain('Ciudad Escribida');
  });

  it('DEBE aplicar fallback al nombre del usuario si el nombre de la API solo tiene espacios', () => {
    const { display } = mount();

    display.render(weather, '   ', 'Ciudad Escribida');

    expect(display.root.textContent).toContain('Ciudad Escribida');
  });

  it('DEBE mostrar los tres valores del clima con sus unidades', () => {
    const { display } = mount();

    display.render(weather, 'Berlin', 'Berlin');

    expect(display.root.textContent).toContain('8.4 °C');
    expect(display.root.textContent).toContain('72 %');
    expect(display.root.textContent).toContain('0.5 mm');
  });

  it('DEBE vaciar el contenido con clear()', () => {
    const { display } = mount();
    display.render(weather, 'Berlin', 'Berlin');

    display.clear();

    expect(display.root.textContent).toBe('');
    expect(display.root.childElementCount).toBe(0);
  });

  it('DEBE mostrar un nombre de ciudad con HTML como texto literal', () => {
    const { display } = mount();

    display.render(weather, '<script>alert("xss")</script>', 'Berlin');

    expect(display.root.querySelector('script')).toBeNull();
    expect(display.root.textContent).toContain('<script>alert("xss")</script>');
  });

  it('DEBE escribir el contenido con textContent y nunca con innerHTML', () => {
    const { display } = mount();

    display.render(weather, '<b>Berlin</b>', 'Berlin');

    expect(display.root.querySelector('b')).toBeNull();
    expect(display.root.innerHTML).not.toContain('<b>');
  });
});
