/**
 * Punto de entrada de la SPA.
 *
 * Resuelve los contenedores declarados en `index.html` y monta la aplicación.
 */

import { createApp } from './app';

function requireElement(id: string): HTMLElement {
  const element = document.getElementById(id);
  if (element === null) {
    throw new Error(`No se encontró el contenedor #${id} en index.html`);
  }
  return element;
}

createApp({
  search: requireElement('search-container'),
  loading: requireElement('loading-container'),
  error: requireElement('error-container'),
  weather: requireElement('weather-container'),
});
