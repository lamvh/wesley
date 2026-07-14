import type { Metadata } from "next";
import { BackLink } from "@/components/portal/back-link";
import { PortalPageHeader } from "@/components/shared/portal-page-header";
import { ResidentForm } from "@/components/portal/residents/resident-form";

export const metadata: Metadata = { title: "Admit a resident — Wesley" };

export default function NewResidentPage() {
  return (
    <div className="mx-auto max-w-[1180px]">
      <BackLink href="/portal/residents" label="All residents" />
      <PortalPageHeader
        title="Admit a resident"
        sub="Add a new resident to the directory"
      />
      <ResidentForm />
    </div>
  );
}
