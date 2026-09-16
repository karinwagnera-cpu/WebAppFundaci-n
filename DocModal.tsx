import { useState } from 'react';
import type { DocForm } from '../types';
import { DOC_CATEGORIAS } from '../lib/constants';
import { leerArchivo } from '../lib/storage';

interface Props {
  onGuardar: (form: DocForm) => void;
  onCerrar: () => void;
}

export default function DocModal({ onGuardar, onCerrar }: Props) {
  const [form, setForm] = useState<DocForm>({
    nombre: '', categoria: DOC_CATEGORIAS[0], fecha: new Date().toISOString().slice(0, 10), notas: '', file: null,
  });

  const elegir = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    try {
      const adj = await leerArchivo(file);
      setForm((f) => ({ ...f, file: adj, nombre: f.nombre || file.name.replace(/\.[^.]+$/, '') }));
    } catch {
      alert('No se pudo cargar el archivo. Probá con otro formato o un archivo más liviano.');
    }
  };

  return (
    <div className="modal-backdrop show" onClick={(e) => { if (e.target === e.currentTarget) onCerrar(); }}>
      <div className="modal" style={{ maxWidth: 520 }}>
        <h2>Subir documento</h2>
        <div className="modal-sub">Documentación interna, legal o institucional de la Fundación.</div>
        <form onSubmit={(e) => { e.preventDefault(); onGuardar(form); }}>
          <div className="form-grid">
            <div className="field full">
              <label htmlFor="docArchivo">Archivo *</label>
              <input
                id="docArchivo" type="file" required
                accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
                onChange={(e) => elegir(e.target.files)}
              />
            </div>
            <div className="field full">
              <label htmlFor="docNombre">Nombre del documento *</label>
              <input id="docNombre" type="text" required value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} />
            </div>
            <div className="field">
              <label htmlFor="docCategoria">Categoría *</label>
              <select id="docCategoria" value={form.categoria} onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))}>
                {DOC_CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="docFecha">Fecha</label>
              <input id="docFecha" type="date" value={form.fecha} onChange={(e) => setForm((f) => ({ ...f, fecha: e.target.value }))} />
            </div>
            <div className="field full">
              <label htmlFor="docNotas">Notas</label>
              <textarea id="docNotas" rows={2} value={form.notas} onChange={(e) => setForm((f) => ({ ...f, notas: e.target.value }))} />
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn secondary" onClick={onCerrar}>Cancelar</button>
            <button type="submit" className="btn">Subir</button>
          </div>
        </form>
      </div>
    </div>
  );
}
