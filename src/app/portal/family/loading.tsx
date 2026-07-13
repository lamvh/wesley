import { PortalPageSkeleton } from "@/components/portal/skeletons/portal-skeletons";

export default function Loading() {
  return <PortalPageSkeleton variant="grid" cols={2} count={4} />;
}
