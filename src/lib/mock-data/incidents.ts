import type { Incident, Kpi } from "@/types/domain";

const incidents: Incident[] = [
  { id: "INC-0432", date: "8 Jul", resident: "Henry Fitzgerald", type: "Fall - no injury", severity: "Moderate", status: "Under review", reportedBy: "A. Ngata (RN)" },
  { id: "INC-0431", date: "7 Jul", resident: "Dorothy Nguyen", type: "Medication near-miss", severity: "Low", status: "Resolved", reportedBy: "D. Cho (RN)" },
  { id: "INC-0430", date: "6 Jul", resident: "Robert McKenzie", type: "Behavioural episode", severity: "Moderate", status: "Actioned", reportedBy: "S. Latu" },
  { id: "INC-0429", date: "5 Jul", resident: "Joan Ferris", type: "Skin tear", severity: "Low", status: "Resolved", reportedBy: "M. Solomon" },
  { id: "INC-0428", date: "3 Jul", resident: "Ngaire Thompson", type: "Fall - minor bruise", severity: "Moderate", status: "Resolved", reportedBy: "R. Boyd (RN)" },
  { id: "INC-0427", date: "1 Jul", resident: "William Toop", type: "Choking - cleared", severity: "High", status: "Actioned", reportedBy: "A. Ngata (RN)" },
];

export function getIncidents(): Incident[] {
  return incidents;
}

export function getComplianceKpis(): Kpi[] {
  return [
    { label: "Open incidents", value: "3", sub: "None high severity", valueTone: "amber" },
    { label: "This month", value: "11", sub: "↓ 3 vs June", valueTone: "ink" },
    { label: "Falls (30 days)", value: "4", sub: "Prevention review due", valueTone: "terracotta" },
    { label: "Audit readiness", value: "96%", sub: "Next audit 14 Sep", valueTone: "navy" },
  ];
}
