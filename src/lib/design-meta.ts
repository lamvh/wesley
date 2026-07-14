// Maps domain values -> Tailwind token classes (text + tint bg).
// Screens/components read these; they never hardcode hex. See docs/01-design-system.md.

import type {
  ActivityCategory,
  CareTier,
  IntakeLevel,
  RoomStatus,
  Severity,
  UserRole,
  UserStatus,
  Wing,
} from "@/types/domain";

export interface Swatch {
  /** badge/pill classes: tint background + text color */
  badge: string;
  /** solid text color class */
  text: string;
  /** small status dot background class */
  dot: string;
}

const swatch = (text: string, tint: string, dot: string): Swatch => ({
  badge: `${tint} ${text}`,
  text,
  dot,
});

export const careTierMeta: Record<CareTier, Swatch> = {
  Normal: swatch("text-sage", "bg-sage-tint", "bg-sage"),
  Premium: swatch("text-navy", "bg-navy-tint", "bg-navy"),
  VIP: swatch("text-gold-text", "bg-gold-tint", "bg-gold-text"),
};

export const roomStatusMeta: Record<RoomStatus, Swatch> = {
  Occupied: swatch("text-sage", "bg-sage-tint", "bg-sage"),
  Respite: swatch("text-gold-text", "bg-gold-tint", "bg-gold-text"),
  Available: swatch("text-status-available", "bg-navy-tint", "bg-status-available"),
  Maintenance: swatch("text-rust", "bg-rust-tint", "bg-rust"),
};

export const severityMeta: Record<Severity, Swatch> = {
  Low: swatch("text-sage", "bg-sage-tint", "bg-sage"),
  Moderate: swatch("text-amber", "bg-amber-tint", "bg-amber"),
  High: swatch("text-high", "bg-high-tint", "bg-high"),
};

export const activityCatMeta: Record<ActivityCategory, Swatch> = {
  garden: swatch("text-sage", "bg-sage-tint", "bg-sage"),
  music: swatch("text-cat-music", "bg-cat-music-tint", "bg-cat-music"),
  move: swatch("text-cat-move", "bg-cat-move-tint", "bg-cat-move"),
  social: swatch("text-rust", "bg-rust-tint", "bg-rust"),
  craft: swatch("text-cat-craft", "bg-cat-craft-tint", "bg-cat-craft"),
  care: swatch("text-navy", "bg-navy-tint", "bg-navy"),
  faith: swatch("text-gold-text", "bg-gold-tint", "bg-gold-text"),
};

/** Wing -> care tier (Rātā=Normal, Kōwhai=Premium, Tōtara=VIP). */
export const wingTier: Record<Wing, CareTier> = {
  Rātā: "Normal",
  Kōwhai: "Premium",
  Tōtara: "VIP",
};

export function careTier(wing: Wing): CareTier {
  return wingTier[wing];
}

export type StockLevel = "In stock" | "Low" | "Reorder";

export interface StockMeta {
  status: StockLevel;
  pct: number;
  swatch: Swatch;
}

/** Stock level from qty/par ratio (>=1 In stock, >=0.5 Low, <0.5 Reorder). */
export function stockLevel(qty: number, par: number): StockMeta {
  const ratio = par > 0 ? qty / par : 1;
  const pct = Math.min(100, Math.round(ratio * 100));
  if (ratio < 0.5) return { status: "Reorder", pct, swatch: swatch("text-terracotta", "bg-terracotta-tint", "bg-terracotta") };
  if (ratio < 1) return { status: "Low", pct, swatch: swatch("text-amber", "bg-amber-tint", "bg-amber") };
  return { status: "In stock", pct, swatch: swatch("text-sage", "bg-sage-tint", "bg-sage") };
}

/** KPI value color tone -> text class. */
export const valueToneClass: Record<NonNullable<import("@/types/domain").Kpi["valueTone"]>, string> = {
  ink: "text-ink",
  amber: "text-amber",
  terracotta: "text-terracotta",
  navy: "text-navy",
  gold: "text-gold-text",
  available: "text-status-available",
  rust: "text-rust",
};

