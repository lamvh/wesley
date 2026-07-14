-- Stock seed — paste in the Supabase SQL Editor AFTER 0002_stock_procurement.sql. Idempotent.
insert into public.providers (id, building_id, name, category, contact_email, phone, lead_time, terms, preferred, color, tint) values
  ('medsupply','wesley','MedSupply NZ','Clinical & PPE','orders@medsupply.co.nz','09 555 0110','2–3 days','20th of month',true,'#2C3563','#E4E6F2'),
  ('carewell','wesley','CareWell Continence','Continence','sales@carewell.co.nz','09 555 0244','3–4 days','Net 30',true,'#3d6b74','#DEEAEC'),
  ('freshfields','wesley','Fresh Fields Foods','Kitchen & Nutrition','wholesale@freshfields.nz','09 555 0388','Next day','Net 14',false,'#3F5137','#E5EBDD'),
  ('cleanco','wesley','CleanCo Hygiene','Housekeeping','orders@cleanco.co.nz','09 555 0455','2–3 days','Net 30',false,'#8A6516','#F3E8CE')
on conflict (id) do update set name=excluded.name, category=excluded.category, contact_email=excluded.contact_email,
  phone=excluded.phone, lead_time=excluded.lead_time, terms=excluded.terms, preferred=excluded.preferred,
  color=excluded.color, tint=excluded.tint;

insert into public.products (id, building_id, name, category, unit, price, provider_id, par) values
  ('p1','wesley','Nitrile gloves (M)','Clinical & PPE','box of 100',12.5,'medsupply',20),
  ('p2','wesley','Surgical masks','Clinical & PPE','box of 50',9,'medsupply',30),
  ('p3','wesley','Wound dressings','Clinical & PPE','pack of 10',18,'medsupply',40),
  ('p4','wesley','Hand sanitiser 500ml','Clinical & PPE','each',6.5,'medsupply',24),
  ('p5','wesley','Briefs — large','Continence','pack of 20',22,'carewell',30),
  ('p6','wesley','Bed pads','Continence','pack of 25',15,'carewell',50),
  ('p7','wesley','Wipes','Continence','pack of 80',4.5,'carewell',30),
  ('p8','wesley','Thickener','Kitchen & Nutrition','tin',11,'freshfields',20),
  ('p9','wesley','Supplement drinks','Kitchen & Nutrition','carton',28,'freshfields',50),
  ('p10','wesley','Tea & coffee','Kitchen & Nutrition','box',8,'freshfields',24),
  ('p11','wesley','Surface spray 750ml','Housekeeping','each',5,'cleanco',24),
  ('p12','wesley','Laundry powder 10kg','Housekeeping','sack',34,'cleanco',8)
on conflict (id) do update set name=excluded.name, category=excluded.category, unit=excluded.unit,
  price=excluded.price, provider_id=excluded.provider_id, par=excluded.par;

insert into public.stock_levels (product_id, building_id, qty_now) values
  ('p1','wesley',4),
  ('p2','wesley',26),
  ('p3','wesley',48),
  ('p4','wesley',9),
  ('p5','wesley',12),
  ('p6','wesley',55),
  ('p7','wesley',34),
  ('p8','wesley',7),
  ('p9','wesley',62),
  ('p10','wesley',28),
  ('p11','wesley',10),
  ('p12','wesley',3)
on conflict (product_id, building_id) do update set qty_now=excluded.qty_now, updated_at=now();

delete from public.stock_movements where building_id='wesley';
insert into public.stock_movements (building_id, product_id, direction, qty, after_qty, unit, provider_id, unit_price, note, move_date)
values ('wesley','p9','in',24,62,'carton','freshfields',28.0,'Weekly delivery', current_date - 1);
insert into public.stock_movements (building_id, product_id, direction, qty, after_qty, unit, dests, receiver, note, move_date)
values ('wesley','p1','out',4,4,'box of 100','[{"room":"07","person":"Henry Fitzgerald","qty":4}]'::jsonb,'Mere Rangi','Room resupply', current_date);
