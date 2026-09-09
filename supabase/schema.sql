-- ============================================================================
-- Reinauguração do Sítio — Matozinhos
-- Script para rodar no SQL Editor do seu projeto Supabase existente.
-- Cria só uma tabela nova + uma view + políticas de segurança, sem precisar
-- de um projeto Supabase novo.
--
-- ANTES DE RODAR:
-- 1. Troque TODAS as ocorrências de 'TROQUE_PARA_SEU_EMAIL@exemplo.com'
--    pelo e-mail que você vai usar para logar como organizador.
-- 2. Crie esse usuário admin em: Authentication > Users > Add user
--    (no painel do Supabase), usando o MESMO e-mail.
-- ============================================================================

-- 1. Tabela principal dos convidados
create table if not exists public.evento_matozinhos_convidados (
  id uuid primary key default gen_random_uuid(),
  first_name text not null check (char_length(trim(first_name)) > 0),
  last_name  text not null check (char_length(trim(last_name)) > 0),
  phone      text not null check (char_length(trim(phone)) >= 8),
  paid       boolean not null default false,
  created_at timestamptz not null default now()
);

-- 2. View pública, SEM o telefone — é o que a lista pública do site usa.
--    security_invoker = false faz a view usar o dono dela (não quem consulta),
--    então ela funciona mesmo com a tabela bloqueada por RLS para o público.
create or replace view public.evento_matozinhos_lista_publica
  with (security_invoker = false) as
  select id, first_name, last_name, paid, created_at
  from public.evento_matozinhos_convidados;

-- 3. Liga a segurança em nível de linha (RLS) na tabela principal
alter table public.evento_matozinhos_convidados enable row level security;

-- 4. Qualquer pessoa (mesmo sem login) pode se cadastrar
drop policy if exists "qualquer_pessoa_pode_cadastrar" on public.evento_matozinhos_convidados;
create policy "qualquer_pessoa_pode_cadastrar"
  on public.evento_matozinhos_convidados
  for insert
  to anon, authenticated
  with check (true);

-- 5. Só o organizador logado enxerga a tabela completa (com telefone)
drop policy if exists "admin_pode_ver_tudo" on public.evento_matozinhos_convidados;
create policy "admin_pode_ver_tudo"
  on public.evento_matozinhos_convidados
  for select
  to authenticated
  using ( (auth.jwt() ->> 'email') = 'TROQUE_PARA_SEU_EMAIL@exemplo.com' );

-- 6. Só o organizador logado pode marcar pago / não pago
drop policy if exists "admin_pode_atualizar" on public.evento_matozinhos_convidados;
create policy "admin_pode_atualizar"
  on public.evento_matozinhos_convidados
  for update
  to authenticated
  using ( (auth.jwt() ->> 'email') = 'TROQUE_PARA_SEU_EMAIL@exemplo.com' )
  with check ( (auth.jwt() ->> 'email') = 'TROQUE_PARA_SEU_EMAIL@exemplo.com' );

-- 7. Só o organizador logado pode excluir convidados
drop policy if exists "admin_pode_excluir" on public.evento_matozinhos_convidados;
create policy "admin_pode_excluir"
  on public.evento_matozinhos_convidados
  for delete
  to authenticated
  using ( (auth.jwt() ->> 'email') = 'TROQUE_PARA_SEU_EMAIL@exemplo.com' );

-- 8. Permissões de acesso (grants) — precisam existir além das policies acima
grant usage on schema public to anon, authenticated;
grant insert on public.evento_matozinhos_convidados to anon, authenticated;
grant select, update, delete on public.evento_matozinhos_convidados to authenticated;
grant select on public.evento_matozinhos_lista_publica to anon, authenticated;

-- 9. Realtime — a lista do site atualiza sozinha quando alguém cadastra
--    ou quando você marca pagamento, sem precisar dar F5.
alter publication supabase_realtime add table public.evento_matozinhos_convidados;
