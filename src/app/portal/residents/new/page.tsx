import type { Metadata } from "next";
import { BackLink } from "@/components/portal/back-link";
import { PortalPageHeader } from "@/components/shared/portal-page-header";
import { ResidentForm } from "@/components/portal/residents/resident-form";
import { getRoomNumbersByBuilding } from "@/lib/data/rooms";
import { listBuildings } from "@/lib/data/buildings";

export const metadata: Metadata = { title: "Admit a resident - Wesley" };

export default async function NewResidentPage() {
  const [rooms, buildings] = await Promise.all([getRoomNumbersByBuilding(), listBuildings()]);
  const homes = [...buildings].sort((a, b) => (a.id === "wesley" ? -1 : b.id === "wesley" ? 1 : 0));
  return (
    <div className="mx-auto max-w-[1180px]">
      <BackLink href="/portal/residents" label="All residents" />
      <PortalPageHeader
        title="Admit a resident"
        sub="Add a new resident to the directory"
      />
      <ResidentForm rooms={rooms} buildings={homes} />
    </div>
  );
}
