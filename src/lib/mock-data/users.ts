import type {
  AppModule,
  ModuleKey,
  Permission,
  PermissionMatrix,
  User,
  UserRole,
} from "@/types/domain";

const users: User[] = [
  { name: "Sarah Beckett", username: "sarah.beckett", email: "sarah.beckett@wesley.nz", role: "admin", scope: "All wings", buildingId: "wesley", status: "Active", last: "Online now", initials: "SB", color: "#BE7350" },
  { name: "IT Administrator", username: "it", email: "it@wesley.nz", role: "super_admin", scope: "System", buildingId: "wesley", status: "Active", last: "2h ago", initials: "IT", color: "#2C3563" },
  { name: "Aroha Ngata", username: "aroha.ngata", email: "aroha.ngata@wesley.nz", role: "nurse", scope: "Rātā wing", buildingId: "wesley", status: "Active", last: "12m ago", initials: "AN", color: "#6E875E" },
  { name: "David Cho", username: "david.cho", email: "david.cho@wesley.nz", role: "nurse", scope: "Kōwhai wing", buildingId: "wesley", status: "Active", last: "1h ago", initials: "DC", color: "#8a6ba3" },
  { name: "Mere Solomon", username: "mere.solomon", email: "mere.solomon@wesley.nz", role: "carer", scope: "Rātā wing", buildingId: "wesley", status: "Active", last: "25m ago", initials: "MS", color: "#b06a5a" },
  { name: "Tomasi Fifita", username: "tomasi.fifita", email: "tomasi.fifita@wesley.nz", role: "carer", scope: "Kōwhai wing", buildingId: "wesley", status: "Active", last: "Yesterday", initials: "TF", color: "#5b8f9a" },
  { name: "Grace Lin", username: "grace.lin", email: "grace.lin@wesley.nz", role: "activities", scope: "All wings", buildingId: "wesley", status: "Active", last: "3h ago", initials: "GL", color: "#c08a3e" },
  { name: "Priya Nair", username: "priya.nair", email: "priya.nair@wesley.nz", role: "carer", scope: "Kōwhai wing", buildingId: "wesley", status: "Invited", last: "Pending", initials: "PN", color: "#7e9b6a" },
  { name: "David Whitcombe", username: "d.whitcombe", email: "d.whitcombe@gmail.com", role: "family", scope: "Peggy W. · Rātā 12", buildingId: "wesley", status: "Active", last: "2d ago", initials: "DW", color: "#6e879e" },
  { name: "Katherine Ruatoto", username: "k.ruatoto", email: "k.ruatoto@gmail.com", role: "family", scope: "Joan F. · Rātā 15", buildingId: "wesley", status: "Suspended", last: "2 wk ago", initials: "KR", color: "#9a7b4f" },
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
  { key: "forms", label: "Forms" },
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
  admin: { dashboard: p(1,1,1,0), residents: ALL, rooms: ALL, roster: ALL, meals: ALL, activities: ALL, family: ALL, stock: ALL, forms: ALL, incidents: ALL, users: ALL },
  nurse: { dashboard: p(1,0,0,0), residents: p(1,1,1,0), rooms: p(1,0,0,0), roster: p(1,0,0,0), meals: p(1,0,1,0), activities: p(1,0,0,0), family: p(1,1,0,0), stock: p(1,0,0,0), forms: NONE, incidents: p(1,1,1,0), users: NONE },
  carer: { dashboard: p(1,0,0,0), residents: p(1,0,1,0), rooms: p(1,0,0,0), roster: p(1,0,0,0), meals: p(1,0,0,0), activities: p(1,0,0,0), family: p(1,0,0,0), stock: NONE, forms: NONE, incidents: p(1,1,0,0), users: NONE },
  activities: { dashboard: p(1,0,0,0), residents: p(1,0,0,0), rooms: NONE, roster: p(1,0,0,0), meals: p(1,0,0,0), activities: ALL, family: p(1,1,0,0), stock: p(1,0,0,0), forms: NONE, incidents: p(1,0,0,0), users: NONE },
  family: { dashboard: NONE, residents: p(1,0,0,0), rooms: NONE, roster: NONE, meals: p(1,0,0,0), activities: p(1,0,0,0), family: p(1,1,0,0), stock: NONE, forms: NONE, incidents: NONE, users: NONE },
  stock_manager: { dashboard: p(1,0,0,0), residents: NONE, rooms: NONE, roster: NONE, meals: NONE, activities: NONE, family: NONE, stock: ALL, forms: NONE, incidents: NONE, users: NONE },
};

export const ROLE_KEYS: UserRole[] = ["super_admin", "admin", "nurse", "carer", "activities", "family", "stock_manager"];

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
