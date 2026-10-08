import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import type { VisualFamily } from '../../../theme/registry/types';
import type { FrameProps } from '../shared';

/**
 * One dynamically imported module per visual family. Nothing from a family (components or CSS)
 * is in the initial bundle; the module is fetched once, cached by the module system and reused.
 */
const LOADERS: Record<VisualFamily, () => Promise<{ default: ComponentType<FrameProps> }>> = {
  print: () => import('./print'),
  broadcast: () => import('./broadcast'),
  terminal: () => import('./terminal'),
  desktop: () => import('./desktop'),
  earlyweb: () => import('./earlyweb'),
  portal: () => import('./portal'),
  web2: () => import('./web2'),
  skeuo: () => import('./skeuo'),
  flat: () => import('./flat'),
  modern: () => import('./modern'),
  experimental: () => import('./experimental'),
};

export const FRAMES = Object.fromEntries(
  (Object.keys(LOADERS) as VisualFamily[]).map((f) => [f, lazy(LOADERS[f])]),
) as Record<VisualFamily, LazyExoticComponent<ComponentType<FrameProps>>>;

/** Start fetching a family's code early (e.g. while the time-travel transition plays). */
export function preloadFamily(family: VisualFamily): void { void LOADERS[family](); }
