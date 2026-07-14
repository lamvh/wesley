"use client";

import { useState } from "react";
import { getDefaultPermissions, getUsers } from "@/lib/mock-data";
import type {
  ModuleKey,
  PermissionAction,
  User,
  UserRole,
} from "@/types/domain";
import { cn } from "@/lib/utils";
import { RoleFilterPills } from "./role-filter-pills";
import { UserTable } from "./user-table";
import { RolesPermissions } from "./roles-permissions";
import { AddUserModal, type AddUserForm } from "./add-user-modal";
import { ConfirmDeleteModal } from "@/components/portal/stock/confirm-delete-modal";

type Tab = "users" | "roles";
type Filter = UserRole | "all";

const EMPTY_FORM: AddUserForm = { name: "", email: "", role: "carer", scope: "" };

// Avatar accent for newly-added users (data-colour, cycles by list length).
const AVATAR_PALETTE = [
  "#6E875E", "#BE7350", "#8a6ba3", "#5b8f9a", "#c08a3e",
  "#9a7b4f", "#7e9b6a", "#b06a5a", "#6e879e",
];

export function UsersView() {
  const [users, setUsers] = useState<User[]>(getUsers);
  const [tab, setTab] = useState<Tab>("users");
  const [roleFilter, setRoleFilter] = useState<Filter>("all");
  const [selectedRole, setSelectedRole] = useState<UserRole>("admin");
  const [perms, setPerms] = useState(getDefaultPermissions);
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [form, setForm] = useState<AddUserForm>(EMPTY_FORM);
  // Identity of the user being edited (null = adding). Email is unique, so it
  // survives role-filter reordering unlike an index would.
  const [editingEmail, setEditingEmail] = useState<string | null>(null);
  const [confirmUser, setConfirmUser] = useState<User | null>(null);

  function togglePerm(role: UserRole, module: ModuleKey, action: PermissionAction) {
    if (role === "super_admin") return;
    setPerms((prev) => {
      const next = structuredClone(prev);
      next[role][module][action] = !next[role][module][action];
      return next;
    });
  }

  const filteredUsers =
    roleFilter === "all" ? users : users.filter((u) => u.role === roleFilter);

  function openAdd() {
    setForm(EMPTY_FORM);
    setEditingEmail(null);
    setAddUserOpen(true);
  }

  function openEdit(user: User) {
    setForm({
      name: user.name,
      email: user.email,
      role: user.role,
      scope: user.scope === "—" ? "" : user.scope,
    });
    setEditingEmail(user.email);
    setAddUserOpen(true);
  }

  function closeModal() {
    setAddUserOpen(false);
    setEditingEmail(null);
    setForm(EMPTY_FORM);
  }

  function submitUser() {
    const name = form.name.trim();
    if (!name) return;
    const parts = name.split(/\s+/);
    const initials = (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
    const email = form.email.trim() || `${parts.join(".").toLowerCase()}@wesley.nz`;
    const scope = form.scope.trim() || "—";

    if (editingEmail) {
      setUsers((prev) =>
        prev.map((u) =>
          u.email === editingEmail
            ? { ...u, name, email, role: form.role, scope, initials }
            : u,
        ),
      );
    } else {
      const newUser: User = {
        name,
        email,
        role: form.role,
        scope,
        status: "Invited",
        last: "Just now",
        initials,
        color: AVATAR_PALETTE[users.length % AVATAR_PALETTE.length],
      };
      setUsers((prev) => [newUser, ...prev]);
      setRoleFilter("all");
    }
    closeModal();
  }

  function doDelete() {
    if (!confirmUser) return;
    setUsers((prev) => prev.filter((u) => u.email !== confirmUser.email));
    setConfirmUser(null);
  }

  const tabClass = (active: boolean) =>
    cn(
      "rounded-full px-[18px] py-[9px] text-[14px] font-semibold transition-colors",
      active ? "bg-navy-deep text-cream" : "text-ink-muted",
    );

  return (
    <div className="mx-auto max-w-[1180px]">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <div className="text-[12px] font-bold uppercase tracking-[1.6px] text-bronze-text">
            Super admin
          </div>
          <h1 className="mt-[6px] font-serif text-[34px] font-medium tracking-[-0.3px]">
            Users &amp; access
          </h1>
          <p className="mt-[6px] text-[15.5px] text-ink-muted">
            Add people, set their role, and control exactly what each role can see
            and do.
          </p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="flex items-center gap-2 rounded-[11px] bg-navy px-[18px] py-3 text-[14px] font-semibold text-cream"
        >
          <span className="text-[18px] leading-none">+</span>Add user
        </button>
      </div>

      <div className="mt-[22px] inline-flex gap-1 rounded-full border border-line-soft bg-cream-3 p-1">
        <button type="button" onClick={() => setTab("users")} className={tabClass(tab === "users")}>
          Users · {users.length}
        </button>
        <button type="button" onClick={() => setTab("roles")} className={tabClass(tab === "roles")}>
          Roles &amp; permissions
        </button>
      </div>

      {tab === "users" ? (
        <>
          <RoleFilterPills users={users} active={roleFilter} onSelect={setRoleFilter} />
          <UserTable users={filteredUsers} onEdit={openEdit} onDelete={setConfirmUser} />
        </>
      ) : (
        <RolesPermissions
          users={users}
          perms={perms}
          selectedRole={selectedRole}
          onSelectRole={setSelectedRole}
          togglePerm={togglePerm}
        />
      )}

      {addUserOpen && (
        <AddUserModal
          form={form}
          editing={editingEmail !== null}
          onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
          onClose={closeModal}
          onSubmit={submitUser}
        />
      )}

      <ConfirmDeleteModal
        open={confirmUser !== null}
        label={confirmUser?.name ?? ""}
        body="This removes them from the list. You can add them again at any time."
        onCancel={() => setConfirmUser(null)}
        onConfirm={doDelete}
      />
    </div>
  );
}
