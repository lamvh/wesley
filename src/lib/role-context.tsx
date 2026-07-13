"use client";

import { createContext, useContext, useState } from "react";
import type { PortalRole } from "@/types/domain";

interface RoleContextValue {
  role: PortalRole;
  setRole: (role: PortalRole) => void;
}

const RoleContext = createContext<RoleContextValue | null>(null);

export function PortalRoleProvider({
  children,
  initialRole = "admin",
}: {
  children: React.ReactNode;
  initialRole?: PortalRole;
}) {
  const [role, setRole] = useState<PortalRole>(initialRole);
  return (
    <RoleContext.Provider value={{ role, setRole }}>
      {children}
    </RoleContext.Provider>
  );
}

export function usePortalRole(): RoleContextValue {
  const ctx = useContext(RoleContext);
  if (!ctx) {
    throw new Error("usePortalRole must be used within PortalRoleProvider");
  }
  return ctx;
}
