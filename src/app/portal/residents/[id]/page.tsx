import { notFound } from "next/navigation";
import { BackLink } from "@/components/portal/back-link";
import { ResidentProfileHeader } from "@/components/portal/residents/resident-profile-header";
import { getResidentBySlug } from "@/lib/mock-data";

// Full profile of a single resident. Reached from the resident directory.
export default async function ResidentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const resident = getResidentBySlug(id);
  if (!resident) notFound();

  return (
    <div className="mx-auto max-w-[1180px]">
      <BackLink href="/portal/residents" label="All residents" />
      <ResidentProfileHeader resident={resident} />
    </div>
  );
}
