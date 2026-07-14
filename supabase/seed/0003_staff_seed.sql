-- Staff seed — paste in the Supabase SQL Editor AFTER 0003_staff_admin.sql.
-- Upsert the design's 10 staff (insert-if-missing + update), then drop stray placeholder staff.
insert into public.staff (building_id, name, role, wing, initials, color, status, contract, hours, phone, start_label, annual, taken)
  select 'wesley','Aroha Ngata','Registered Nurse','Rātā','AN','#6E875E','Active','Full-time',40,'021 555 012','Mar 2021',20,6
  where not exists (select 1 from public.staff where name='Aroha Ngata' and building_id='wesley');
update public.staff set role='Registered Nurse', wing='Rātā', contract='Full-time', hours=40, phone='021 555 012', start_label='Mar 2021', status='Active', annual=20, taken=6, initials='AN', color='#6E875E' where name='Aroha Ngata' and building_id='wesley';
insert into public.staff (building_id, name, role, wing, initials, color, status, contract, hours, phone, start_label, annual, taken)
  select 'wesley','David Cho','Registered Nurse','Kōwhai','DC','#8a6ba3','Active','Full-time',40,'021 555 034','Aug 2020',20,4
  where not exists (select 1 from public.staff where name='David Cho' and building_id='wesley');
update public.staff set role='Registered Nurse', wing='Kōwhai', contract='Full-time', hours=40, phone='021 555 034', start_label='Aug 2020', status='Active', annual=20, taken=4, initials='DC', color='#8a6ba3' where name='David Cho' and building_id='wesley';
insert into public.staff (building_id, name, role, wing, initials, color, status, contract, hours, phone, start_label, annual, taken)
  select 'wesley','Mere Solomon','Team Leader','Rātā','MS','#b06a5a','Active','Full-time',38,'021 555 056','Jan 2019',20,12
  where not exists (select 1 from public.staff where name='Mere Solomon' and building_id='wesley');
update public.staff set role='Team Leader', wing='Rātā', contract='Full-time', hours=38, phone='021 555 056', start_label='Jan 2019', status='Active', annual=20, taken=12, initials='MS', color='#b06a5a' where name='Mere Solomon' and building_id='wesley';
insert into public.staff (building_id, name, role, wing, initials, color, status, contract, hours, phone, start_label, annual, taken)
  select 'wesley','Tomasi Fifita','Carer','Kōwhai','TF','#5b8f9a','Active','Full-time',40,'021 555 078','Feb 2022',20,8
  where not exists (select 1 from public.staff where name='Tomasi Fifita' and building_id='wesley');
update public.staff set role='Carer', wing='Kōwhai', contract='Full-time', hours=40, phone='021 555 078', start_label='Feb 2022', status='Active', annual=20, taken=8, initials='TF', color='#5b8f9a' where name='Tomasi Fifita' and building_id='wesley';
insert into public.staff (building_id, name, role, wing, initials, color, status, contract, hours, phone, start_label, annual, taken)
  select 'wesley','Hong Le','Carer','Tōtara','HL','#BE7350','Active','Part-time',24,'021 555 090','Jun 2022',16,5
  where not exists (select 1 from public.staff where name='Hong Le' and building_id='wesley');
update public.staff set role='Carer', wing='Tōtara', contract='Part-time', hours=24, phone='021 555 090', start_label='Jun 2022', status='Active', annual=16, taken=5, initials='HL', color='#BE7350' where name='Hong Le' and building_id='wesley';
insert into public.staff (building_id, name, role, wing, initials, color, status, contract, hours, phone, start_label, annual, taken)
  select 'wesley','Candy Tian','Carer','Rātā','CT','#c08a3e','On leave','Part-time',20,'021 555 102','Sep 2023',16,14
  where not exists (select 1 from public.staff where name='Candy Tian' and building_id='wesley');
update public.staff set role='Carer', wing='Rātā', contract='Part-time', hours=20, phone='021 555 102', start_label='Sep 2023', status='On leave', annual=16, taken=14, initials='CT', color='#c08a3e' where name='Candy Tian' and building_id='wesley';
insert into public.staff (building_id, name, role, wing, initials, color, status, contract, hours, phone, start_label, annual, taken)
  select 'wesley','Priya Nair','Carer','Kōwhai','PN','#7e9b6a','Active','Casual',12,'021 555 124','Nov 2023',8,2
  where not exists (select 1 from public.staff where name='Priya Nair' and building_id='wesley');
