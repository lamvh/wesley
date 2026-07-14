-- Stock, providers, movements & purchase orders for the Stock & supplies screen.
-- On-hand lives in stock_levels.qty_now; movements mutate it atomically via RPC.

create table if not exists public.providers (
  id            text primary key,
  building_id   text references public.buildings(id),
  name          text not null,
  category      text not null,
  contact_email text,
  phone         text,
  lead_time     text,
  terms         text,
  preferred     boolean not null default false,
  color         text,
  tint          text,
  created_at    timestamptz not null default now()
);

create table if not exists public.products (
  id          text primary key,
  building_id text references public.buildings(id),
  name        text not null,
  category    text not null,
  unit        text,
  price       numeric(10,2) not null default 0,
  provider_id text references public.providers(id) on delete set null,
  par         int not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists public.stock_levels (
  product_id  text references public.products(id) on delete cascade,
  building_id text references public.buildings(id),
  qty_now     int not null default 0,
  updated_at  timestamptz not null default now(),
  primary key (product_id, building_id)
);

create table if not exists public.stock_movements (
  id          uuid primary key default gen_random_uuid(),
  building_id text references public.buildings(id),
  product_id  text references public.products(id) on delete cascade,
  direction   text not null,                       -- 'in' | 'out'
  qty         int not null,
  after_qty   int not null,
  unit        text,
  provider_id text references public.providers(id) on delete set null,
  unit_price  numeric(10,2),
  dests       jsonb,                                -- out: [{room, person, qty}]
  receiver    text,
  note        text,
  actor_id    uuid references public.app_users(id),
  moved_at    timestamptz not null default now(),
  move_date   date not null default current_date
);
create index if not exists stock_movements_product_idx
  on public.stock_movements (product_id, moved_at desc);

create table if not exists public.orders (
  id             uuid primary key default gen_random_uuid(),
  building_id    text references public.buildings(id),
  provider_id    text references public.providers(id) on delete set null,
  status         text not null default 'draft',     -- 'draft' | 'placed'
  placed_by      uuid references public.app_users(id),
  placed_at      timestamptz,
  total_excl_gst numeric(12,2),
  created_at     timestamptz not null default now()
);

create table if not exists public.order_lines (
  order_id   uuid references public.orders(id) on delete cascade,
  product_id text references public.products(id) on delete cascade,
  qty        int not null,
  unit_price numeric(10,2) not null,
  primary key (order_id, product_id)
);

-- RLS: authenticated read + write (same posture as the residents phase).
alter table public.providers       enable row level security;
alter table public.products        enable row level security;
alter table public.stock_levels    enable row level security;
alter table public.stock_movements enable row level security;
alter table public.orders          enable row level security;
alter table public.order_lines     enable row level security;

do $$
declare t text;
begin
  foreach t in array array['providers','products','stock_levels','stock_movements','orders','order_lines']
  loop
    execute format('drop policy if exists %I_read on public.%I', t, t);
    execute format('create policy %I_read on public.%I for select to authenticated using (true)', t, t);
    execute format('drop policy if exists %I_write on public.%I', t, t);
    execute format('create policy %I_write on public.%I for all to authenticated using (true) with check (true)', t, t);
  end loop;
end $$;

-- Atomic: adjust on-hand + append the ledger row. security invoker → RLS applies.
create or replace function public.record_stock_movement(
  p_product_id text, p_building_id text, p_direction text, p_qty int,
  p_unit text, p_provider_id text, p_unit_price numeric, p_dests jsonb,
  p_receiver text, p_note text, p_actor_id uuid, p_move_date date
) returns public.stock_movements
language plpgsql security invoker as $$
declare v_cur int; v_new int; v_row public.stock_movements;
begin
  if p_qty is null or p_qty <= 0 then raise exception 'qty must be positive'; end if;
  insert into public.stock_levels(product_id, building_id, qty_now)
    values (p_product_id, p_building_id, 0) on conflict do nothing;
  select qty_now into v_cur from public.stock_levels
    where product_id = p_product_id and building_id = p_building_id for update;
  if p_direction = 'out' and coalesce(v_cur,0) < p_qty then
    raise exception 'insufficient stock: have %, need %', coalesce(v_cur,0), p_qty;
  end if;
  v_new := greatest(0, coalesce(v_cur,0) + case when p_direction = 'in' then p_qty else -p_qty end);
  update public.stock_levels set qty_now = v_new, updated_at = now()
    where product_id = p_product_id and building_id = p_building_id;
  insert into public.stock_movements(building_id, product_id, direction, qty, after_qty,
      unit, provider_id, unit_price, dests, receiver, note, actor_id, move_date)
    values (p_building_id, p_product_id, p_direction, p_qty, v_new, p_unit,
      p_provider_id, p_unit_price, p_dests, p_receiver, p_note, p_actor_id, coalesce(p_move_date, current_date))
    returning * into v_row;
  return v_row;
end $$;

-- Atomic: reverse the balance + remove the ledger row.
create or replace function public.delete_stock_movement(p_id uuid)
returns void language plpgsql security invoker as $$
declare v public.stock_movements;
begin
  select * into v from public.stock_movements where id = p_id;
  if not found then return; end if;
  update public.stock_levels
    set qty_now = greatest(0, qty_now + case when v.direction = 'in' then -v.qty else v.qty end),
        updated_at = now()
    where product_id = v.product_id and building_id = v.building_id;
  delete from public.stock_movements where id = p_id;
end $$;

grant execute on function public.record_stock_movement(text,text,text,int,text,text,numeric,jsonb,text,text,uuid,date) to authenticated;
grant execute on function public.delete_stock_movement(uuid) to authenticated;
