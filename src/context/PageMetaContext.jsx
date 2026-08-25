import { createContext, useContext, useEffect, useState } from "react";

const PageMetaContext = createContext(null);

export function PageMetaProvider({ children }) {
  const [meta, setMeta] = useState(null);
  return (
    <PageMetaContext.Provider value={{ meta, setMeta }}>{children}</PageMetaContext.Provider>
  );
}

export function usePageMetaState() {
  const ctx = useContext(PageMetaContext);
  if (!ctx) throw new Error("usePageMetaState debe usarse dentro de <PageMetaProvider>");
  return ctx;
}

/**
 * Permite que una página publique un título/breadcrumb dinámico para el header.
 * @param {{title?: string, breadcrumb?: {label:string, to?:string}[]}} meta
 * @param {any[]} deps
 */
export function usePageMeta(meta, deps = []) {
  const { setMeta } = usePageMetaState();

  useEffect(() => {
    setMeta(meta);
    return () => setMeta(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
