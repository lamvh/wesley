import { notFound } from "next/navigation";
import { BackLink } from "@/components/portal/back-link";
import { PortalPageHeader } from "@/components/shared/portal-page-header";
import { ResidentForm } from "@/components/portal/residents/resident-form";
import { getResidentBySlug } from "@/lib/data/residents";
import { getRoomNumbers } from "@/lib/data/rooms";

export default async function EditResidentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [resident, rooms] = await Promise.all([getResidentBySlug(id), getRoomNumbers()]);
  if (!resident) notFound();

  return (
    <div className="mx-auto max-w-[1180px]">
      <BackLink href={`/portal/residents/${resident.slug}`} label={resident.name} />
      <PortalPageHeader
        title={`Edit ${resident.pref || resident.name}`}
        sub="Update this resident's details"
      />
      <ResidentForm resident={resident} rooms={rooms} />
    </div>
  );
}
