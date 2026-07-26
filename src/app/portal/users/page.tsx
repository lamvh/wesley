import { UsersView } from "@/components/portal/users/users-view";
import { listAppUsers, listRemovedAppUsers } from "@/lib/data/users";
import { listUserRoles } from "@/lib/data/user-roles";
import { listBuildings } from "@/lib/data/buildings";
import { getPermissionMatrix } from "@/lib/data/role-permissions";

// Super-admin users & access management. Loads the live account list, then
// mounts the client island for interactivity.
export default async function UsersPage() {
  const [users, removed, roles, buildings, perms] = await Promise.all([
    listAppUsers(),
    listRemovedAppUsers(),
    listUserRoles(),
    listBuildings(),
    getPermissionMatrix(),
  ]);
  return (
    <UsersView
      initialUsers={users}
      removedUsers={removed}
      roles={roles}
      buildings={buildings}
      initialPerms={perms}
    />
  );
}
