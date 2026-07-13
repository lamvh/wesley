import type {
  AppModule,
  ModuleKey,
  Permission,
  PermissionMatrix,
  User,
  UserRole,
} from "@/types/domain";

const users: User[] = [
  { name: "Sarah Beckett", email: "sarah.beckett@wesley.nz", role: "admin", scope: "All wings", status: "Active", last: "Online now", initials: "SB", color: "#BE7350" },
  { name: "IT Administrator", email: "it@wesley.nz", role: "super_admin", scope: "System", status: "Active", last: "2h ago", initials: "IT", color: "#2C3563" },
  { name: "Aroha Ngata", email: "aroha.ngata@wesley.nz", role: "nurse", scope: "Rātā wing", status: "Active", last: "12m ago", initials: "AN", color: "#6E875E" },
  { name: "David Cho", email: "david.cho@wesley.nz", role: "nurse", scope: "Kōwhai wing", status: "Active", last: "1h ago", initials: "DC", color: "#8a6ba3" },
  { name: "Mere Solomon", email: "mere.solomon@wesley.nz", role: "carer", scope: "Rātā wing", status: "Active", last: "25m ago", initials: "MS", color: "#b06a5a" },
  { name: "Tomasi Fifita", email: "tomasi.fifita@wesley.nz", role: "carer", scope: "Kōwhai wing", status: "Active", last: "Yesterday", initials: "TF", color: "#5b8f9a" },
  { name: "Grace Lin", email: "grace.lin@wesley.nz", role: "activities", scope: "All wings", status: "Active", last: "3h ago", initials: "GL", color: "#c08a3e" },
  { name: "Priya Nair", email: "priya.nair@wesley.nz", role: "carer", scope: "Kōwhai wing", status: "Invited", last: "Pending", initials: "PN", color: "#7e9b6a" },
  { name: "David Whitcombe", email: "d.whitcombe@gmail.com", role: "family", scope: "Peggy W. · Rātā 12", status: "Active", last: "2d ago", initials: "DW", color: "#6e879e" },
  { name: "Katherine Ruatoto", email: "k.ruatoto@gmail.com", role: "family", scope: "Joan F. · Rātā 15", status: "Suspended", last: "2 wk ago", initials: "KR", color: "#9a7b4f" },
];

const modules: AppModule[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "residents", label: "Residents" },
  { key: "rooms", label: "Rooms" },
  { key: "roster", label: "Roster & shifts" },
  { key: "meals", label: "Meals & dietary" },
  { key: "activities", label: "Activities" },
  { key: "family", label: "Family portal" },
  { key: "stock", label: "Stock & supplies" },
  { key: "incidents", label: "Incidents & compliance" },
  { key: "users", label: "Users & access" },
];

// [view, create, edit, delete]
const p = (v: number, c: number, e: number, d: number): Permission => ({
  view: !!v, create: !!c, edit: !!e, delete: !!d,
});

const ALL = p(1, 1, 1, 1);
const NONE = p(0, 0, 0, 0);

type Preset = Record<Exclude<UserRole, "super_admin">, Record<ModuleKey, Permission>>;

const preset: Preset = {
  admin: { dashboard: p(1,1,1,0), residents: ALL, rooms: ALL, roster: ALL, meals: ALL, activities: ALL, family: ALL, stock: ALL, incidents: ALL, users: ALL },
  nurse: { dashboard: p(1,0,0,0), residents: p(1,1,1,0), rooms: p(1,0,0,0), roster: p(1,0,0,0), meals: p(1,0,1,0), activities: p(1,0,0,0), family: p(1,1,0,0), stock: p(1,0,0,0), incidents: p(1,1,1,0), users: NONE },
  carer: { dashboard: p(1,0,0,0), residents: p(1,0,1,0), rooms: p(1,0,0,0), roster: p(1,0,0,0), meals: p(1,0,0,0), activities: p(1,0,0,0), family: p(1,0,0,0), stock: NONE, incidents: p(1,1,0,0), users: NONE },
  activities: { dashboard: p(1,0,0,0), residents: p(1,0,0,0), rooms: NONE, roster: p(1,0,0,0), meals: p(1,0,0,0), activities: ALL, family: p(1,1,0,0), stock: p(1,0,0,0), incidents: p(1,0,0,0), users: NONE },
  family: { dashboard: NONE, residents: p(1,0,0,0), rooms: NONE, roster: NONE, meals: p(1,0,0,0), activities: p(1,0,0,0), family: p(1,1,0,0), stock: NONE, incidents: NONE, users: NONE },
};

export const ROLE_KEYS: UserRole[] = ["super_admin", "admin", "nurse", "carer", "activities", "family"];

export function getUsers(): User[] {
  return users;
}

export function getModules(): AppModule[] {
  return modules;
}

/** Fresh copy of the default permission matrix (super_admin = everything). */
export function getDefaultPermissions(): PermissionMatrix {
  const out = {} as PermissionMatrix;
  for (const role of ROLE_KEYS) {
    out[role] = {} as Record<ModuleKey, Permission>;
    for (const m of modules) {
      const base = role === "super_admin" ? ALL : preset[role][m.key];
      out[role][m.key] = { ...base };
    }
  }
  return out;
}

export function countGranted(mods: AppModule[], perms: Record<ModuleKey, Permission>): number {
  let n = 0;
  for (const m of mods) {
    const perm = perms[m.key];
    if (perm) n += Number(perm.view) + Number(perm.create) + Number(perm.edit) + Number(perm.delete);
  }
  return n;
}
