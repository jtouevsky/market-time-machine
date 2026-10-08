/**
 * Which "page" of a multi-page composition is showing (newspaper leaf, radio station, teletext
 * page, terminal screen, DOS menu item). Shared between the header's navigation and the content.
 */
import React, { createContext, useContext, useMemo, useState } from 'react';

interface PageState { page: number; setPage: (n: number) => void }
const PageCtx = createContext<PageState>({ page: 0, setPage: () => undefined });

export function PageProvider({ children }: { children: React.ReactNode }) {
  const [page, setPage] = useState(0);
  const value = useMemo(() => ({ page, setPage }), [page]);
  return <PageCtx.Provider value={value}>{children}</PageCtx.Provider>;
}
export const usePage = () => useContext(PageCtx);
