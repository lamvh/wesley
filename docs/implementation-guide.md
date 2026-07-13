# Implementation Guide — Next.js Web App (Auth + DB via Supabase)

> Document build source từ đầu. Stack: **Next.js 16 (App Router + RSC)** · **TypeScript** · **Tailwind CSS v4** · **shadcn/ui** · **Supabase (Postgres + Auth)**.
> Design UI sẽ được cung cấp sau (Claude design) → plug vào phần `Component Layer` / `app/(routes)`.

---

## 0. Prerequisites

| Tool | Version | Note |
|------|---------|------|
| Node.js | `>= 20.9` (LTS 24 khuyến nghị) | `node -v` |
| Package manager | `pnpm >= 9` | nhanh, disk-efficient. `npm i -g pnpm` |
| Supabase account | — | project + API keys |
| Supabase CLI | latest | migrations + local dev. `pnpm add -g supabase` |

Env cần chuẩn bị (lấy từ Supabase Dashboard → Project Settings → API):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only, KHÔNG expose client)

---

## 1. Scaffold Project

```bash
pnpm create next-app@latest wesley \
  --typescript --tailwind --app --src-dir --import-alias "@/*" --eslint
cd wesley
```

Flags: App Router (`--app`), `src/` dir, alias `@/*`, Tailwind v4 (mặc định bản mới), ESLint.

### Init shadcn/ui
```bash
pnpm dlx shadcn@latest init
```
- Base color: chờ design → tạm chọn `neutral`.
- CSS variables: **yes** (dễ theming theo design tokens sau).

Cài component khi cần (không cài trước tràn lan — YAGNI):
```bash
pnpm dlx shadcn@latest add button input card form label dropdown-menu avatar sonner
```

---

## 2. Dependencies

```bash
# Supabase
pnpm add @supabase/supabase-js @supabase/ssr

# Validation + forms (dùng khi có form design)
pnpm add zod react-hook-form @hookform/resolvers

# Utils (shadcn tự thêm 1 phần)
pnpm add clsx tailwind-merge

# Dev
pnpm add -D supabase
```

> Lưu ý: KHÔNG dùng gói `@supabase/auth-helpers-nextjs` (deprecated). Dùng `@supabase/ssr`.

---

## 3. Project Structure

```
wesley/
├── src/
│   ├── app/
│   │   ├── (auth)/                    # route group — không auth
│   │   │   ├── login/page.tsx
│   │   │   └── signup/page.tsx
│   │   ├── (protected)/               # route group — yêu cầu session
│   │   │   ├── layout.tsx             # guard: redirect nếu chưa login
│   │   │   └── dashboard/page.tsx
│   │   ├── auth/
│   │   │   ├── callback/route.ts      # OAuth / magic-link callback
│   │   │   └── confirm/route.ts       # email OTP confirm
│   │   ├── api/                       # route handlers (nếu cần REST)
│   │   ├── layout.tsx                 # root layout
│   │   ├── page.tsx                   # landing
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                        # shadcn/ui (generated)
│   │   └── <feature>/                 # component theo feature (design plug vào đây)
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts              # browser client
│   │   │   ├── server.ts              # server client (cookies)
│   │   │   └── middleware.ts          # session refresh helper
│   │   ├── utils.ts                   # cn() helper
│   │   └── validations/               # zod schemas
│   ├── hooks/                         # custom hooks (client)
│   ├── types/
│   │   └── database.types.ts          # generate từ Supabase
│   └── middleware.ts                  # refresh session mọi request
├── supabase/
│   ├── migrations/                    # SQL migrations
│   └── config.toml
├── .env.local
└── ...
```

Quy ước: file kebab-case, mô tả rõ nghĩa. Mỗi file code < 200 dòng — tách module khi vượt.

---

## 4. Supabase Integration Layer

### 4.1 Browser client — `src/lib/supabase/client.ts`
```ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

### 4.2 Server client — `src/lib/supabase/server.ts`
```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // gọi từ Server Component — bỏ qua, middleware sẽ refresh session
          }
        },
      },
    },
  );
}
```

### 4.3 Middleware session refresh — `src/lib/supabase/middleware.ts` + `src/middleware.ts`

`src/lib/supabase/middleware.ts`:
```ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // QUAN TRỌNG: getUser() để refresh token, không dùng getSession() cho auth check
  await supabase.auth.getUser();
  return response;
}
```

`src/middleware.ts`:
```ts
import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

---

## 5. Auth Flow

### 5.1 Server-side guard — `src/app/(protected)/layout.tsx`
```tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ProtectedLayout({
  children,
}: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return <>{children}</>;
}
```

### 5.2 Login — Server Action pattern
- Form ở `(auth)/login/page.tsx` (design plug vào).
- Action gọi `supabase.auth.signInWithPassword(...)` hoặc `signInWithOtp` / OAuth.
- Sau login: `revalidatePath("/", "layout")` + `redirect("/dashboard")`.

