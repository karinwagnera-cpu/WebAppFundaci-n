// One-off seed script: pushes SEED_REGISTROS / SEED_CAMPANAS into Supabase.
// Run with: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/seed-supabase.mjs
import { SEED_REGISTROS } from '../src/data/registros.ts';
import { SEED_CAMPANAS } from '../src/data/campanas.ts';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error('Falta SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');

const registrosRows = SEED_REGISTROS.map((r) => ({
  id: r.id,
  fecha: r.fecha,
  tipo: r.tipo,
  eje: r.eje,
  eje_secundario: r.ejeSecundario ?? null,
  unidad: r.unidad,
  beneficiario: r.beneficiario,
  aporte: r.aporte ?? null,
  motivo: r.motivo ?? null,
  costo: r.costo ?? null,
  contacto: r.contacto ?? null,
  constancia: r.constancia ?? null,
  observaciones: r.observaciones ?? null,
  difusion: r.difusion ?? null,
  horas: r.horas ?? null,
  inversion: r.inversion ?? null,
  fotos_count: r.fotosCount ?? 0,
  tiene_fotos: r.tieneFotos ?? false,
  constancia_count: r.constanciaCount ?? 0,
  tiene_constancia: r.tieneConstancia ?? false,
}));

const campanasRows = SEED_CAMPANAS.map((c) => ({
  id: c.id,
  nombre: c.nombre,
  descripcion: c.desc ?? null,
  eje: c.eje,
  estado: c.estado,
  inicio: c.inicio,
  fin: c.fin,
  meta_benef: c.metaBenef,
  benef: c.benef,
  meta_acc: c.metaAcc,
  acc: c.acc,
}));

async function upsert(table, rows) {
  const res = await fetch(`${url}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) throw new Error(`${table}: ${res.status} ${await res.text()}`);
  console.log(`${table}: ${rows.length} filas insertadas/actualizadas`);
}

await upsert('registros', registrosRows);
await upsert('campanas', campanasRows);
