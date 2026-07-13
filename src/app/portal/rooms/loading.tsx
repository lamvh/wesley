import { PortalPageSkeleton } from "@/components/portal/skeletons/portal-skeletons";

export default function Loading() {
  return <PortalPageSkeleton variant="grid" cols={3} count={9} />;
}
