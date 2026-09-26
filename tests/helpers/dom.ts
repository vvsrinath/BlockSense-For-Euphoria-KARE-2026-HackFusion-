/**
 * jsdom stand-ins for browser APIs the components read on mount.
 *
 * jsdom implements neither `matchMedia` nor the observers, and the settings
 * provider asks for the colour-scheme preference in its initial state, so a
 * component test that mounts it would throw before rendering anything.
 */

export function stubMatchMedia(): void {
  if (typeof window === 'undefined' || typeof window.matchMedia === 'function') return;
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string): MediaQueryList =>
      ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        addListener: () => undefined,
        removeListener: () => undefined,
        dispatchEvent: () => false
      }) as unknown as MediaQueryList
  });
}
