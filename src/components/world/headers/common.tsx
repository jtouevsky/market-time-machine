/** Shared bits for the era headers. */
import React from 'react';
import { useSim, type View } from '../../../state/simulation';

export function roman(n: number) {
  const map: [number, string][] = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
  let s = '';
  for (const [v, r] of map) while (n >= v) { s += r; n -= v; }
  return s;
}

export function NavItem({ to, label, active, className = '' }: { to: View; label: React.ReactNode; active: boolean; className?: string }) {
  const { go } = useSim();
  return (
    <button type="button" className={`h-nav-item ${className}${active ? ' is-active' : ''}`} aria-current={active ? 'page' : undefined} onClick={() => go(to)}>
      {label}
    </button>
  );
}

export const scrollTo = (id: string) => setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
