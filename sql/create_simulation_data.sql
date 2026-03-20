-- simulation_data: 유저별 배당표 데이터 저장
create table if not exists simulation_data (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default '',
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 유저별 조회 인덱스
create index if not exists idx_simulation_data_user_id
  on simulation_data(user_id);

-- RLS 활성화
alter table simulation_data enable row level security;

-- 본인 데이터만 CRUD 가능
create policy "Users can manage own simulation data"
  on simulation_data
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
