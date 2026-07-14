import Link from "next/link";
import { notFound } from "next/navigation";
import { BackLink } from "@/components/portal/back-link";
import { ResidentProfileHeader } from "@/components/portal/residents/resident-profile-header";
import { getResidentBySlug } from "@/lib/data/residents";

// Full profile of a single resident. Reached from the resident directory.
export default async function ResidentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const resident = await getResidentBySlug(id);
  if (!resident) notFound();

  return (
    <div className="mx-auto max-w-[1180px]">
      <div className="flex items-center justify-between gap-4">
        <BackLink href="/portal/residents" label="All residents" />
        <Link
          href={`/portal/residents/${resident.slug}/edit`}
          className="rounded-[10px] border border-line-strong px-[14px] py-[8px] text-[13.5px] font-semibold text-navy hover:bg-cream-2"
        >
          Edit
        </Link>
      </div>
      <ResidentProfileHeader resident={resident} />
    </div>
  );
}