### 5.3 OAuth / magic-link callback — `src/app/auth/callback/route.ts`
```ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }
  return NextResponse.redirect(`${origin}/login?error=auth`);
}
```

Auth methods hỗ trợ (bật trong Supabase Dashboard → Authentication):
- Email + Password
- Magic link / OTP
- OAuth (Google, GitHub…) — set redirect URL = `<site>/auth/callback`

---

## 6. Database Layer

### 6.1 Migration workflow
```bash
supabase login
supabase link --project-ref <project-ref>
supabase migration new init_schema        # tạo file trong supabase/migrations/
# viết SQL vào file → apply:
supabase db push
```

### 6.2 Schema conventions
- Mọi bảng user-data bật **Row Level Security (RLS)** — bắt buộc.
- Naming migration: domain slug, KHÔNG dùng số phase. VD `000001_init_schema.sql`, `000002_profiles.sql`.
- Ví dụ policy:
```sql
alter table profiles enable row level security;

create policy "own profile read"
  on profiles for select
  using (auth.uid() = id);

create policy "own profile update"
  on profiles for update
  using (auth.uid() = id);
```

### 6.3 Type generation
```bash
supabase gen types typescript --linked > src/types/database.types.ts
```
Dùng type khi tạo client: `createBrowserClient<Database>(...)`.

---

## 7. Data Access Pattern (RSC-first)

- **Đọc dữ liệu**: trong Server Component, gọi `createClient()` (server) → query trực tiếp. Không cần API route cho read.
- **Ghi dữ liệu**: dùng **Server Actions** (`"use server"`) → validate bằng zod → mutate → `revalidatePath`.
- **Client interactivity**: chỉ đánh dấu `"use client"` ở component thật sự cần state/event. Giữ tree càng nhiều RSC càng tốt.
- API Route Handlers (`app/api/`) chỉ dùng khi cần webhook / third-party callback / public REST.

Ví dụ Server Action:
```ts
"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({ title: z.string().min(1).max(200) });

export async function createTodo(formData: FormData) {
  const parsed = schema.safeParse({ title: formData.get("title") });
  if (!parsed.success) return { error: "Invalid input" };

  const supabase = await createClient();
  const { error } = await supabase.from("todos").insert(parsed.data);
  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { ok: true };
}
```

---

## 8. Styling & Design Integration (chờ design)

Khi design về, map theo thứ tự:
1. **Design tokens** → CSS variables trong `globals.css` (`@theme` của Tailwind v4) + `tailwind` config theme.
2. **Color / typography / spacing** → cập nhật shadcn CSS variables (`--primary`, `--radius`…).
3. **Components** → build trong `src/components/<feature>/`, compose từ `components/ui/`.
4. **Layouts / pages** → `app/(routes)/.../page.tsx`.

Nguyên tắc: giữ semantic tokens (primitive → semantic → component), không hardcode màu vào JSX.

---

## 9. Environment Config

`.env.local` (KHÔNG commit):
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...        # server-only
```
Tạo `.env.example` (commit được) với key rỗng để onboard.

Thêm vào `.gitignore`: `.env*.local`.

---

## 10. Build Order (checklist triển khai)

- [ ] **P1 — Setup**: scaffold, shadcn init, deps, env, `.gitignore`
- [ ] **P2 — Supabase layer**: `client.ts`, `server.ts`, `middleware.ts`, `src/middleware.ts`
- [ ] **P3 — DB schema**: migration init + RLS + gen types
- [ ] **P4 — Auth**: login/signup pages, server actions, callback route, protected layout
- [ ] **P5 — Design integration**: tokens → components → pages (khi có design)
- [ ] **P6 — Feature modules**: theo yêu cầu nghiệp vụ
- [ ] **P7 — Testing**: unit (zod/actions), e2e auth flow (Playwright)
- [ ] **P8 — Deploy**: Vercel + env vars + Supabase redirect URLs

---

## 11. Verification Gates

Trước khi coi phase là xong:
- `pnpm build` không lỗi type/compile.
- `pnpm lint` sạch (không cần khắt khe format, nhưng không syntax error).
- Auth flow chạy thật: signup → confirm → login → protected route → logout.
- RLS test: user A không đọc/ghi được data user B.

---

## 12. Deployment (Vercel)

- Import repo → Vercel auto-detect Next.js.
- Set 3 env vars ở Vercel (Production + Preview).
- Supabase → Authentication → URL Config: thêm production domain vào **Redirect URLs** + **Site URL**.
- Fluid Compute (mặc định) chạy Node.js đầy đủ cho middleware/server actions.

---

## Open Questions

1. Auth methods cụ thể cần bật? (email/password, magic link, OAuth provider nào?)
2. Có cần multi-tenant / organization / RBAC không? → ảnh hưởng schema RLS.
3. Design system: dark mode? mobile-first? → ảnh hưởng token setup.
4. Có realtime (Supabase Realtime) hay storage (file upload) không?
5. Testing scope mong muốn (unit only vs full e2e)?
