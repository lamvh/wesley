#!/usr/bin/env zsh
# Landing-page audit - content checksum + last-commit per marketing route,
# tracked against the baseline in docs/features/marketing/landing-audit-log.md.
#
# Usage:  ./scripts/landing-audit.sh
#
# Scope is MARKETING-ONLY on purpose. Each route's checksum covers the files
# that actually shape its rendered output: the page, the marketing components
# it renders, the marketing data (marketing-content.ts), the photo slot map
# (photos.ts), and the shared render helpers it touches (photo.tsx / icons.tsx
# / ui form primitives). It deliberately does NOT follow the @/lib/mock-data
# barrel - that re-exports every portal/roster fixture, whose changes must not
# masquerade as a landing-page change. Type-only + utility deps (domain.ts,
# utils.ts) are tracked in the "Shared deps" line below, not in the checksum.
#
# A changed `sum` on the next audit ⇒ that route's rendered output changed
# ⇒ re-check the page and append a line to the audit log.

set -e
cd "$(git rev-parse --show-toplevel)"

M="src/components/marketing"
S="src/components/shared"
P="src/app/(marketing)"
DATA="src/lib/mock-data/marketing-content.ts src/lib/mock-data/photos.ts"   # shared by every route

typeset -A ROUTES
ROUTES=(
  "Home|/"                "$P/page.tsx $M/home/hero.tsx $M/home/welcome-section.tsx $M/home/care-levels-section.tsx $M/home/family-teaser.tsx $M/home/testimonial.tsx $M/home/enquiry-cta.tsx $M/feature-grid.tsx $S/photo.tsx $S/icons.tsx $DATA"
  "Our rooms|/our-rooms"  "$P/our-rooms/page.tsx $M/room-style-row.tsx $S/marketing-page-header.tsx $S/photo.tsx $DATA"
  "Life here|/life-here"  "$P/life-here/page.tsx $M/feature-grid.tsx $M/day-timeline.tsx $M/photo-mosaic.tsx $S/marketing-page-header.tsx $S/photo.tsx $S/icons.tsx $DATA"
  "Our home|/our-home"    "$P/our-home/page.tsx $M/our-home/photo-copy-split.tsx $M/our-home/facility-card.tsx $M/our-home/wing-card.tsx $M/our-home/find-us-panel.tsx $S/marketing-page-header.tsx $S/photo.tsx $DATA"
  "Careers|/careers"      "$P/careers/page.tsx $M/careers/benefit-card.tsx $M/careers/role-row.tsx $S/marketing-page-header.tsx $DATA"
  "Contact|/contact"      "$P/contact/page.tsx $M/contact/contact-details.tsx $M/contact/request-visit-form.tsx $S/marketing-page-header.tsx $S/photo.tsx src/components/ui/button.tsx src/components/ui/input.tsx src/components/ui/select.tsx src/components/ui/textarea.tsx $DATA"
  "Header|(all)"          "$M/announcement-bar.tsx $M/site-nav.tsx $S/icons.tsx"
  "Footer|(all)"          "$M/site-footer.tsx"
  "Layout shell|(all)"    "$P/layout.tsx"
)
ORDER=("Home|/" "Our rooms|/our-rooms" "Life here|/life-here" "Our home|/our-home" "Careers|/careers" "Contact|/contact" "Header|(all)" "Footer|(all)" "Layout shell|(all)")

printf "%-16s %-14s %-14s %5s %6s  %s\n" "Screen" "Route" "Checksum" "Files" "Lines" "Last commit"
for key in "${ORDER[@]}"; do
  name="${key%%|*}"; route="${key##*|}"
  files=(${=ROUTES[$key]})
  sum=$(git hash-object "${files[@]}" | git hash-object --stdin | cut -c1-12)
  lines=$(cat "${files[@]}" | wc -l | tr -d ' ')
  last=$(git log -1 --format='%ad %h' --date=short -- "${files[@]}")
  printf "%-16s %-14s %-14s %5s %6s  %s\n" "$name" "$route" "$sum" "${#files}" "$lines" "$last"
done

echo
echo "Shared deps (watch - not in checksum): tracked by last-commit, re-check manually if changed"
for f in src/types/domain.ts src/lib/utils.ts; do
  printf "  %-24s %s\n" "${f#src/}" "$(git log -1 --format='%ad %h' --date=short -- "$f")"
done

# ---------------------------------------------------------------------------
# Design source drift - the code above is ported FROM the Claude Design HTML in
# .design-src/. Code checksums only detect code-vs-code change; this section
# surfaces the design side so design→code drift (design edited, code not yet
# updated) is visible. A changed design checksum vs the log baseline ⇒ re-diff
# the affected screens and either port the change or record why not.
echo
echo "Design source (.design-src) - port-from origin; newest '.dc.html' is authoritative"
newest=""; newest_mt=""
for f in .design-src/*.html; do
  sum=$(git hash-object "$f" | cut -c1-12)
  mt=$(stat -f '%Sm' -t '%Y-%m-%d %H:%M' "$f")
  printf "  %-44s %s  %s\n" "${f#.design-src/}" "$sum" "$mt"
  [[ "$mt" > "$newest_mt" ]] && { newest_mt="$mt"; newest="${f#.design-src/}"; }
done
echo "  → authoritative (newest): $newest ($newest_mt)"
