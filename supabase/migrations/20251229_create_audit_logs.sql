-- Create audit_logs table
create table public.audit_logs (
  id uuid not null default gen_random_uuid(),
  created_at timestamp with time zone not null default now(),
  user_id uuid references auth.users(id),
  action text not null,
  resource text not null,
  details jsonb,
  ip_address text,
  
  constraint audit_logs_pkey primary key (id)
);

-- Enable RLS
alter table public.audit_logs enable row level security;

-- Policies
-- Only admins can read logs
create policy "Admins can view audit logs"
  on public.audit_logs
  for select
  using (
    auth.jwt() ->> 'role' = 'service_role' -- Allow service role (e.g. from server actions if bypassing RLS) 
    or
    (auth.jwt() -> 'app_metadata' ->> 'role')::text = 'admin'
  );

-- Authenticated users (server actions) can insert logs
create policy "Server can insert audit logs"
  on public.audit_logs
  for insert
  with check (true);

-- No update/delete allowed
