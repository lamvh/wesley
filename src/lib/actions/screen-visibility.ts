"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/supabase/current-user";
import { requireSuperAdmin, type MutateUserState } from "@/lib/actions/users";
import { ALWAYS_VISIBLE, hideableScreens } from "@/lib/portal-nav";

// Switches one portal screen on or off for everyone (public.screen_visibility).
//
// Like role_permissions, the table is read-only for regular sessions - select
// policy for authenticated, no write policy - so the write goes through the
// service-role client, and the role check is the only thing in front of it.
//
// super_admin only, admins included in the refusal: this changes what every
// user of the site can reach, which is a wider blast radius than the account
// management requireAdmin() covers.
export async function setScreenHidden(href: string, hidden: boolean): Promise<MutateUserState> {
  const denied = await requireSuperAdmin();
  if (denied) return denied;

  // Only real nav entries, and never the dashboard or Settings itself: an
  // admin who hides the page holding the switch has no way to undo it.
  if (ALWAYS_VISIBLE.includes(href)) {
    return { error: "Không thể ẩn màn hình này." };
  }
  if (!hideableScreens().some((s) => s.href === href)) {
    return { error: "Màn hình không hợp lệ." };
  }

  const me = await getCurrentUser();
  const admin = createAdminClient();

  // Visible is the default, so it is stored as the absence of a row rather
  // than `hidden = false` - one representation, nothing to reconcile.
  const { error } = hidden
    ? await admin.from("screen_visibility").upsert(
        { href, hidden: true, updated_at: new Date().toISOString(), updated_by: me?.appUser?.id ?? null },
        { onConflict: "href" },
      )
    : await admin.from("screen_visibility").delete().eq("href", href);

  if (error) return { error: "Không lưu được, thử lại." };

  // The nav lives in the portal layout, so every portal route renders it.
  revalidatePath("/portal", "layout");
  return { ok: true };
}
