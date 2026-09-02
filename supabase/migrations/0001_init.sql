-- ============================================================
-- 家庭驾驶舱 D2 · 全量建表（一次性地基）
-- 14 张表 + RLS 家庭隔离 + 注册自动建档 + 存量账号补录
-- 设计：members 兼任用户档案表（user_id 关联登录账号）
--       所有业务表带 family_id，RLS 统一按家庭隔离
-- ============================================================

-- 1. families 家庭表（每个注册用户自动建一个家庭，家人凭家庭码加入）
create table public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null default '我的家',
  invite_code text unique default upper(substr(md5(random()::text), 1, 6)),
  created_at timestamptz not null default now()
);

-- 2. members 成员表（家庭成员档案，兼任登录账号档案）
create table public.members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  user_id uuid unique references auth.users(id) on delete set null,
  name text not null,
  role text not null default 'member'
    check (role in ('admin', 'member', 'child', 'pet')),
  relation text,
  gender text check (gender in ('male', 'female')),
  birthday date,
  phone text,
  tags text[] default '{}',
  taboos text[] default '{}',
  constitution text,
  avatar_url text,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. events 事件引擎表（生日/电话/体检/缴费/疫苗/节日/会议/保修到期/证件到期）
create table public.events (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  member_id uuid references public.members(id) on delete set null,
  type text not null,
  title text not null,
  start_date date not null,
  recurrence text not null default 'none'
    check (recurrence in ('none', 'yearly', 'monthly', 'weekly', 'daily')),
  advance_days int not null default 1,
  is_active boolean not null default true,
  note text,
  created_at timestamptz not null default now()
);

-- 4. records 记录引擎表（读书/观影/旅行/大事记/会议纪要/体检报告）
create table public.records (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  member_id uuid references public.members(id) on delete set null,
  type text not null,
  category text,
  title text not null,
  content text,
  occurred_at date not null default current_date,
  created_at timestamptz not null default now()
);

-- 5. money_records 账目引擎表（份子钱/压岁钱/补课费）
create table public.money_records (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  member_id uuid references public.members(id) on delete set null,
  direction text not null check (direction in ('in', 'out')),
  counterparty text not null,
  occasion text,
  amount numeric(12, 2) not null check (amount >= 0),
  occurred_at date not null default current_date,
  note text,
  created_at timestamptz not null default now()
);

-- 6. assets 资产台账（家电/车辆/房产，保修到期自动生成 events）
create table public.assets (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  name text not null,
  category text not null default 'appliance'
    check (category in ('appliance', 'vehicle', 'property', 'other')),
  brand text,
  model text,
  purchase_date date,
  price numeric(12, 2),
  warranty_end date,
  location text,
  note text,
  created_at timestamptz not null default now()
);

-- 7. documents 家庭档案（证件/保单/合约，到期自动生成 events）
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  member_id uuid references public.members(id) on delete set null,
  type text not null default 'other',
  title text not null,
  issuer text,
  number text,
  issue_date date,
  expiry_date date,
  location text,
  premium numeric(12, 2),
  coverage numeric(12, 2),
  note text,
  created_at timestamptz not null default now()
);

-- 8. goals 目标表（member_id 空 = 家庭目标）
create table public.goals (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  member_id uuid references public.members(id) on delete set null,
  title text not null,
  description text,
  target_date date,
  status text not null default 'not_started'
    check (status in ('not_started', 'in_progress', 'done')),
  progress_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 9. courses 兴趣班表（课时进度条）
create table public.courses (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  member_id uuid references public.members(id) on delete set null,
  name text not null,
  start_date date,
  total_lessons int not null default 0,
  completed_lessons int not null default 0,
  schedule_note text,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 10. reminders 提醒落地表（D4 提醒引擎写入，event+日期去重）
create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  event_id uuid references public.events(id) on delete cascade,
  member_id uuid references public.members(id) on delete set null,
  remind_date date not null,
  title text not null,
  detail text,
  status text not null default 'pending'
    check (status in ('pending', 'sent', 'read')),
  created_at timestamptz not null default now(),
  unique (event_id, remind_date)
);

-- 11. notifications 通知表（应用内通知中心）
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  content text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- 12. family_culture 家风表（家训/家庭会议纪要/家族记事）
create table public.family_culture (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  type text not null check (type in ('motto', 'meeting', 'history')),
  title text not null,
  content text,
  occurred_at date,
  created_at timestamptz not null default now()
);

-- 13. recipes 菜谱表（菜谱知识库迁移，体质适配）
create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  name text not null,
  ingredients text,
  steps text,
  constitution_tags text[] default '{}',
  season text,
  note text,
  created_at timestamptz not null default now()
);

