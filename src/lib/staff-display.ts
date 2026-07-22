// Display name for roster/duty/today surfaces: the staffer's preferred name when
// set, otherwise their legal name. Client-safe (types only, no server imports)
// so client components (roster-grid) can use it too.
export function staffDisplayName(s: { name: string; preferredName: string }): string {
  return s.preferredName || s.name;
}
