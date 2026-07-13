import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const COMBINING = /[̀-ͯ]/g;
const QUOTES = /["'“”’.]/g;

/** name -> url slug, e.g. "Margaret Whitcombe" -> "margaret-whitcombe" */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(COMBINING, "")
    .toLowerCase()
    .replace(QUOTES, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** initials from a display name, max 2 letters */
export function initials(name: string): string {
  const parts = name.replace(/["'“”]/g, "").trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase();
}
