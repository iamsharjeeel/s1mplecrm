-- rollback: drop tables in reverse order; drop function is_org_member; drop trigger seed_default_pipeline

create extension if not exists "pgcrypto";

create or replace function public.is_org_member(p_org_id uuid, p_min_role text default 'member')
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members m
    where m.org_id = p_org_id
      and m.user_id = auth.uid()
      and (
        case m.role
          when 'owner' then 3
          when 'admin' then 2
          when 'member' then 1
          else 0
        end
        >=
        case p_min_role
          when 'owner' then 3
          when 'admin' then 2
          when 'member' then 1
          else 1
        end
      )
  );
$$;

revoke all on function public.is_org_member(uuid, text) from public;
grant execute on function public.is_org_member(uuid, text) to authenticated;

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  logo_url text,
  created_at timestamptz not null default now()
);

create table public.organization_members (
  org_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'member')),
  invited_by uuid references auth.users(id),
  joined_at timestamptz not null default now(),
  primary key (org_id, user_id)
);

create index organization_members_user_id_idx on public.organization_members(user_id);

create table public.invites (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  email text not null,
  role text not null check (role in ('admin', 'member')),
  token text not null unique default encode(gen_random_bytes(24), 'hex'),
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create index invites_org_id_idx on public.invites(org_id);
create index invites_token_idx on public.invites(token);

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  first_name text not null default '',
  last_name text not null default '',
  email text,
  phone text,
  company text,
  tags text[] not null default '{}',
  custom jsonb not null default '{}'::jsonb,
  owner_id uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index contacts_org_id_idx on public.contacts(org_id);
create index contacts_org_email_idx on public.contacts(org_id, email);
create index contacts_org_tags_idx on public.contacts using gin (tags);

create table public.pipelines (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create index pipelines_org_id_idx on public.pipelines(org_id);

create table public.stages (
  id uuid primary key default gen_random_uuid(),
  pipeline_id uuid not null references public.pipelines(id) on delete cascade,
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  position int not null default 0,
  color text not null default '#1f4d3a',
  created_at timestamptz not null default now()
);

create index stages_pipeline_id_idx on public.stages(pipeline_id);
create index stages_org_id_idx on public.stages(org_id);

create table public.deals (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  pipeline_id uuid not null references public.pipelines(id) on delete cascade,
  stage_id uuid not null references public.stages(id) on delete restrict,
  contact_id uuid references public.contacts(id) on delete set null,
  title text not null,
  value numeric(14,2) not null default 0,
  currency text not null default 'USD',
  status text not null default 'open' check (status in ('open', 'won', 'lost')),
  owner_id uuid references auth.users(id),
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index deals_org_id_idx on public.deals(org_id);
create index deals_stage_id_idx on public.deals(stage_id);
create index deals_pipeline_id_idx on public.deals(pipeline_id);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  due_at timestamptz,
  assignee_id uuid references auth.users(id),
  related_contact_id uuid references public.contacts(id) on delete set null,
  related_deal_id uuid references public.deals(id) on delete set null,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index tasks_org_id_idx on public.tasks(org_id);
create index tasks_assignee_id_idx on public.tasks(assignee_id);

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  actor_id uuid references auth.users(id),
  verb text not null,
  entity_type text not null,
  entity_id uuid,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index activities_org_id_created_at_idx on public.activities(org_id, created_at desc);
create index activities_entity_idx on public.activities(org_id, entity_type, entity_id);

create table public.emails (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  direction text not null default 'outbound' check (direction in ('outbound', 'inbound')),
  subject text not null default '',
  body_html text not null default '',
  status text not null default 'queued',
  provider_id text,
  sent_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index emails_org_contact_idx on public.emails(org_id, contact_id, created_at desc);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null unique references public.organizations(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text not null default 'free',
  status text,
  current_period_end timestamptz,
  created_at timestamptz not null default now()
);

create table public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  external_id text not null,
  payload jsonb not null default '{}'::jsonb,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (source, external_id)
);

create or replace function public.seed_default_pipeline()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  pid uuid;
begin
  insert into public.pipelines (org_id, name, position)
  values (new.id, 'Sales', 0)
  returning id into pid;

  insert into public.stages (pipeline_id, org_id, name, position, color) values
    (pid, new.id, 'Lead', 0, '#c0c9c2'),
    (pid, new.id, 'Qualified', 1, '#1f4d3a'),
    (pid, new.id, 'Proposal', 2, '#273037'),
    (pid, new.id, 'Won', 3, '#023625');

  return new;
end;
$$;

create trigger organizations_seed_pipeline
after insert on public.organizations
for each row execute function public.seed_default_pipeline();

create or replace function public.log_contact_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.activities (org_id, actor_id, verb, entity_type, entity_id, meta)
    values (new.org_id, auth.uid(), 'created', 'contact', new.id, jsonb_build_object('name', trim(new.first_name || ' ' || new.last_name)));
  elsif tg_op = 'UPDATE' then
    insert into public.activities (org_id, actor_id, verb, entity_type, entity_id, meta)
    values (new.org_id, auth.uid(), 'updated', 'contact', new.id, jsonb_build_object('name', trim(new.first_name || ' ' || new.last_name)));
  end if;
  return new;
end;
$$;

create trigger contacts_activity
after insert or update on public.contacts
for each row execute function public.log_contact_activity();

create or replace function public.log_deal_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.activities (org_id, actor_id, verb, entity_type, entity_id, meta)
    values (new.org_id, auth.uid(), 'created', 'deal', new.id, jsonb_build_object('title', new.title, 'stage_id', new.stage_id));
  elsif tg_op = 'UPDATE' then
    insert into public.activities (org_id, actor_id, verb, entity_type, entity_id, meta)
    values (
      new.org_id,
      auth.uid(),
      case when new.status is distinct from old.status then 'status_changed' when new.stage_id is distinct from old.stage_id then 'moved' else 'updated' end,
      'deal',
      new.id,
      jsonb_build_object('title', new.title, 'stage_id', new.stage_id, 'status', new.status)
    );
  end if;
  return new;
end;
$$;

create trigger deals_activity
after insert or update on public.deals
for each row execute function public.log_deal_activity();

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.invites enable row level security;
alter table public.contacts enable row level security;
alter table public.pipelines enable row level security;
alter table public.stages enable row level security;
alter table public.deals enable row level security;
alter table public.tasks enable row level security;
alter table public.activities enable row level security;
alter table public.emails enable row level security;
alter table public.subscriptions enable row level security;
alter table public.webhook_events enable row level security;

create policy organizations_select on public.organizations for select to authenticated
  using (public.is_org_member(id, 'member'));
create policy organizations_insert on public.organizations for insert to authenticated
  with check (true);
create policy organizations_update on public.organizations for update to authenticated
  using (public.is_org_member(id, 'admin'));

create policy organization_members_select on public.organization_members for select to authenticated
  using (public.is_org_member(org_id, 'member') or user_id = auth.uid());
create policy organization_members_insert on public.organization_members for insert to authenticated
  with check (
    user_id = auth.uid()
    or public.is_org_member(org_id, 'admin')
  );
create policy organization_members_update on public.organization_members for update to authenticated
  using (public.is_org_member(org_id, 'owner'));
create policy organization_members_delete on public.organization_members for delete to authenticated
  using (public.is_org_member(org_id, 'owner') or user_id = auth.uid());

create policy invites_select on public.invites for select to authenticated
  using (public.is_org_member(org_id, 'admin') or email = (auth.jwt() ->> 'email'));
create policy invites_insert on public.invites for insert to authenticated
  with check (public.is_org_member(org_id, 'admin'));
create policy invites_update on public.invites for update to authenticated
  using (public.is_org_member(org_id, 'admin') or email = (auth.jwt() ->> 'email'));
create policy invites_delete on public.invites for delete to authenticated
  using (public.is_org_member(org_id, 'admin'));

create policy contacts_all on public.contacts for all to authenticated
  using (public.is_org_member(org_id, 'member'))
  with check (public.is_org_member(org_id, 'member'));

create policy pipelines_all on public.pipelines for all to authenticated
  using (public.is_org_member(org_id, 'member'))
  with check (public.is_org_member(org_id, 'member'));

create policy stages_all on public.stages for all to authenticated
  using (public.is_org_member(org_id, 'member'))
  with check (public.is_org_member(org_id, 'member'));

create policy deals_all on public.deals for all to authenticated
  using (public.is_org_member(org_id, 'member'))
  with check (public.is_org_member(org_id, 'member'));

create policy tasks_all on public.tasks for all to authenticated
  using (public.is_org_member(org_id, 'member'))
  with check (public.is_org_member(org_id, 'member'));

create policy activities_select on public.activities for select to authenticated
  using (public.is_org_member(org_id, 'member'));
create policy activities_insert on public.activities for insert to authenticated
  with check (public.is_org_member(org_id, 'member'));

create policy emails_all on public.emails for all to authenticated
  using (public.is_org_member(org_id, 'member'))
  with check (public.is_org_member(org_id, 'member'));

create policy subscriptions_select on public.subscriptions for select to authenticated
  using (public.is_org_member(org_id, 'member'));

create policy webhook_events_deny on public.webhook_events for all to authenticated
  using (false)
  with check (false);

insert into storage.buckets (id, name, public)
values ('org-logos', 'org-logos', true)
on conflict (id) do nothing;

create policy org_logos_read on storage.objects for select to public
  using (bucket_id = 'org-logos');
create policy org_logos_write on storage.objects for insert to authenticated
  with check (bucket_id = 'org-logos' and public.is_org_member((storage.foldername(name))[1]::uuid, 'admin'));
create policy org_logos_update on storage.objects for update to authenticated
  using (bucket_id = 'org-logos' and public.is_org_member((storage.foldername(name))[1]::uuid, 'admin'));