-- 14. finance_snapshots 飞书账单缓存表
create table public.finance_snapshots (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  month text not null,
  data jsonb not null,
  synced_at timestamptz not null default now(),
  unique (family_id, month)
);

-- ============================================================
-- 索引
-- ============================================================
create index idx_members_family on public.members (family_id);
create index idx_members_user on public.members (user_id);
create index idx_events_family on public.events (family_id);
create index idx_events_date on public.events (start_date);
create index idx_events_member on public.events (member_id);
create index idx_records_family on public.records (family_id, occurred_at desc);
create index idx_money_family on public.money_records (family_id, occurred_at desc);
create index idx_documents_expiry on public.documents (expiry_date);
create index idx_assets_warranty on public.assets (warranty_end);
create index idx_reminders_family on public.reminders (family_id, remind_date);
create index idx_notifications_user on public.notifications (user_id, is_read);

-- ============================================================
-- 工具函数：当前用户的家庭 id（RLS 统一入口）
-- ============================================================
create or replace function public.current_family_id()
returns uuid
language sql stable
security definer
set search_path = public
as $$
  select family_id from public.members
  where user_id = auth.uid()
  limit 1
$$;

-- updated_at 自动更新
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger trg_members_touch before update on public.members
  for each row execute function public.touch_updated_at();
create trigger trg_goals_touch before update on public.goals
  for each row execute function public.touch_updated_at();
create trigger trg_courses_touch before update on public.courses
  for each row execute function public.touch_updated_at();

-- ============================================================
-- RLS：所有表开行级安全，策略只有两种模板
--   读：family_id = 我的家庭
--   写：family_id = 我的家庭（家庭内全员可写，跨家庭绝对隔离）
-- ============================================================
alter table public.families enable row level security;
alter table public.members enable row level security;
alter table public.events enable row level security;
alter table public.records enable row level security;
alter table public.money_records enable row level security;
alter table public.assets enable row level security;
alter table public.documents enable row level security;
alter table public.goals enable row level security;
alter table public.courses enable row level security;
alter table public.reminders enable row level security;
alter table public.notifications enable row level security;
alter table public.family_culture enable row level security;
alter table public.recipes enable row level security;
alter table public.finance_snapshots enable row level security;

-- families：只能看/改自己的家庭
create policy "families_select" on public.families
  for select using (id = public.current_family_id());
create policy "families_update" on public.families
  for update using (id = public.current_family_id());

-- members：家庭内全员可读写
create policy "members_select" on public.members
  for select using (family_id = public.current_family_id());
create policy "members_insert" on public.members
  for insert with check (family_id = public.current_family_id());
create policy "members_update" on public.members
  for update using (family_id = public.current_family_id());
create policy "members_delete" on public.members
  for delete using (family_id = public.current_family_id());

-- events
create policy "events_select" on public.events
  for select using (family_id = public.current_family_id());
create policy "events_insert" on public.events
  for insert with check (family_id = public.current_family_id());
create policy "events_update" on public.events
  for update using (family_id = public.current_family_id());
create policy "events_delete" on public.events
  for delete using (family_id = public.current_family_id());

-- records
create policy "records_select" on public.records
  for select using (family_id = public.current_family_id());
create policy "records_insert" on public.records
  for insert with check (family_id = public.current_family_id());
create policy "records_update" on public.records
  for update using (family_id = public.current_family_id());
create policy "records_delete" on public.records
  for delete using (family_id = public.current_family_id());

-- money_records
create policy "money_select" on public.money_records
  for select using (family_id = public.current_family_id());
create policy "money_insert" on public.money_records
  for insert with check (family_id = public.current_family_id());
create policy "money_update" on public.money_records
  for update using (family_id = public.current_family_id());
create policy "money_delete" on public.money_records
  for delete using (family_id = public.current_family_id());

-- assets
create policy "assets_select" on public.assets
  for select using (family_id = public.current_family_id());
create policy "assets_insert" on public.assets
  for insert with check (family_id = public.current_family_id());
