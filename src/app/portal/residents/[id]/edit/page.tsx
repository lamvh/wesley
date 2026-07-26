import { notFound } from "next/navigation";
import { BackLink } from "@/components/portal/back-link";
import { PortalPageHeader } from "@/components/shared/portal-page-header";
import { ResidentForm } from "@/components/portal/residents/resident-form";
import { getResidentBySlug } from "@/lib/data/residents";
import { getRoomNumbersByBuilding } from "@/lib/data/rooms";
import { listBuildings } from "@/lib/data/buildings";

export default async function EditResidentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const resident = await getResidentBySlug(id);
  if (!resident) notFound();
  // Keyed by home: the form shows this resident's own home read-only and lists
  // that home's rooms - Wesley's register has no 1B, so validating a Lodge
  // resident against Wesley would reject their real room.
  const [rooms, buildings] = await Promise.all([getRoomNumbersByBuilding(), listBuildings()]);

  return (
    <div className="mx-auto max-w-[1180px]">
      <BackLink href={`/portal/residents/${resident.slug}`} label={resident.name} />
      <PortalPageHeader
        title={`Edit ${resident.pref || resident.name}`}
        sub="Update this resident's details"
      />
      <ResidentForm resident={resident} rooms={rooms} buildings={buildings} />
    </div>
  );
}
