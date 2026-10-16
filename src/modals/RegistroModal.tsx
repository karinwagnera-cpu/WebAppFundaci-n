import { useState } from 'react';
import type { Aporte, AporteForm, Registro, RegistroForm } from '../types';
import { EJES, ESTADOS_ACCION, ESTADO_ACCION_LABEL, TIPOS, UNIDADES, normalizarEstadoAccion } from '../lib/constants';
import { fmtMoney, humanSize, tituloEje } from '../lib/format';
import { aportesDe } from '../lib/aportes';
import { subirAdjunto } from '../lib/storage';
import { notificar } from '../lib/notificaciones';
import Icon from '../components/Icon';

interface Props {
  registro: Registro | null;
  fechaInicial?: string;
  onGuardar: (form: RegistroForm) => void | Promise<void>;
  onEliminar: (id: number) => void;
  onCerrar: () => void;
}

const txt = (n: number | null | undefined) => (n !== null && n !== undefined ? String(n) : '');

const aporteVacio = (): AporteForm => ({
  unidad: UNIDADES[0], tipo: TIPOS[0], descripcion: '', costo: '', inversion: '', horas: '', numeroCertificado: '', numeroFactura: '',
});

const aporteAForm = (a: Aporte): AporteForm => ({
  unidad: a.unidad || UNIDADES[0],
  tipo: a.tipo || TIPOS[0],
  descripcion: a.descripcion ?? '',
  costo: txt(a.costo),
  inversion: txt(a.inversion),
  horas: txt(a.horas),
  numeroCertificado: a.numeroCertificado ?? '',
  numeroFactura: a.numeroFactura ?? '',
});

const vacio = (r: Registro | null, fechaInicial?: string): RegistroForm => {
  const fecha = r?.fecha ?? fechaInicial ?? '';
  const hoyISO = new Date().toISOString().slice(0, 10);
  const { aportes, repartidos } = r ? aportesDe(r) : { aportes: [], repartidos: false };
  return {
    editingId: r ? r.id : null,
    fecha,
    eje: r?.eje ?? EJES[0],
    ejeSecundario: r?.ejeSecundario ?? '',
    beneficiario: r?.beneficiario ?? '',
    motivo: r?.motivo ?? '',
    contacto: r?.contacto ?? '',
    observaciones: r?.observaciones ?? '',
    aportes: aportes.length ? aportes.map(aporteAForm) : [aporteVacio()],
    aportesRepartidos: repartidos,
    estado: r ? normalizarEstadoAccion(r.estado) : (fecha > hoyISO ? 'planificada' : 'realizada'),
    fotos: r?.fotos ?? [],
    consts: r?.consts ?? [],
  };
};

