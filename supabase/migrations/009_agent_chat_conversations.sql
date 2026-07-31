-- ─── Agent Chat Conversations Log ──────────────────────────────
create table if not exists agent_chat_logs (
  id           uuid primary key default uuid_generate_v4(),
  session_id   text not null,
  user_id      uuid references profiles(id) on delete set null,
  patient_id   uuid references patients(id) on delete set null,
  sender_role  text not null, -- 'user' or 'agent'
  message_text text not null,
  current_node text,
  options      jsonb default '[]'::jsonb,
  created_at   timestamptz not null default now()
);

create index if not exists idx_agent_chat_logs_session on agent_chat_logs(session_id, created_at);
create index if not exists idx_agent_chat_logs_user    on agent_chat_logs(user_id, created_at desc);
create index if not exists idx_agent_chat_logs_patient on agent_chat_logs(patient_id, created_at desc);