/** KPI delta tone -> text class. */
export const deltaToneClass = {
  accent: "text-navy",
  warn: "text-terracotta",
} as const;

/** Dashboard alert tone -> {text, tint, dot}. */
export const alertToneMeta = {
  warn: swatch("text-terracotta", "bg-terracotta-tint", "bg-terracotta"),
  amber: swatch("text-amber", "bg-amber-tint", "bg-amber"),
  accent: swatch("text-navy", "bg-sage-tint", "bg-navy"),
} as const;

/** Occupancy bar tone -> fill bg class. */
export const occupancyToneClass = {
  sage: "bg-sage",
  navy: "bg-navy",
  gold: "bg-gold-text",
} as const;

/** User role -> badge/text/dot classes + human label. */
export const userRoleMeta: Record<UserRole, Swatch & { label: string; desc: string }> = {
  super_admin: {
    ...swatch("text-navy", "bg-navy-tint", "bg-navy"),
    label: "Super Admin",
    desc: "Full system control — users, roles and every module.",
  },
  admin: {
    ...swatch("text-rust", "bg-rust-tint", "bg-rust"),
    label: "Admin",
    desc: "Facility manager — runs the home day to day.",
  },
  nurse: {
    ...swatch("text-cat-craft", "bg-cat-craft-tint", "bg-cat-craft"),
    label: "Registered Nurse",
    desc: "Clinical care, residents, incidents and medications.",
  },
  carer: {
    ...swatch("text-sage", "bg-sage-tint", "bg-sage"),
    label: "Carer",
    desc: "Daily hands-on care and resident notes.",
  },
  activities: {
    ...swatch("text-gold-text", "bg-gold-tint", "bg-gold-text"),
    label: "Activities",
    desc: "Programme, outings and family highlights.",
  },
  family: {
    ...swatch("text-cat-music", "bg-cat-music-tint", "bg-cat-music"),
    label: "Family / Whānau",
    desc: "Read-only portal access for a resident's whānau.",
  },
};

/** User status -> text + dot classes. */
export const userStatusMeta: Record<UserStatus, { text: string; dot: string }> = {
  Active: { text: "text-sage", dot: "bg-sage" },
  Invited: { text: "text-gold-text", dot: "bg-bronze" },
  Suspended: { text: "text-rust", dot: "bg-terracotta" },
};

/** Meal intake level -> badge classes + label. */
export const intakeMeta: Record<IntakeLevel, Swatch & { label: string }> = {
  all: { ...swatch("text-sage", "bg-sage-tint", "bg-sage"), label: "All" },
  most: { ...swatch("text-cat-craft", "bg-cat-craft-tint", "bg-cat-craft"), label: "Most" },
  some: { ...swatch("text-gold-text", "bg-gold-tint", "bg-gold-text"), label: "Some" },
  refused: { ...swatch("text-rust", "bg-rust-tint", "bg-rust"), label: "Refused" },
};

export const INTAKE_LEVELS: IntakeLevel[] = ["all", "most", "some", "refused"];

/** Staff contract type -> pill classes (Full-time navy, Part-time gold, Casual muted). */
export const staffContractMeta: Record<string, Swatch> = {
  "Full-time": swatch("text-navy", "bg-navy-tint", "bg-navy"),
  "Part-time": swatch("text-gold-text", "bg-gold-tint", "bg-gold-text"),
  Casual: swatch("text-ink-muted", "bg-muted", "bg-ink-muted"),
};

/** Staff status -> text + dot classes (Active sage, On leave amber). */
export const staffStatusMeta: Record<string, { text: string; dot: string }> = {
  Active: { text: "text-sage", dot: "bg-sage" },
  "On leave": { text: "text-amber", dot: "bg-amber" },
};

/** Leave-request status -> pill classes (Pending amber, Approved navy, Declined rust). */
export const leaveStatusMeta: Record<string, Swatch> = {
  Pending: swatch("text-amber", "bg-amber-tint", "bg-amber"),
  Approved: swatch("text-navy", "bg-navy-tint", "bg-navy"),
  Declined: swatch("text-rust", "bg-rust-tint", "bg-rust"),
};
