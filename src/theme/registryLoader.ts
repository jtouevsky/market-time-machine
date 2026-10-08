/** The era registry (63 experiences) loads on demand so the landing page stays small. */
type Registry = typeof import('./registry');
let loaded: Registry | null = null;
let pending: Promise<Registry> | null = null;

export function loadRegistry(): Promise<Registry> {
  if (loaded) return Promise.resolve(loaded);
  pending ??= import('./registry').then((m) => (loaded = m));
  return pending;
}

/** Synchronous access — only valid after `loadRegistry()` has resolved (the world and transition are mounted after it). */
export function registryNow(): Registry {
  if (!loaded) throw new Error('era registry not loaded yet');
  return loaded;
}