export default function RegistroModal({ registro, fechaInicial, onGuardar, onEliminar, onCerrar }: Props) {
  const [form, setForm] = useState<RegistroForm>(() => vacio(registro, fechaInicial));
  const [subiendo, setSubiendo] = useState<'fotos' | 'consts' | null>(null);
  const [guardando, setGuardando] = useState(false);
  const set = <K extends keyof RegistroForm>(key: K, value: RegistroForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    try { await onGuardar(form); } finally { setGuardando(false); }
  };

  const agregar = async (key: 'fotos' | 'consts', files: FileList | null) => {
    if (!files || !files.length) return;
    setSubiendo(key);
    const errores: string[] = [];
    for (const file of Array.from(files)) {
      try {
        const subido = await subirAdjunto(file, key);
        setForm((f) => ({ ...f, [key]: [...f[key], subido] }));
      } catch (err) {
        errores.push(err instanceof Error ? err.message : `No se pudo subir "${file.name}".`);
      }
    }
    setSubiendo(null);
    if (errores.length) notificar(errores.join('\n'));
  };
  const quitar = (key: 'fotos' | 'consts', idx: number) =>
    setForm((f) => ({ ...f, [key]: f[key].filter((_, i) => i !== idx) }));

  const setAporte = <K extends keyof AporteForm>(idx: number, key: K, value: AporteForm[K]) =>
    setForm((f) => ({ ...f, aportes: f.aportes.map((a, i) => (i === idx ? { ...a, [key]: value } : a)) }));
  const agregarAporte = () =>
    setForm((f) => {
      // El nuevo renglón arranca con el mismo tipo que el anterior: suele repetirse.
      const previo = f.aportes[f.aportes.length - 1];
      return { ...f, aportes: [...f.aportes, { ...aporteVacio(), tipo: previo?.tipo || TIPOS[0] }] };
    });
  const quitarAporte = (idx: number) =>
    setForm((f) => ({ ...f, aportes: f.aportes.filter((_, i) => i !== idx) }));

  /** Las visitas / site suelen implicar 2 hs; nunca pisa un valor cargado. */
  const sugerirHoras = (idx: number) => {
    const a = form.aportes[idx];
    if (a && /visita|site/i.test(a.descripcion) && a.horas === '') setAporte(idx, 'horas', '2');
  };

  const suma = (key: 'costo' | 'inversion' | 'horas') =>
    form.aportes.reduce((s, a) => s + (Number(a[key]) || 0), 0);
  const opciones = (lista: readonly string[], actual: string) =>
    (lista.includes(actual) || !actual ? lista : [actual, ...lista]).map((v) => <option key={v} value={v}>{v}</option>);

  const chips = (key: 'fotos' | 'consts') => (
    <div className="attach-list">
      {form[key].map((a, i) => (
        <span key={i} className="attach-chip">
          {a.type.startsWith('image/')
            ? <img className="thumb" src={a.url} alt="" />
            : <span className="thumb doc"><Icon name="file" size={16} /></span>}
          <span className="meta">
            <span className="fname">{a.name}</span>
            <span className="fsize">{humanSize(a.size)}</span>
          </span>
          <button type="button" onClick={() => quitar(key, i)} aria-label="Quitar">✕</button>
        </span>
      ))}
    </div>
  );

  return (
    <div className="modal-backdrop show" onClick={(e) => { if (e.target === e.currentTarget) onCerrar(); }}>
      <div className="modal">
        <h2>{form.editingId ? 'Editar registro' : 'Nuevo registro'}</h2>
        <div className="modal-sub">Completá los campos según el diccionario de datos de la Fundación.</div>
        <form onSubmit={enviar}>
          <div className="form-section-title">Datos de la acción</div>
          <div className="ux-grid">
            <div className="field c3">
              <label htmlFor="fdFecha">Fecha *</label>
              <input id="fdFecha" type="date" value={form.fecha} onChange={(e) => set('fecha', e.target.value)} />
            </div>
            <div className="field c3">
              <label htmlFor="fdEstado">Estado</label>
              <select id="fdEstado" value={form.estado} onChange={(e) => set('estado', e.target.value as typeof form.estado)}>
                {ESTADOS_ACCION.map((e) => <option key={e} value={e}>{ESTADO_ACCION_LABEL[e]}</option>)}
              </select>
              <div className="hint">Planificada: todavía no sucedió.</div>
            </div>
            <div className="field c6">
              <label htmlFor="fdBeneficiario">Beneficiario / Institución *</label>
              <input
                id="fdBeneficiario" type="text" value={form.beneficiario}
                onChange={(e) => set('beneficiario', e.target.value)}
                placeholder="Usá siempre el mismo nombre para la misma institución"
              />
            </div>
            <div className="field c6">
              <label htmlFor="fdEje">Eje estratégico principal *</label>
              <select
                id="fdEje" value={form.eje}
                onChange={(e) => {
                  const nuevo = e.target.value;
                  setForm((f) => ({ ...f, eje: nuevo, ejeSecundario: f.ejeSecundario === nuevo ? '' : f.ejeSecundario }));
                }}
              >
                {EJES.map((e) => <option key={e} value={e}>{tituloEje(e)}</option>)}
              </select>
            </div>
            <div className="field c6">
              <label htmlFor="fdEjeSec">Eje estratégico secundario</label>
              <select id="fdEjeSec" value={form.ejeSecundario} onChange={(e) => set('ejeSecundario', e.target.value)}>
                <option value="">Sin eje secundario</option>
                {EJES.filter((e) => e !== form.eje).map((e) => <option key={e} value={e}>{tituloEje(e)}</option>)}
              </select>
              <div className="hint">Opcional, para acciones que cruzan más de un eje.</div>
            </div>
            <div className="field c12">
              <label htmlFor="fdMotivo">Descripción</label>
              <textarea id="fdMotivo" rows={2} value={form.motivo} onChange={(e) => set('motivo', e.target.value)} />
            </div>
          </div>

          <div className="form-section-title">Aportes</div>
          <div className="hint" style={{ marginBottom: 10 }}>
            Cargá un renglón por cada donación o unidad de negocio que participó en la acción.
          </div>
          {form.aportesRepartidos && (
            <div className="aporte-aviso">
              Este registro nombraba varias unidades con un solo monto: se repartió en partes iguales. Ajustá los montos si no fue así.
            </div>
          )}
          {form.aportes.map((a, i) => (
            <div key={i} className="aporte-card">
              <div className="aporte-head">
                <span>Aporte {i + 1}</span>
                {form.aportes.length > 1 && (
                  <button type="button" className="aporte-quitar" onClick={() => quitarAporte(i)}>Quitar</button>
                )}
              </div>
              <div className="ux-grid">
                <div className="field c4">
                  <label htmlFor={`apUnidad${i}`}>Unidad de negocio *</label>
                  <select id={`apUnidad${i}`} value={a.unidad} onChange={(e) => setAporte(i, 'unidad', e.target.value)}>
                    {opciones(UNIDADES, a.unidad)}
                  </select>
                </div>
                <div className="field c4">
                  <label htmlFor={`apTipo${i}`}>Tipo de movimiento *</label>
                  <select id={`apTipo${i}`} value={a.tipo} onChange={(e) => setAporte(i, 'tipo', e.target.value)}>
                    {opciones(TIPOS, a.tipo)}
                  </select>
                </div>
                <div className="field c4">
                  <label htmlFor={`apDesc${i}`}>Donación o aporte</label>
                  <input
                    id={`apDesc${i}`} type="text" value={a.descripcion} placeholder="Ej.: 40 desayunos"
                    onChange={(e) => setAporte(i, 'descripcion', e.target.value)} onBlur={() => sugerirHoras(i)}
                  />
                </div>
                <div className="field c3">
                  <label htmlFor={`apCosto${i}`}>Costo interno (ARS)</label>
                  <input id={`apCosto${i}`} type="number" min={0} step={0.01} value={a.costo} onChange={(e) => setAporte(i, 'costo', e.target.value)} />
                </div>
                <div className="field c3">
                  <label htmlFor={`apInv${i}`}>Inversión (ARS)</label>
                  <input id={`apInv${i}`} type="number" min={0} step={0.01} value={a.inversion} onChange={(e) => setAporte(i, 'inversion', e.target.value)} />
                </div>
                <div className="field c2">
                  <label htmlFor={`apHoras${i}`}>Horas</label>
                  <input id={`apHoras${i}`} type="number" min={0} step={0.5} value={a.horas} onChange={(e) => setAporte(i, 'horas', e.target.value)} />
                </div>
                <div className="field c2">
                  <label htmlFor={`apCert${i}`}>N° certificado</label>
                  <input id={`apCert${i}`} type="text" value={a.numeroCertificado} onChange={(e) => setAporte(i, 'numeroCertificado', e.target.value)} />
                </div>
                <div className="field c2">
                  <label htmlFor={`apFact${i}`}>N° factura</label>
                  <input id={`apFact${i}`} type="text" value={a.numeroFactura} onChange={(e) => setAporte(i, 'numeroFactura', e.target.value)} />
                </div>
              </div>
            </div>
          ))}
          <div className="aporte-pie">
            <button type="button" className="btn secondary small" onClick={agregarAporte}>
              <Icon name="plus" /> Agregar aporte
            </button>
            <div className="aporte-total">
              Total: <strong>{fmtMoney(suma('costo'))}</strong> costo · <strong>{fmtMoney(suma('inversion'))}</strong> inversión · <strong>{suma('horas')}</strong> hs
            </div>
          </div>
          <div className="hint" style={{ marginTop: 6 }}>
            Costo interno: lo que le cuesta a la Fundación producir/aportar lo donado. Inversión: valor de mercado. Las visitas / site suelen ser 2 hs.
          </div>

          <div className="form-section-title">Seguimiento</div>
          <div className="ux-grid">
            <div className="field c4">
              <label htmlFor="fdContacto">Contacto</label>
              <input id="fdContacto" type="text" value={form.contacto} onChange={(e) => set('contacto', e.target.value)} />
            </div>
            <div className="field c8">
              <label htmlFor="fdObs">Observaciones</label>
              <input id="fdObs" type="text" value={form.observaciones} onChange={(e) => set('observaciones', e.target.value)} />
            </div>
          </div>

          <div className="form-section-title">Documentación adjunta</div>
          <div className="ux-grid">
            <div className="attach-section c6">
              <label className="attach-label">Registro fotográfico / flyers</label>
              <div className="hint" style={{ marginBottom: 8 }}>Fotos de la acción, del evento o material de difusión.</div>
              {chips('fotos')}
              <label className={'btn secondary small attach-btn' + (subiendo === 'fotos' ? ' disabled' : '')}>
                <Icon name="upload" /> {subiendo === 'fotos' ? 'Subiendo…' : 'Agregar imagen'}
                <input type="file" accept="image/*" multiple disabled={!!subiendo} onChange={(e) => agregar('fotos', e.target.files)} />
              </label>
            </div>
            <div className="attach-section c6">
              <label className="attach-label">Constancia de donación firmada</label>
              <div className="hint" style={{ marginBottom: 8 }}>Documento firmado por Fundación y beneficiario (imagen o PDF).</div>
              {chips('consts')}
              <label className={'btn secondary small attach-btn' + (subiendo === 'consts' ? ' disabled' : '')}>
                <Icon name="upload" /> {subiendo === 'consts' ? 'Subiendo…' : 'Agregar constancia'}
                <input type="file" accept="image/*,application/pdf" multiple disabled={!!subiendo} onChange={(e) => agregar('consts', e.target.files)} />
              </label>
            </div>
          </div>

          <div className="modal-actions">
            {form.editingId && (
              <button type="button" className="btn danger" style={{ marginRight: 'auto' }} onClick={() => onEliminar(form.editingId!)}>
                Eliminar registro
              </button>
            )}
            <button type="button" className="btn secondary" onClick={onCerrar} disabled={guardando}>Cancelar</button>
            <button type="submit" className="btn" disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
