import type { PortalRole } from "@/types/domain";

// Signed-in identity + console label per role (design values).
export interface PortalIdentity {
  name: string;
  roleLabel: string;
  initials: string;
  color: string;
  console: string;
}

export function portalIdentity(role: PortalRole): PortalIdentity {
  return role === "admin"
    ? {
        name: "Sarah Beckett",
        roleLabel: "Facility Manager",
        initials: "SB",
        color: "#BE7350",
        console: "Admin Console",
      }
    : {
        name: "Aroha Ngata",
        roleLabel: "Registered Nurse · Rātā",
        initials: "AN",
        color: "#6E875E",
        console: "Care Station",
      };
}
