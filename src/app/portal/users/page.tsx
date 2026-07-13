import { UsersView } from "@/components/portal/users/users-view";

// Super-admin users & access management. All interactivity lives in the
// client island UsersView; this screen just mounts it.
export default function UsersPage() {
  return <UsersView />;
}
