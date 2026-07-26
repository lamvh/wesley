import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { ALWAYS_VISIBLE } from "@/lib/portal-nav";

type MiddlewareClient = ReturnType<typeof createServerClient>;

/** True when this request targets a screen an admin switched off in Settings.
 *
 * Enforced here rather than per page so sub-routes are covered too: hiding
 * "Residents" has to close /portal/residents/ada-lovelace as well, and a
 * guard added page by page is a guard someone forgets on the next screen.
 *
 * Fails OPEN - a read error lets the request through. This is a tidiness
 * switch, not an access control, and a hiccup in it must not lock staff out
 * of screens they need.
 */
async function isHiddenScreen(supabase: MiddlewareClient, pathname: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("screen_visibility")
    .select("href")
    .eq("hidden", true);
  if (error || !data) return false;

  return data.some(({ href }: { href: string }) => {
    if (ALWAYS_VISIBLE.includes(href)) return false;
    return pathname === href || pathname.startsWith(`${href}/`);
  });
}

// Refreshes the auth session on every matched request and enforces access:
// unauthenticated users are pushed to /login (remembering where they were
// headed via ?next=), and signed-in users are bounced off /login.
//
// The response object returned here MUST be the one whose cookies Supabase
// wrote to - creating a fresh NextResponse without copying those cookies would
// silently log users out. Redirects below copy the refreshed cookies across.
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const { pathname } = request.nextUrl;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Misconfigured env must not take the whole site down - let the request
  // through rather than throwing a middleware invocation error.
  if (!supabaseUrl || !supabaseKey) {
    return supabaseResponse;
  }

  let user = null;
  let supabase: MiddlewareClient | null = null;
  try {
    supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    });

    // Do not run code between createServerClient and getUser() - it keeps the
    // session fresh and avoids hard-to-debug logout bugs.
    const result = await supabase.auth.getUser();
    user = result.data.user;
  } catch {
    // A network hiccup or auth error must never become a 500. Fail closed on
    // the portal (send to login), open everywhere else (let the page render).
    if (pathname.startsWith("/portal")) {
      return redirectWithSession("/login", request, supabaseResponse, pathname);
    }
    return supabaseResponse;
  }

  // Guard the portal.
  if (!user && pathname.startsWith("/portal")) {
    return redirectWithSession("/login", request, supabaseResponse, pathname);
  }

  // Signed-in users have no reason to see the login screen.
  if (user && pathname === "/login") {
    return redirectWithSession("/portal", request, supabaseResponse);
  }

  // Screens switched off in Settings are closed, not just unlinked - a
  // bookmark or a typed URL would otherwise walk straight past the hidden nav.
  if (user && supabase && pathname.startsWith("/portal") && (await isHiddenScreen(supabase, pathname))) {
    return redirectWithSession("/portal", request, supabaseResponse);
  }

  return supabaseResponse;
}

function redirectWithSession(
  to: string,
  request: NextRequest,
  supabaseResponse: NextResponse,
  next?: string,
) {
  const url = request.nextUrl.clone();
  url.pathname = to;
  url.search = "";
  if (next && next !== "/portal") {
    url.searchParams.set("next", next);
  }
  const redirect = NextResponse.redirect(url);
  supabaseResponse.cookies
    .getAll()
    .forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}
