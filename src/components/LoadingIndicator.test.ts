import { describe, expect, it, afterEach } from 'vitest';
import { LoadingIndicator } from './LoadingIndicator';

function mount() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const indicator = new LoadingIndicator(container);
  return { container, indicator };
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('LoadingIndicator', () => {
  it('DEBE estar oculto al construirse', () => {
    const { indicator } = mount();

    expect(indicator.root.hidden).toBe(true);
  });

  it('DEBE hacerse visible con show()', () => {
    const { indicator } = mount();

    indicator.show();

    expect(indicator.root.hidden).toBe(false);
  });

  it('DEBE ocultarse con hide()', () => {
    const { indicator } = mount();
    indicator.show();

    indicator.hide();

    expect(indicator.root.hidden).toBe(true);
  });

  it('DEBE vivir en una región aria-live', () => {
    const { indicator } = mount();

    expect(indicator.root.getAttribute('aria-live')).not.toBeNull();
  });

  it('DEBE comunicar el estado de carga mediante texto', () => {
    const { indicator } = mount();

    expect(indicator.root.textContent?.trim()).not.toBe('');
  });
});
