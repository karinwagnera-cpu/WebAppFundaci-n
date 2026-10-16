-- Envío de avisos por mail de la agenda (Fase 2).
-- Correr después de 20261016_agenda.sql, y ANTES de esto crear el secreto del cron
-- en Vault (ver el paso 2 de la guía). Es idempotente.

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Avisos ya enviados: evita mandar dos veces el mismo mail.
-- Si se cambia la fecha/hora de un evento cambia `inicio`, así que el aviso se vuelve a mandar.
create table if not exists public.avisos_enviados (
  evento_id  bigint      not null references public.eventos (id) on delete cascade,
  inicio     timestamptz not null,
  email      text        not null,
  minutos    int         not null,
  enviado_el timestamptz not null default now(),
  primary key (evento_id, inicio, email, minutos)
);

-- Sin políticas: solo el service role (la función de envío) lee y escribe acá.
alter table public.avisos_enviados enable row level security;

-- Avisos que corresponden mandar ahora: ya venció el momento del aviso,
-- el evento empezó hace menos de una hora (para no mandar avisos viejos) y no se mandó todavía.
create or replace function public.avisos_pendientes()
returns table (
  evento_id   bigint,
  titulo      text,
  descripcion text,
  ubicacion   text,
  todo_el_dia boolean,
  inicio      timestamptz,
  fin         timestamptz,
  email       text,
  minutos     int
)
language sql
stable
security definer
set search_path = public
as $$
  select e.id, e.titulo, e.descripcion, e.ubicacion, e.todo_el_dia, e.inicio, e.fin, inv.email, rec.minutos
  from public.eventos e
  cross join lateral unnest(e.recordatorios) as rec(minutos)
  cross join lateral unnest(e.invitados) as inv(email)
  where e.inicio - make_interval(mins => rec.minutos) <= now()
    and e.inicio > now() - interval '1 hour'
    and not exists (
      select 1 from public.avisos_enviados a
      where a.evento_id = e.id
        and a.inicio = e.inicio
        and a.email = inv.email
        and a.minutos = rec.minutos
    );
$$;

-- Solo el service role puede llamarla; los usuarios del panel no.
revoke all on function public.avisos_pendientes() from public, anon, authenticated;
grant execute on function public.avisos_pendientes() to service_role;

-- Cron: cada 5 minutos llama a la Edge Function `enviar-avisos`.
-- El secreto compartido se lee de Vault; no queda escrito en este archivo.
select cron.schedule(
  'enviar-avisos-agenda',
  '*/5 * * * *',
  $cron$
  select net.http_post(
    url := 'https://acyalywhavrxvpgmjuhy.supabase.co/functions/v1/enviar-avisos',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    ),
    body := '{}'::jsonb
  );
  $cron$
);
