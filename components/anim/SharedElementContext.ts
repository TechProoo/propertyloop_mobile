import { createContext, useContext } from "react";

export interface SharedElementLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SharedElementContextValue {
  register: (id: string, layout: SharedElementLayout) => void;
  unregister: (id: string) => void;
  getLayout: (id: string) => SharedElementLayout | null;
}

export const SharedElementContext = createContext<SharedElementContextValue | null>(null);

export function useSharedElementContext(): SharedElementContextValue {
  const ctx = useContext(SharedElementContext);
  if (!ctx) {
    throw new Error("useSharedElementContext must be used within SharedElementProvider");
  }
  return ctx;
}
