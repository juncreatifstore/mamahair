"use client";

import { createContext, useContext, useMemo, useState } from "react";

type VariantImageContextValue = {
  selectedImageUrl: string | null;
  setSelectedImageUrl: (url: string | null) => void;
};

const VariantImageContext = createContext<VariantImageContextValue | null>(null);

export function VariantImageProvider({ children }: { children: React.ReactNode }) {
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const value = useMemo(() => ({ selectedImageUrl, setSelectedImageUrl }), [selectedImageUrl]);
  return <VariantImageContext.Provider value={value}>{children}</VariantImageContext.Provider>;
}

export function useVariantImage() {
  return useContext(VariantImageContext);
}
