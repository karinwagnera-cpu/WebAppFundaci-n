import { useState } from 'react';
import type { Campania, CampaniaForm } from '../types';
import { EJES, ESTADOS_CAMPANIA, ESTADO_LABEL } from '../lib/constants';
import { tituloEje } from '../lib/format';

interface Props {
  campania: Campania | null;
  onGuardar: (form: CampaniaForm) => void | Promise<void>;
  onEliminar: (id: number) => void;
  onCerrar: () => void;
}

const vacio = (c: Campania | null): CampaniaForm => ({
  editingId: c ? c.id : null,
  nombre: c?.nombre ?? '',
  desc: c?.desc ?? '',
  eje: c?.eje ?? EJES[0],
  estado: c?.estado ?? 'planificada',
  inicio: c?.inicio ?? '',
  fin: c?.fin ?? '',
  metaBenef: c ? String(c.metaBenef) : '',
  benef: c ? String(c.benef) : '',
  metaAcc: c ? String(c.metaAcc) : '',
  acc: c ? String(c.acc) : '',
});

export default function CampaniaModal({ campania, onGuardar, onEliminar, onCerrar }: Props) {
  const [form, setForm] = useState<CampaniaForm>(() => vacio(campania));
  const [guardando, setGuardando] = useState(false);
  const set = <K extends keyof CampaniaForm>(key: K, value: CampaniaForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    try { await onGuardar(form); } finally { setGuardando(false); }
  };

  return (
    <div className="modal-backdrop show" onClick={(e) => { if (e.target === e.currentTarget) onCerrar(); }}>
      <div className="modal">
        <h2>{form.editingId ? 'Editar campaña' : 'Nueva campaña'}</h2>
        <div className="modal-sub">Las campañas se cargan aparte, no están vinculadas a registros individuales.</div>
        <form onSubmit={enviar}>
          <div className="form-section-title">Datos generales</div>
          <div className="ux-grid">
            <div className="field c8">
              <label htmlFor="cpNombre">Nombre *</label>
              <input id="cpNombre" type="text" value={form.nombre} onChange={(e) => set('nombre', e.target.value)} />
            </div>
            <div className="field c4">
              <label htmlFor="cpEstado">Estado</label>
              <select id="cpEstado" value={form.estado} onChange={(e) => set('estado', e.target.value as CampaniaForm['estado'])}>
                {ESTADOS_CAMPANIA.map((e) => <option key={e} value={e}>{ESTADO_LABEL[e]}</option>)}
              </select>
            </div>
            <div className="field c12">
              <label htmlFor="cpDesc">Descripción / objetivo</label>
              <textarea id="cpDesc" rows={2} value={form.desc} onChange={(e) => set('desc', e.target.value)} />
            </div>
            <div className="field c6">
              <label htmlFor="cpEje">Eje estratégico</label>
              <select id="cpEje" value={form.eje} onChange={(e) => set('eje', e.target.value)}>
                {EJES.map((e) => <option key={e} value={e}>{tituloEje(e)}</option>)}
              </select>
            </div>
            <div className="field c3">
              <label htmlFor="cpInicio">Inicio</label>
              <input id="cpInicio" type="date" value={form.inicio} onChange={(e) => set('inicio', e.target.value)} />
            </div>
            <div className="field c3">
              <label htmlFor="cpFin">Fin</label>
              <input id="cpFin" type="date" value={form.fin} onChange={(e) => set('fin', e.target.value)} />
            </div>
          </div>

          <div className="form-section-title">Metas y avance</div>
          <div className="ux-grid">
            <div className="field c3">
              <label htmlFor="cpMetaBenef">Meta de beneficiarios</label>
              <input id="cpMetaBenef" type="number" min={0} value={form.metaBenef} onChange={(e) => set('metaBenef', e.target.value)} />
            </div>
            <div className="field c3">
              <label htmlFor="cpBenef">Beneficiarios alcanzados</label>
              <input id="cpBenef" type="number" min={0} value={form.benef} onChange={(e) => set('benef', e.target.value)} />
            </div>
            <div className="field c3">
              <label htmlFor="cpMetaAcc">Meta de acciones</label>
              <input id="cpMetaAcc" type="number" min={0} value={form.metaAcc} onChange={(e) => set('metaAcc', e.target.value)} />
            </div>
            <div className="field c3">
              <label htmlFor="cpAcc">Acciones realizadas</label>
              <input id="cpAcc" type="number" min={0} value={form.acc} onChange={(e) => set('acc', e.target.value)} />
            </div>
          </div>

          <div className="modal-actions">
            {form.editingId && (
              <button type="button" className="btn danger" style={{ marginRight: 'auto' }} onClick={() => onEliminar(form.editingId!)}>
                Eliminar campaña
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
