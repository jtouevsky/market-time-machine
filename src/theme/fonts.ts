/**
 * Era fonts are fetched on demand, only for the experience being visited. Everything falls back to
 * system fonts if the request is blocked or slow (font-display: swap), so a missing font never
 * blocks rendering.
 */
const requested = new Set<string>();

export function ensureFonts(specs?: string[]): void {
  if (!specs?.length || typeof document === 'undefined') return;
  const key = specs.join('|');
  if (requested.has(key)) return;
  requested.add(key);
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?${specs.map((s) => `family=${s}`).join('&')}&display=swap`;
  document.head.appendChild(link);
}
