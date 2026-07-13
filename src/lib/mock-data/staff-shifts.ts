import type { LeaveRequest, Shift } from "@/types/domain";

const shifts: Shift[] = [
  {
    name: "Morning",
    time: "7:00am – 3:00pm",
    status: "Full",
    full: true,
    gap: null,
    staff: [
      { name: "Aroha Ngata", role: "RN", wing: "Rātā", initials: "AN", color: "#6E875E" },
      { name: "Mere Solomon", role: "Carer", wing: "Rātā", initials: "MS", color: "#b06a5a" },
      { name: "Tomasi Fifita", role: "Carer", wing: "Kōwhai", initials: "TF", color: "#5b8f9a" },
      { name: "Grace Lin", role: "Activities", wing: "All", initials: "GL", color: "#c08a3e" },
    ],
  },
  {
    name: "Afternoon",
    time: "3:00pm – 11:00pm",
    status: "Full",
    full: true,
    gap: null,
    staff: [
      { name: "David Cho", role: "RN", wing: "Kōwhai", initials: "DC", color: "#8a6ba3" },
      { name: "Ana Reti", role: "Carer", wing: "Rātā", initials: "AR", color: "#6e879e" },
      { name: "Sione Latu", role: "Carer", wing: "Tōtara", initials: "SL", color: "#9a7b4f" },
      { name: "Priya Nair", role: "Carer", wing: "Kōwhai", initials: "PN", color: "#7e9b6a" },
    ],
  },
  {
    name: "Night",
    time: "11:00pm – 7:00am",
    status: "1 open",
    full: false,
    gap: "Kōwhai · 1 carer needed",
    staff: [
      { name: "Rachel Boyd", role: "RN", wing: "All", initials: "RB", color: "#6E875E" },
      { name: "James Whaanga", role: "Carer", wing: "Rātā", initials: "JW", color: "#b06a5a" },
    ],
  },
];

const leaveRequests: LeaveRequest[] = [
  { name: "Mere Solomon", type: "Annual leave", dates: "18–25 Jul · 5 shifts", initials: "MS", color: "#b06a5a" },
  { name: "Tomasi Fifita", type: "Shift swap", dates: "Swap Sun PM → Ana Reti", initials: "TF", color: "#5b8f9a" },
  { name: "Priya Nair", type: "Sick leave", dates: "Today · afternoon covered", initials: "PN", color: "#7e9b6a" },
];

export function getShifts(): Shift[] {
  return shifts;
}

export function getRosterCoverage(): string {
  return "10 of 11 shifts covered · 1 open";
}

export function getLeaveRequests(): LeaveRequest[] {
  return leaveRequests;
}
