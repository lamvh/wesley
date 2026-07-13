"use client";

import { createContext, useContext, useState } from "react";

interface BuildingContextValue {
  buildingId: string;
  setBuildingId: (id: string) => void;
}

const BuildingContext = createContext<BuildingContextValue | null>(null);

export function BuildingProvider({
  children,
  initialId = "wesley",
}: {
  children: React.ReactNode;
  initialId?: string;
}) {
  const [buildingId, setBuildingId] = useState(initialId);
  return (
    <BuildingContext.Provider value={{ buildingId, setBuildingId }}>
      {children}
    </BuildingContext.Provider>
  );
}

export function useBuilding(): BuildingContextValue {
  const ctx = useContext(BuildingContext);
  if (!ctx) throw new Error("useBuilding must be used within BuildingProvider");
  return ctx;
}
