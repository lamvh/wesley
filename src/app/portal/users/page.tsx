import { UsersView } from "@/components/portal/users/users-view";
import { listAppUsers } from "@/lib/data/users";

// Super-admin users & access management. Loads the live account list, then
// mounts the client island for interactivity.
export default async function UsersPage() {
  const users = await listAppUsers();
  return <UsersView initialUsers={users} />;
}