create policy "assets_update" on public.assets
  for update using (family_id = public.current_family_id());
create policy "assets_delete" on public.assets
  for delete using (family_id = public.current_family_id());

-- documents
create policy "documents_select" on public.documents
  for select using (family_id = public.current_family_id());
create policy "documents_insert" on public.documents
  for insert with check (family_id = public.current_family_id());
create policy "documents_update" on public.documents
  for update using (family_id = public.current_family_id());
create policy "documents_delete" on public.documents
  for delete using (family_id = public.current_family_id());

-- goals
create policy "goals_select" on public.goals
  for select using (family_id = public.current_family_id());
create policy "goals_insert" on public.goals
  for insert with check (family_id = public.current_family_id());
create policy "goals_update" on public.goals
  for update using (family_id = public.current_family_id());
create policy "goals_delete" on public.goals
  for delete using (family_id = public.current_family_id());

-- courses
create policy "courses_select" on public.courses
  for select using (family_id = public.current_family_id());
create policy "courses_insert" on public.courses
  for insert with check (family_id = public.current_family_id());
create policy "courses_update" on public.courses
  for update using (family_id = public.current_family_id());
create policy "courses_delete" on public.courses
  for delete using (family_id = public.current_family_id());

-- reminders
create policy "reminders_select" on public.reminders
  for select using (family_id = public.current_family_id());
create policy "reminders_insert" on public.reminders
  for insert with check (family_id = public.current_family_id());
create policy "reminders_update" on public.reminders
  for update using (family_id = public.current_family_id());
create policy "reminders_delete" on public.reminders
  for delete using (family_id = public.current_family_id());

-- notifications：按用户隔离（通知发给具体人）
create policy "notifications_select" on public.notifications
  for select using (
    user_id = auth.uid()
    or family_id = public.current_family_id()
  );
create policy "notifications_insert" on public.notifications
  for insert with check (family_id = public.current_family_id());
create policy "notifications_update" on public.notifications
  for update using (user_id = auth.uid());
create policy "notifications_delete" on public.notifications
  for delete using (user_id = auth.uid());

-- family_culture
create policy "culture_select" on public.family_culture
  for select using (family_id = public.current_family_id());
create policy "culture_insert" on public.family_culture
  for insert with check (family_id = public.current_family_id());
create policy "culture_update" on public.family_culture
  for update using (family_id = public.current_family_id());
create policy "culture_delete" on public.family_culture
  for delete using (family_id = public.current_family_id());

-- recipes
create policy "recipes_select" on public.recipes
  for select using (family_id = public.current_family_id());
create policy "recipes_insert" on public.recipes
  for insert with check (family_id = public.current_family_id());
create policy "recipes_update" on public.recipes
  for update using (family_id = public.current_family_id());
create policy "recipes_delete" on public.recipes
  for delete using (family_id = public.current_family_id());

-- finance_snapshots
create policy "finance_select" on public.finance_snapshots
  for select using (family_id = public.current_family_id());
create policy "finance_insert" on public.finance_snapshots
  for insert with check (family_id = public.current_family_id());
create policy "finance_update" on public.finance_snapshots
  for update using (family_id = public.current_family_id());
create policy "finance_delete" on public.finance_snapshots
  for delete using (family_id = public.current_family_id());

-- ============================================================
-- 注册自动建档：新用户注册 → 自动建家庭 + "自己"成员档案
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  fid uuid;
begin
  insert into public.families (name)
  values (coalesce(new.raw_user_meta_data ->> 'family_name', '我的家'))
  returning id into fid;

  insert into public.members (family_id, user_id, name, role, relation)
  values (
    fid,
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    'admin',
    '自己'
  );
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 存量账号补录：D1 已注册但还没有家庭/档案的账号，补建
-- ============================================================
do $$
declare
  u record;
  fid uuid;
begin
  for u in
    select id, email, raw_user_meta_data
    from auth.users
    where id not in (
      select user_id from public.members where user_id is not null
    )
  loop
    insert into public.families (name)
    values (split_part(u.email, '@', 1) || '的家')
    returning id into fid;

    insert into public.members (family_id, user_id, name, role, relation)
    values (
      fid,
      u.id,
      coalesce(u.raw_user_meta_data ->> 'name', split_part(u.email, '@', 1)),
      'admin',
      '自己'
    );
  end loop;
end $$;
