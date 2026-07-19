"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getDefaultPermissions } from "@/lib/mock-data";
import { createUser } from "@/lib/actions/users";
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

const EMPTY_FORM: AddUserForm = { name: "", username: "", email: "", password: "", role: "carer", scope: "" };

export function UsersView({ initialUsers }: { initialUsers: User[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [tab, setTab] = useState<Tab>("users");
  const [roleFilter, setRoleFilter] = useState<Filter>("all");
  const [selectedRole, setSelectedRole] = useState<UserRole>("admin");
  const [perms, setPerms] = useState(getDefaultPermissions);
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [form, setForm] = useState<AddUserForm>(EMPTY_FORM);
  // Identity of the user being edited (null = adding). Username is required
  // and unique (unlike email, which can be blank), so it survives role-filter
  // reordering unlike an index would.
  const [editingUsername, setEditingUsername] = useState<string | null>(null);
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
    setEditingUsername(null);
    setAddUserOpen(true);
  }

  function openEdit(user: User) {
    setForm({
      name: user.name,
      username: user.username,
      email: user.email,
      password: "",
      role: user.role,
      scope: user.scope === "-" ? "" : user.scope,
    });
    setEditingUsername(user.username);
    setAddUserOpen(true);
  }

  function closeModal() {
    setAddUserOpen(false);
    setEditingUsername(null);
    setForm(EMPTY_FORM);
    setFormError(null);
  }

  function submitUser() {
    const name = form.name.trim();
    if (!name) return;

    if (editingUsername) {
      // Edit stays local for now (persisting edits is out of scope here).
      const parts = name.split(/\s+/);
      const initials = (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
      const scope = form.scope.trim() || "-";
      setUsers((prev) =>
        prev.map((u) =>
          u.username === editingUsername
            ? { ...u, name, email: form.email.trim(), role: form.role, scope, initials }
            : u,
        ),
      );
      closeModal();
      return;
    }

    setFormError(null);
    const fd = new FormData();
    fd.set("name", name);
    fd.set("username", form.username);
    fd.set("email", form.email);
    fd.set("password", form.password);
    fd.set("role", form.role);
    fd.set("scope", form.scope);

    startTransition(async () => {
      const res = await createUser({}, fd);
      if (res.error) {
        setFormError(res.error);
        return;
      }
      closeModal();
      router.refresh(); // re-fetch the live list so the new account appears
    });
  }

  function doDelete() {
    if (!confirmUser) return;
    setUsers((prev) => prev.filter((u) => u.username !== confirmUser.username));
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
          editing={editingUsername !== null}
          error={formError}
          submitting={isPending}
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