update public.staff set role='Carer', wing='Kōwhai', contract='Casual', hours=12, phone='021 555 124', start_label='Nov 2023', status='Active', annual=8, taken=2, initials='PN', color='#7e9b6a' where name='Priya Nair' and building_id='wesley';
insert into public.staff (building_id, name, role, wing, initials, color, status, contract, hours, phone, start_label, annual, taken)
  select 'wesley','Grace Lin','Activities','All wings','GL','#9a7b4f','Active','Part-time',24,'021 555 146','Apr 2021',16,7
  where not exists (select 1 from public.staff where name='Grace Lin' and building_id='wesley');
update public.staff set role='Activities', wing='All wings', contract='Part-time', hours=24, phone='021 555 146', start_label='Apr 2021', status='Active', annual=16, taken=7, initials='GL', color='#9a7b4f' where name='Grace Lin' and building_id='wesley';
insert into public.staff (building_id, name, role, wing, initials, color, status, contract, hours, phone, start_label, annual, taken)
  select 'wesley','Vo Hoang Lam','Carer','Tōtara','VL','#6e879e','Active','Full-time',40,'021 555 168','Jul 2022',20,9
  where not exists (select 1 from public.staff where name='Vo Hoang Lam' and building_id='wesley');
update public.staff set role='Carer', wing='Tōtara', contract='Full-time', hours=40, phone='021 555 168', start_label='Jul 2022', status='Active', annual=20, taken=9, initials='VL', color='#6e879e' where name='Vo Hoang Lam' and building_id='wesley';
insert into public.staff (building_id, name, role, wing, initials, color, status, contract, hours, phone, start_label, annual, taken)
  select 'wesley','LE Anh Thang','Carer','Tōtara','AT','#3d6b74','Active','Casual',10,'021 555 180','Feb 2024',8,1
  where not exists (select 1 from public.staff where name='LE Anh Thang' and building_id='wesley');
update public.staff set role='Carer', wing='Tōtara', contract='Casual', hours=10, phone='021 555 180', start_label='Feb 2024', status='Active', annual=8, taken=1, initials='AT', color='#3d6b74' where name='LE Anh Thang' and building_id='wesley';

-- Remove stray core-seed staff not in the design directory (safe: only the Staff screen reads this table).
delete from public.staff where building_id='wesley' and name not in ('Aroha Ngata', 'David Cho', 'Mere Solomon', 'Tomasi Fifita', 'Hong Le', 'Candy Tian', 'Priya Nair', 'Grace Lin', 'Vo Hoang Lam', 'LE Anh Thang');

insert into public.shift_templates (id, building_id, name, time_label, req, filled, color, tint, border) values
  ('sh1','wesley','Morning','6:45 – 15:15',4,4,'#87651A','#FCF4DC','#EAD9A4'),
  ('sh2','wesley','Morning + Stock','6:45 – 17:15',1,1,'#8A6516','#FBEFC8','#E7CE8A'),
  ('sh3','wesley','Afternoon','14:45 – 22:15',3,2,'#9A4A70','#F7DFEA','#E5B2CB'),
  ('sh4','wesley','Evening (split)','8:30 – 21:00',2,2,'#A24E2A','#F7DDCC','#E8AE88'),
  ('sh5','wesley','Night','23:45 – 8:15',2,1,'#3B4E74','#E3E8F5','#B4C1DF'),
  ('sh6','wesley','Team Leader','8:00 – 22:45',2,2,'#2C5A6E','#D8EAF0','#9FC5D4')
on conflict (id) do update set name=excluded.name, time_label=excluded.time_label, req=excluded.req,
  filled=excluded.filled, color=excluded.color, tint=excluded.tint, border=excluded.border;

delete from public.leave_requests where building_id='wesley';
insert into public.leave_requests (building_id, staff_id, type, from_date, to_date, days, status, note)
  select 'wesley', s.id, 'Annual leave', '2026-07-18', '2026-07-25', 5, 'Pending', 'Family trip' from public.staff s where s.name='Mere Solomon' and s.building_id='wesley';
insert into public.leave_requests (building_id, staff_id, type, from_date, to_date, days, status, note)
  select 'wesley', s.id, 'Shift swap', '2026-07-20', '2026-07-20', 1, 'Pending', 'Swap Sun PM → Ana Reti' from public.staff s where s.name='Tomasi Fifita' and s.building_id='wesley';
insert into public.leave_requests (building_id, staff_id, type, from_date, to_date, days, status, note)
  select 'wesley', s.id, 'Sick leave', '2026-07-14', '2026-07-14', 1, 'Pending', 'Afternoon covered' from public.staff s where s.name='Priya Nair' and s.building_id='wesley';
insert into public.leave_requests (building_id, staff_id, type, from_date, to_date, days, status, note)
  select 'wesley', s.id, 'Annual leave', '2026-07-01', '2026-07-12', 8, 'Approved', '' from public.staff s where s.name='Candy Tian' and s.building_id='wesley';
