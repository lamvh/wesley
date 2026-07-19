import type { JobRole } from "@/types/domain";

// Open roles for the Careers page. Unlike the rest of the marketing copy (now
// managed in the Website CMS — see lib/data/site-content.ts), job postings are
// managed on the Recruitment/Staff side, so they stay here for now.
const jobRoles: JobRole[] = [
  { title: "Registered Nurse", type: "Full-time · Kōwhai wing", desc: "Lead clinical care across a supportive, well-staffed wing." },
  { title: "Caregiver / Healthcare Assistant", type: "Full & part-time", desc: "Hands-on daily care - the heart of life at Wesley. Training provided." },
  { title: "Activities Coordinator", type: "Part-time", desc: "Plan and run our weekly programme, outings and celebrations." },
  { title: "Chef / Cook", type: "Full-time", desc: "Prepare fresh, seasonal meals our residents look forward to." },
];

export function getJobRoles(): JobRole[] {
  return jobRoles;
}
