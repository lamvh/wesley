"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getDefaultPermissions } from "@/lib/mock-data";
import { createUser, updateUser, deleteUser, recoverUser } from "@/lib/actions/users";
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

const EMPTY_FORM: AddUserForm = { name: "", username: "", email: "", password: "", role: "carer", scope: "", building: "wesley" };

export function UsersView({
  initialUsers,
  removedUsers,
  roles,
  buildings,
}: {
  initialUsers: User[];
  removedUsers: User[];
  roles: { id: UserRole; label: string; isSystem: boolean }[];
  buildings: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const users = initialUsers;
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
  const [showRemoved, setShowRemoved] = useState(false);

  function recover(username: string) {
    startTransition(async () => {
      await recoverUser(username);
      router.refresh();
    });
  }

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
      building: user.buildingId,
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
      setFormError(null);
      const fd = new FormData();
      fd.set("originalUsername", editingUsername);
      fd.set("name", name);
      fd.set("username", form.username);
      fd.set("email", form.email);
      fd.set("password", form.password);
      fd.set("role", form.role);
      fd.set("scope", form.scope);
      fd.set("building", form.building);
      startTransition(async () => {
        const res = await updateUser({}, fd);
        if (res.error) {
          setFormError(res.error);
          return;
        }
        closeModal();
        router.refresh();
      });
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
    fd.set("building", form.building);

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
    const username = confirmUser.username;
    startTransition(async () => {
      await deleteUser(username);
      setConfirmUser(null);
      router.refresh();
    });
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
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <RoleFilterPills users={users} roles={roles} active={roleFilter} onSelect={setRoleFilter} />
            <button
              type="button"
              onClick={() => setShowRemoved((v) => !v)}
              className="text-[13px] font-semibold text-ink-muted underline"
            >
              {showRemoved ? "Xem đang hoạt động" : `Đã xoá (${removedUsers.length})`}
            </button>
          </div>
          {showRemoved ? (
            <div className="mt-4 flex flex-col gap-2">
              {removedUsers.length === 0 ? (
                <div className="rounded-[16px] border border-dashed border-line-strong bg-cream-2 px-6 py-[40px] text-center text-[14px] text-ink-muted">
                  Không có tài khoản nào đã xoá.
                </div>
              ) : (
                removedUsers.map((u) => (
                  <div
                    key={u.username}
                    className="flex items-center justify-between rounded-[11px] border border-line-soft bg-cream-2 px-[16px] py-[12px]"
                  >
                    <div>
                      <div className="text-[14px] font-semibold text-ink">{u.name}</div>
                      <div className="text-[12.5px] text-ink-faint">@{u.username}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => recover(u.username)}
                      className="cursor-pointer rounded-[9px] border border-line-soft bg-cream px-[14px] py-[8px] text-[13px] font-semibold text-ink-nav"
                    >
                      Khôi phục
                    </button>
                  </div>
                ))
              )}
            </div>
          ) : (
            <UserTable users={filteredUsers} roles={roles} onEdit={openEdit} onDelete={setConfirmUser} />
          )}
        </>
      ) : (
        <RolesPermissions
          users={users}
          roles={roles}
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
          roles={roles}
          buildings={buildings}
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
