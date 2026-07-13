import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

// Run only where auth matters: the portal (guarded) and the login screen
// (bounce signed-in users). Marketing pages stay untouched.
export const config = {
  matcher: ["/portal/:path*", "/login"],
};
