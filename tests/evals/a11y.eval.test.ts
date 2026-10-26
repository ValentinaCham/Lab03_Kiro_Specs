/**
 * Eval de accesibilidad del DOM final (tarea 11.5).
 *
 * Comprueba los criterios del Requisito 6 sobre la aplicación montada y sobre
 * la hoja de estilos real: asociación de etiqueta, foco visible, regiones
 * `aria-live` y relación de contraste WCAG.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app';

const stylesText = readFileSync(resolve(process.cwd(), 'src/styles.css'), 'utf-8');

function mountApp() {
  const root = document.createElement('div');
  document.body.appendChild(root);

  const search = document.createElement('div');
  const loading = document.createElement('div');
  const error = document.createElement('div');
  const weather = document.createElement('div');
  root.append(search, loading, error, weather);

  return { root, ...createApp({ search, loading, error, weather }) };
}

/** Lee una variable CSS con formato hexadecimal. */
function cssVariable(name: string): string {
  const match = new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{3,6});`).exec(stylesText);
  if (match === null) throw new Error(`Variable CSS no encontrada: --${name}`);
  return match[1] as string;
}

function parseHex(hex: string): [number, number, number] {
  const clean = hex.trim().replace('#', '');
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((char) => char + char)
          .join('')
      : clean;
  return [
    Number.parseInt(full.slice(0, 2), 16),
    Number.parseInt(full.slice(2, 4), 16),
    Number.parseInt(full.slice(4, 6), 16),
  ];
}

function relativeLuminance(hex: string): number {
  const [red, green, blue] = parseHex(hex);
  const linear = (channel: number): number => {
    const ratio = channel / 255;
    return ratio <= 0.03928 ? ratio / 12.92 : ((ratio + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * linear(red) + 0.7152 * linear(green) + 0.0722 * linear(blue);
}

/** Relación de contraste WCAG 2.1 entre dos colores. */
function contrastRatio(foreground: string, background: string): number {
  const first = relativeLuminance(foreground);
  const second = relativeLuminance(background);
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);
  return (lighter + 0.05) / (darker + 0.05);
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('Accesibilidad del DOM final', () => {
  it('DEBE asociar un label visible al campo City_Input', () => {
    const { root } = mountApp();

    const input = root.querySelector('input');
    expect(input).not.toBeNull();
    expect(input?.labels).toHaveLength(1);
    expect(input?.labels?.[0]?.textContent?.trim()).not.toBe('');
  });

  it('DEBE anunciar la carga, el error y la validación mediante regiones aria-live', () => {
    const { root, loadingIndicator, errorMessage } = mountApp();

    expect(loadingIndicator.root.getAttribute('aria-live')).not.toBeNull();
    expect(errorMessage.root.getAttribute('aria-live')).not.toBeNull();
    expect(root.querySelector('.validation-message')?.getAttribute('aria-live')).not.toBeNull();
  });

  it('DEBE definir un indicador de foco visible sin eliminar el outline', () => {
    expect(stylesText).toMatch(/:focus-visible\s*\{/);
    expect(stylesText).not.toMatch(/outline\s*:\s*none/);
  });

  it('DEBE alcanzar una relación de contraste de al menos 4.5:1 en los pares de texto', () => {
    const background = cssVariable('color-bg');
    const surface = cssVariable('color-surface');

    const pairs: [string, string][] = [
      [cssVariable('color-text'), background],
      [cssVariable('color-muted'), background],
      [cssVariable('color-text'), surface],
      [cssVariable('color-error'), background],
      [cssVariable('color-error'), cssVariable('color-error-surface')],
      [cssVariable('color-accent-contrast'), cssVariable('color-accent')],
    ];

    for (const [foreground, back] of pairs) {
      const ratio = contrastRatio(foreground, back);
      expect(ratio, `Contraste insuficiente entre ${foreground} y ${back}`).toBeGreaterThanOrEqual(
        4.5,
      );
    }
  });

  it('DEBE renderizar el nombre de la ciudad como texto plano', () => {
    const { weatherDisplay } = mountApp();

    weatherDisplay.render(
      { temperature: 8.4, humidity: 72, precipitation: 0 },
      '<img src=x onerror=alert(1)>',
      'Ciudad',
    );

    expect(weatherDisplay.root.querySelector('img')).toBeNull();
    expect(weatherDisplay.root.textContent).toContain('<img src=x onerror=alert(1)>');
  });
});
