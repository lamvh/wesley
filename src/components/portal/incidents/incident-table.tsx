import { cn } from "@/lib/utils";
import { severityMeta } from "@/lib/design-meta";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Incident, IncidentStatus } from "@/types/domain";

// Status text colour is a small presentation map kept out of JSX: resolved /
// actioned read as navy, in-review as amber, new as terracotta.
const statusColor: Record<IncidentStatus, string> = {
  "Under review": "text-amber",
  Resolved: "text-navy",
  Actioned: "text-navy",
  New: "text-terracotta",
};

// Shared 5-column template so the header and every row line up.
const cols = "grid grid-cols-[100px_1.4fr_1fr_110px_130px] items-center gap-[14px]";

const headers = ["Ref", "Resident & type", "Reported by", "Severity", "Status"];

export function IncidentTable({ incidents }: { incidents: Incident[] }) {
  return (
    <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-cream-2">
      <Table className="block w-full min-w-[720px]">
        <TableHeader className="block">
          <TableRow
            className={cn(cols, "border-b border-line px-[22px] py-[13px] hover:bg-transparent")}
          >
            {headers.map((h) => (
              <TableHead
                key={h}
                className="h-auto p-0 text-[12px] font-bold uppercase tracking-[0.4px] text-ink-faint"
              >
                {h}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody className="block">
          {incidents.map((incident) => (
            <TableRow
              key={incident.id}
              className={cn(
                cols,
                "border-b border-line-divider px-[22px] py-[15px] hover:bg-transparent",
              )}
            >
              <TableCell className="p-0 font-serif text-[13px] font-semibold text-ink-faint">
                {incident.id}
              </TableCell>
              <TableCell className="whitespace-normal p-0">
                <div className="text-[14.5px] font-semibold text-ink">{incident.resident}</div>
                <div className="text-[12.5px] text-ink-meta">
                  {incident.type} · {incident.date}
                </div>
              </TableCell>
              <TableCell className="whitespace-normal p-0 text-[13.5px] text-ink-muted">
                {incident.reportedBy}
              </TableCell>
              <TableCell className="p-0">
                <span
                  className={cn(
                    "rounded-full px-[11px] py-[5px] text-[12px] font-semibold",
                    severityMeta[incident.severity].badge,
                  )}
                >
                  {incident.severity}
                </span>
              </TableCell>
              <TableCell
                className={cn("p-0 text-[13px] font-semibold", statusColor[incident.status])}
              >
                {incident.status}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
