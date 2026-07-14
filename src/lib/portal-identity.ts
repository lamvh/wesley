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

// Human-readable label per DB role id (mirrors the seeded `roles.label`).
const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Administrator",
  nurse: "Registered Nurse",
  carer: "Carer",
  activities: "Activities",
  family: "Family",
};

const ADMIN_ROLES = new Set(["super_admin", "admin"]);

const IDENTITY_PALETTE = [
  "#6E875E", "#BE7350", "#8a6ba3", "#5b8f9a", "#b06a5a",
  "#c08a3e", "#7e9b6a", "#6e879e", "#9a7b4f",
];
function colorForName(name: string): string {
  let h = 0;
  for (const ch of name) h = (h + ch.charCodeAt(0)) % IDENTITY_PALETTE.length;
  return IDENTITY_PALETTE[h];
}

// Avatar initials: first+last for multi-word names ("Sarah Beckett" → SB),
// first two letters for single-word usernames ("lamvh" → LA).
function initialsForName(name: string): string {
  const parts = name.trim().replace(/["'“”]/g, "").split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Builds the sidebar/topbar identity from the signed-in user's app_users row.
// Falls back to the demo identity when there's no assignment yet (pre-migration
// fail-open), so the shell always has something to show.
export function identityFromUser(
  appUser: { name: string; role_id: string; scope?: string | null } | null,
  fallbackRole: PortalRole,
): PortalIdentity {
  if (!appUser) return portalIdentity(fallbackRole);
  const label = ROLE_LABELS[appUser.role_id] ?? "Staff";
  const scoped =
    appUser.scope && appUser.scope !== "System" ? `${label} · ${appUser.scope}` : label;
  return {
    name: appUser.name,
    roleLabel: scoped,
    initials: initialsForName(appUser.name),
    color: colorForName(appUser.name),
    console: ADMIN_ROLES.has(appUser.role_id) ? "Admin Console" : "Care Station",
  };
}
