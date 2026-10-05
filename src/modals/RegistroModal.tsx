import { useState } from 'react';
import type { Registro, RegistroForm } from '../types';
import { EJES, ESTADOS_ACCION, ESTADO_ACCION_LABEL, TIPOS, UNIDADES, normalizarEstadoAccion } from '../lib/constants';
import { humanSize, parseUnidades, tituloEje } from '../lib/format';
import { subirAdjunto } from '../lib/storage';
import Icon from '../components/Icon';

interface Props {
  registro: Registro | null;
  fechaInicial?: string;
  onGuardar: (form: RegistroForm) => void;
  onEliminar: (id: number) => void;
  onCerrar: () => void;
}

const vacio = (r: Registro | null, fechaInicial?: string): RegistroForm => {
  const fecha = r?.fecha ?? fechaInicial ?? '';
  const hoyISO = new Date().toISOString().slice(0, 10);
  return {
    editingId: r ? r.id : null,
    fecha,
    tipo: r?.tipo ?? TIPOS[0],
    eje: r?.eje ?? EJES[0],
    ejeSecundario: r?.ejeSecundario ?? '',
    unidad: r ? (UNIDADES.includes(r.unidad as typeof UNIDADES[number]) ? r.unidad! : parseUnidades(r.unidad)[0]) : UNIDADES[0],
    beneficiario: r?.beneficiario ?? '',
    aporte: r?.aporte ?? '',
    motivo: r?.motivo ?? '',
    costo: r?.costo !== null && r?.costo !== undefined ? String(r.costo) : '',
    inversion: r?.inversion !== null && r?.inversion !== undefined ? String(r.inversion) : '',
    horas: r?.horas !== null && r?.horas !== undefined ? String(r.horas) : '',
    contacto: r?.contacto ?? '',
    observaciones: r?.observaciones ?? '',
    numeroCertificado: r?.numeroCertificado ?? '',
    numeroFactura: r?.numeroFactura ?? '',
    estado: r ? normalizarEstadoAccion(r.estado) : (fecha > hoyISO ? 'planificada' : 'realizada'),
    fotos: r?.fotos ?? [],
    consts: r?.consts ?? [],
  };
};

export default function RegistroModal({ registro, fechaInicial, onGuardar, onEliminar, onCerrar }: Props) {
  const [form, setForm] = useState<RegistroForm>(() => vacio(registro, fechaInicial));
  const [subiendo, setSubiendo] = useState<'fotos' | 'consts' | null>(null);
  const set = <K extends keyof RegistroForm>(key: K, value: RegistroForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

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
    if (errores.length) alert(errores.join('\n'));
  };
  const quitar = (key: 'fotos' | 'consts', idx: number) =>
    setForm((f) => ({ ...f, [key]: f[key].filter((_, i) => i !== idx) }));

  /** Las visitas / site suelen implicar 2 hs; nunca pisa un valor cargado. */
  const sugerirHoras = () => {
    if (/visita|site/i.test(form.aporte) && form.horas === '') set('horas', '2');
  };

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
        <form onSubmit={(e) => { e.preventDefault(); onGuardar(form); }}>
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
            <div className="field c3">
              <label htmlFor="fdTipo">Tipo de movimiento *</label>
              <select id="fdTipo" value={form.tipo} onChange={(e) => set('tipo', e.target.value)}>
                {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
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
            <div className="field c6">
              <label htmlFor="fdUnidad">Unidad de negocio *</label>
              <select id="fdUnidad" value={form.unidad} onChange={(e) => set('unidad', e.target.value)}>
                {UNIDADES.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div className="field c6">
              <label htmlFor="fdAporte">Donación o aporte</label>
              <input
                id="fdAporte" type="text" value={form.aporte}
                onChange={(e) => set('aporte', e.target.value)} onBlur={sugerirHoras}
              />
            </div>
            <div className="field c12">
              <label htmlFor="fdMotivo">Descripción</label>
              <textarea id="fdMotivo" rows={2} value={form.motivo} onChange={(e) => set('motivo', e.target.value)} />
            </div>
          </div>

          <div className="form-section-title">Valorización y voluntariado</div>
          <div className="ux-grid">
            <div className="field c4">
              <label htmlFor="fdCosto">Costo interno (ARS)</label>
              <input id="fdCosto" type="number" min={0} step={0.01} value={form.costo} onChange={(e) => set('costo', e.target.value)} />
              <div className="hint">Lo que le cuesta a la Fundación producir/aportar lo donado.</div>
            </div>
            <div className="field c4">
              <label htmlFor="fdInversion">Inversión (ARS)</label>
              <input id="fdInversion" type="number" min={0} step={0.01} value={form.inversion} onChange={(e) => set('inversion', e.target.value)} />
              <div className="hint">Valor de mercado de lo donado.</div>
            </div>
            <div className="field c4">
              <label htmlFor="fdHoras">Horas de voluntariado</label>
              <input id="fdHoras" type="number" min={0} step={0.5} value={form.horas} onChange={(e) => set('horas', e.target.value)} />
              <div className="hint">Las visitas / site suelen ser 2 hs.</div>
            </div>
          </div>

          <div className="form-section-title">Seguimiento</div>
          <div className="ux-grid">
            <div className="field c4">
              <label htmlFor="fdContacto">Contacto</label>
              <input id="fdContacto" type="text" value={form.contacto} onChange={(e) => set('contacto', e.target.value)} />
            </div>
            <div className="field c4">
              <label htmlFor="fdNumCert">N° de certificado</label>
              <input id="fdNumCert" type="text" value={form.numeroCertificado} onChange={(e) => set('numeroCertificado', e.target.value)} />
            </div>
            <div className="field c4">
              <label htmlFor="fdNumFact">N° de factura</label>
              <input id="fdNumFact" type="text" value={form.numeroFactura} onChange={(e) => set('numeroFactura', e.target.value)} />
            </div>
            <div className="field c12">
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
            <button type="button" className="btn secondary" onClick={onCerrar}>Cancelar</button>
            <button type="submit" className="btn">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  );
}
