// Edge Function: manda los avisos por mail de la agenda.
// La llama pg_cron cada 5 minutos (ver supabase/migrations/20261017_avisos_mail.sql).
//
// Secretos que hay que cargar en Supabase (Edge Functions → Secrets):
//   RESEND_API_KEY  clave de Resend
//   CRON_SECRET     mismo valor que el secreto `cron_secret` de Vault
//   RESEND_FROM     (opcional) remitente; por defecto onboarding@resend.dev
//   APP_URL         (opcional) link al panel en el mail

import { createClient } from 'npm:@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const RESEND_FROM = Deno.env.get('RESEND_FROM') ?? 'Fundación Huentala <onboarding@resend.dev>';
const CRON_SECRET = Deno.env.get('CRON_SECRET') ?? '';
const APP_URL = Deno.env.get('APP_URL') ?? 'https://webappfundaci-n.karinwagnera.workers.dev/';
const ZONA = 'America/Argentina/Buenos_Aires';

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

interface Aviso {
  evento_id: number;
  titulo: string;
  descripcion: string | null;
  ubicacion: string | null;
  todo_el_dia: boolean;
  inicio: string;
  fin: string;
  email: string;
  minutos: number;
}

const escapar = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const soloFecha = (iso: string) =>
  new Date(iso).toLocaleDateString('es-AR', { timeZone: ZONA, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

const soloHora = (iso: string) =>
  new Date(iso).toLocaleTimeString('es-AR', { timeZone: ZONA, hour: '2-digit', minute: '2-digit' });

function cuando(a: Aviso): string {
  if (a.todo_el_dia) {
    // En eventos de todo el día `fin` es exclusivo: el último día es el anterior.
    const ultimo = new Date(new Date(a.fin).getTime() - 1);
    const primero = soloFecha(a.inicio);
    return soloFecha(ultimo.toISOString()) === primero ? `${primero} · Todo el día` : `${primero} al ${soloFecha(ultimo.toISOString())}`;
  }
  return `${soloFecha(a.inicio)} · ${soloHora(a.inicio)} a ${soloHora(a.fin)}`;
}

// "Ahora", "En 30 min", "En 2 h", "Mañana", "En 3 días"
function falta(min: number): string {
  if (min === 0) return 'Ahora';
  if (min < 60) return `En ${min} min`;
  if (min < 1440) return `En ${min / 60} h`;
  if (min === 1440) return 'Mañana';
  return `En ${min / 1440} días`;
}

const asunto = (a: Aviso) => `${falta(a.minutos)}: ${a.titulo}`;

function html(a: Aviso): string {
  const filas = [
    ['Cuándo', cuando(a)],
    a.ubicacion ? ['Lugar', a.ubicacion] : null,
    a.descripcion ? ['Detalle', a.descripcion] : null,
  ].filter(Boolean) as string[][];

  const cuerpo = filas
    .map(([k, v]) => `<tr><td style="padding:6px 0;color:#9C8F7C;font-size:13px;width:90px;vertical-align:top">${k}</td><td style="padding:6px 0;font-size:14px;color:#221C17">${escapar(v).replace(/\n/g, '<br>')}</td></tr>`)
    .join('');

  return `<!doctype html><html><body style="margin:0;background:#F4F0E9;font-family:Segoe UI,Helvetica,Arial,sans-serif">
<div style="max-width:520px;margin:24px auto;background:#fff;border-radius:14px;border:1px solid #ECE4D6;overflow:hidden">
  <div style="background:#6E1F32;color:#fff;padding:14px 22px;font-size:13px;letter-spacing:.04em">FUNDACIÓN HUENTALA · AGENDA</div>
  <div style="padding:22px">
    <div style="font-size:12px;color:#6E1F32;font-weight:700;text-transform:uppercase">${escapar(falta(a.minutos))}</div>
    <h1 style="font-size:20px;margin:6px 0 16px;color:#221C17">${escapar(a.titulo)}</h1>
    <table style="border-collapse:collapse;width:100%">${cuerpo}</table>
    <div style="margin-top:22px"><a href="${APP_URL}" style="background:#6E1F32;color:#fff;text-decoration:none;padding:10px 18px;border-radius:9px;font-size:13px;font-weight:700">Abrir la agenda</a></div>
  </div>
</div>
<div style="text-align:center;font-size:11px;color:#9C8F7C;padding:0 0 18px">Recibís este aviso porque fuiste invitado a un evento de la Fundación Huentala.</div>
</body></html>`;
}

async function enviarMail(a: Aviso): Promise<{ ok: true } | { ok: false; error: string }> {
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: RESEND_FROM, to: [a.email], subject: asunto(a), html: html(a) }),
  });
  if (r.ok) return { ok: true };
  return { ok: false, error: `${r.status} ${await r.text()}` };
}

Deno.serve(async (req) => {
  if (!CRON_SECRET || req.headers.get('x-cron-secret') !== CRON_SECRET) {
    return new Response('no autorizado', { status: 401 });
  }
  if (!RESEND_API_KEY) {
    return new Response('falta el secreto RESEND_API_KEY', { status: 500 });
  }

  const { data, error } = await supabase.rpc('avisos_pendientes');
  if (error) return Response.json({ error: error.message }, { status: 500 });

  const pendientes = (data ?? []) as Aviso[];
  let enviados = 0;
  const fallos: string[] = [];

  for (const a of pendientes) {
    const res = await enviarMail(a);
    if (!res.ok) {
      // No se registra como enviado: se reintenta en el próximo ciclo.
      fallos.push(`${a.email} (${a.titulo}): ${res.error}`);
      continue;
    }
    const { error: errIns } = await supabase.from('avisos_enviados').insert({
      evento_id: a.evento_id, inicio: a.inicio, email: a.email, minutos: a.minutos,
    });
    if (errIns) fallos.push(`registro de ${a.email}: ${errIns.message}`);
    enviados++;
  }

  return Response.json({ pendientes: pendientes.length, enviados, fallos });
});
