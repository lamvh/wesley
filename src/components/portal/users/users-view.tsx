"use client";

import { useState } from "react";
import { getDefaultPermissions, getUsers } from "@/lib/mock-data";
import type {
  ModuleKey,
  PermissionAction,
  UserRole,
} from "@/types/domain";
import { cn } from "@/lib/utils";
import { RoleFilterPills } from "./role-filter-pills";
import { UserTable } from "./user-table";
import { RolesPermissions } from "./roles-permissions";
import { AddUserModal, type AddUserForm } from "./add-user-modal";

type Tab = "users" | "roles";
type Filter = UserRole | "all";

const users = getUsers();

const EMPTY_FORM: AddUserForm = { name: "", email: "", role: "carer", scope: "" };

export function UsersView() {
  const [tab, setTab] = useState<Tab>("users");
  const [roleFilter, setRoleFilter] = useState<Filter>("all");
  const [selectedRole, setSelectedRole] = useState<UserRole>("admin");
  const [perms, setPerms] = useState(getDefaultPermissions);
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [form, setForm] = useState<AddUserForm>(EMPTY_FORM);

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

  function closeModal() {
    setAddUserOpen(false);
    setForm(EMPTY_FORM);
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
          onClick={() => setAddUserOpen(true)}
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
          <UserTable users={filteredUsers} />
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
          onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
          onClose={closeModal}
          onSubmit={closeModal}
        />
      )}
    </div>
  );
}
