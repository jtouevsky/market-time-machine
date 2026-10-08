/** Tiny inline icon set shared by the 2013–2026 headers (stroke icons, currentColor, decorative). */
export type IconName = 'home' | 'pie' | 'search' | 'spark' | 'exit' | 'user';

const PATHS: Record<IconName, JSX.Element> = {
  home: <path d="M3.5 10.5 12 3.5l8.5 7M5.5 9.5V20h5v-5.5h3V20h5V9.5" />,
  pie: <><path d="M12 3.5v8.5h8.5" /><path d="M20.4 14.5A8.5 8.5 0 1 1 9.5 3.6" /></>,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5" /></>,
  spark: <path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM18.5 15.5l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z" />,
  exit: <path d="M14 4.5h5.5v15H14M10 8l-4 4 4 4M6 12h10" />,
  user: <><circle cx="12" cy="8.5" r="3.6" /><path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5" /></>,
};

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg className="h-ico" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable="false">
      {PATHS[name]}
    </svg>
  );
}
