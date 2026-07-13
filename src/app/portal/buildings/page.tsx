import { BuildingsView } from "@/components/portal/buildings/buildings-view";

// Admin multi-site management. All interactivity (active-building selection)
// lives in the client island BuildingsView; this screen just mounts it.
export default function BuildingsPage() {
  return <BuildingsView />;
}
