import { useCallback, useEffect, useMemo, useState } from 'react';
import type { DocForm, DocMeta, Filtro, Registro, RegistroForm, Rol, Tema, Vista } from './types';
import { SEED_REGISTROS } from './data/registros';
import {
  deleteAdjuntos, descargar, loadDocs, loadPrefs, loadRegistros,
  saveAdjuntos, saveDocs, savePrefs, saveRegistros,
} from './lib/storage';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import PerfilMenu from './components/PerfilMenu';
import Dashboard from './views/Dashboard';
import RegistroView from './views/Registro';
import Calendario from './views/Calendario';
import Informes from './views/Informes';
import Documentacion from './views/Documentacion';
import DetalleModal from './modals/DetalleModal';
import RegistroModal from './modals/RegistroModal';
import DocModal from './modals/DocModal';

const FILTRO_VACIO: Filtro = { y: '', m: '', e: '' };

const normalizar = (s: string | null | undefined): string =>
  (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();

export default function App() {
  const prefs = useMemo(() => loadPrefs(), []);
  const [vista, setVista] = useState<Vista>('dashboard');
  const [registros, setRegistros] = useState<Registro[]>(() => loadRegistros() ?? SEED_REGISTROS);
  const [docs, setDocs] = useState<DocMeta[]>(() => loadDocs());
  const [tema, setTema] = useState<Tema>(prefs.theme ?? 'light');
  const [rol, setRol] = useState<Rol>(prefs.role ?? 'admin');
  const [colapsada, setColapsada] = useState<boolean>(prefs.collapsed ?? false);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [perfilAbierto, setPerfilAbierto] = useState(false);
  const [guardado, setGuardado] = useState(false);

  const [fDash, setFDash] = useState<Filtro>(FILTRO_VACIO);
  const [fReg, setFReg] = useState<Filtro>(FILTRO_VACIO);
  const [fRep, setFRep] = useState<Filtro>(FILTRO_VACIO);
  const [busqueda, setBusqueda] = useState('');

  const [detalleId, setDetalleId] = useState<number | null>(null);
  const [editando, setEditando] = useState<{ registro: Registro | null } | null>(null);
  const [docModal, setDocModal] = useState(false);

  const puedeEditar = rol === 'admin';

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', tema);
    document.documentElement.setAttribute('data-role', rol);
    savePrefs({ theme: tema, role: rol, collapsed: colapsada });
  }, [tema, rol, colapsada]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setDetalleId(null);
      setEditando(null);
      setDocModal(false);
      setPerfilAbierto(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const avisarGuardado = useCallback(() => {
    setGuardado(true);
    const t = setTimeout(() => setGuardado(false), 1800);
    return () => clearTimeout(t);
  }, []);

  const persistirRegistros = useCallback((next: Registro[]) => {
    setRegistros(next);
    saveRegistros(next);
    avisarGuardado();
  }, [avisarGuardado]);

  const persistirDocs = useCallback((next: DocMeta[]) => {
    setDocs(next);
    saveDocs(next);
    avisarGuardado();
  }, [avisarGuardado]);

  const guardarRegistro = (form: RegistroForm) => {
    const faltan: string[] = [];
    if (!form.beneficiario.trim()) faltan.push('Beneficiario / Institución');
    if (!form.tipo) faltan.push('Tipo de movimiento');
    if (!form.eje) faltan.push('Eje estratégico');
    if (!form.unidad) faltan.push('Unidad de negocio');
    if (faltan.length) {
      alert('Faltan completar campos obligatorios:\n\n- ' + faltan.join('\n- '));
      return;
    }

    const errores: string[] = [];
    if (form.fecha) {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const d = new Date(form.fecha + 'T00:00:00');
      if (Number.isNaN(d.getTime())) errores.push('La fecha no es válida.');
      else {
        if (d > hoy) errores.push('La fecha no puede ser futura.');
        if (d.getFullYear() < 2014) errores.push('La fecha no puede ser anterior a 2014 (año de inicio de la Fundación).');
      }
    }
    if (form.costo !== '' && Number(form.costo) < 0) errores.push('El costo interno no puede ser negativo.');
    if (form.inversion !== '' && Number(form.inversion) < 0) errores.push('La inversión no puede ser negativa.');
    if (form.horas !== '' && Number(form.horas) < 0) errores.push('Las horas no pueden ser negativas.');
    if (errores.length) {
      alert('Revisá estos datos antes de guardar:\n\n- ' + errores.join('\n- '));
      return;
    }
    if (form.horas !== '' && Number(form.horas) > 1000 &&
        !confirm(`Cargaste ${form.horas} horas de voluntariado, ¿es correcto?`)) return;

    if (!form.editingId) {
      const objetivo = normalizar(form.beneficiario);
      const parecidos = registros.filter((r) => normalizar(r.beneficiario) && normalizar(r.beneficiario) === objetivo);
      if (parecidos.length) {
        const muestra = parecidos.slice(0, 3).map((r) => r.beneficiario + (r.fecha ? ` (${r.fecha})` : '')).join(', ');
        if (!confirm(`Ya hay ${parecidos.length} registro(s) con un beneficiario muy parecido a "${form.beneficiario}": ${muestra}. ¿Guardar igual?`)) return;
      }
    }

    const id = form.editingId ?? registros.reduce((m, r) => Math.max(m, r.id || 0), 0) + 1;
    const rec: Registro = {
      id,
      fecha: form.fecha || null,
      tipo: form.tipo,
      eje: form.eje,
      unidad: form.unidad,
      beneficiario: form.beneficiario.trim(),
      aporte: form.aporte.trim(),
      motivo: form.motivo.trim(),
      costo: form.costo !== '' ? Number(form.costo) : null,
      inversion: form.inversion !== '' ? Number(form.inversion) : null,
      horas: form.horas !== '' ? Number(form.horas) : null,
      contacto: form.contacto.trim(),
      observaciones: form.observaciones.trim(),
      fotosCount: form.fotos.length,
      tieneFotos: form.fotos.length > 0,
      constanciaCount: form.consts.length,
      tieneConstancia: form.consts.length > 0,
    };
    saveAdjuntos(id, { fotos: form.fotos, consts: form.consts });
    persistirRegistros(form.editingId ? registros.map((r) => (r.id === id ? rec : r)) : [...registros, rec]);
    setEditando(null);
  };

  const eliminarRegistro = (id: number) => {
    if (!confirm('Se eliminará este registro y su documentación adjunta. Esta acción no se puede deshacer.')) return;
    deleteAdjuntos(id);
    persistirRegistros(registros.filter((r) => r.id !== id));
    setEditando(null);
  };

  const guardarDoc = (form: DocForm) => {
    if (!form.file) { alert('Elegí un archivo antes de subir.'); return; }
    if (!form.nombre.trim()) { alert('Poné un nombre al documento.'); return; }
    const id = docs.reduce((m, d) => Math.max(m, d.id || 0), 0) + 1;
    persistirDocs([...docs, {
      id, nombre: form.nombre.trim(), categoria: form.categoria, fecha: form.fecha || null,
      notas: form.notas.trim(), tipo: form.file.type, size: form.file.size, data: form.file.data,
    }]);
    setDocModal(false);
  };

  const verDoc = (id: number) => {
    const d = docs.find((x) => x.id === id);
    if (!d) { alert('No se pudo recuperar el archivo.'); return; }
    const a = document.createElement('a');
    a.href = d.data;
    a.download = d.nombre;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const eliminarDoc = (id: number) => {
    if (!confirm('Se eliminará este documento. Esta acción no se puede deshacer.')) return;
    persistirDocs(docs.filter((d) => d.id !== id));
  };

  const backup = () => {
    descargar(
      new Blob([JSON.stringify({ _tipo: 'fundacion-huentala-backup', version: 2, exportadoEl: new Date().toISOString(), registros, docs })], { type: 'application/json' }),
      `fundacion-huentala-backup-${new Date().toISOString().slice(0, 10)}.json`
    );
    setPerfilAbierto(false);
  };

  const importar = (file: File) => {
    const rd = new FileReader();
    rd.onload = () => {
      try {
        const p = JSON.parse(String(rd.result)) as { registros?: Registro[]; docs?: DocMeta[] };
        if (!p.registros || !Array.isArray(p.registros)) throw new Error('formato');
        persistirRegistros(p.registros);
        if (Array.isArray(p.docs)) persistirDocs(p.docs);
        setPerfilAbierto(false);
      } catch {
        alert('El archivo no parece una copia de seguridad válida.');
      }
    };
    rd.readAsText(file);
  };

  const reiniciar = () => {
    if (!confirm(`Se descartan los cambios locales y se vuelve al histórico original (${SEED_REGISTROS.length} registros).`)) return;
    persistirRegistros(SEED_REGISTROS);
    setPerfilAbierto(false);
  };

  const irA = (v: Vista) => { setVista(v); setMenuAbierto(false); setPerfilAbierto(false); };
  const detalle = detalleId ? registros.find((r) => r.id === detalleId) ?? null : null;

  return (
    <div id="app" className={(colapsada ? 'collapsed' : '') + (menuAbierto ? ' sidebar-open' : '')}>
      <Sidebar
        vista={vista}
        onVista={irA}
        onCollapse={() => setColapsada((v) => !v)}
        onClose={() => setMenuAbierto(false)}
      />
      <div className="sidebar-backdrop" onClick={() => setMenuAbierto(false)} />

      <div className="main">
        <Navbar
          vista={vista}
          rol={rol}
          tema={tema}
          guardado={guardado}
          busqueda={busqueda}
          onBusqueda={(q) => { setBusqueda(q); setVista('registro'); }}
          onTema={() => setTema((t) => (t === 'dark' ? 'light' : 'dark'))}
          onMenu={() => setMenuAbierto(true)}
          onPerfil={() => setPerfilAbierto((v) => !v)}
        />

        {perfilAbierto && (
          <PerfilMenu rol={rol} onRol={setRol} onBackup={backup} onImportar={importar} onReset={reiniciar} />
        )}

        <div className="content">
          {vista === 'dashboard' && (
            <Dashboard registros={registros} filtro={fDash} onFiltro={setFDash} tema={tema} />
          )}
          {vista === 'registro' && (
            <RegistroView
              registros={registros}
              filtro={fReg}
              onFiltro={setFReg}
              busqueda={busqueda}
              onBusqueda={setBusqueda}
              puedeEditar={puedeEditar}
              onVer={setDetalleId}
              onEditar={(id) => setEditando({ registro: registros.find((r) => r.id === id) ?? null })}
              onNuevo={() => setEditando({ registro: null })}
            />
          )}
          {vista === 'calendario' && <Calendario registros={registros} onVer={setDetalleId} />}
          {vista === 'informes' && (
            <Informes registros={registros} filtro={fRep} onFiltro={setFRep} tema={tema} />
          )}
          {vista === 'documentacion' && (
            <Documentacion
              docs={docs}
              puedeEditar={puedeEditar}
              onNuevo={() => setDocModal(true)}
              onVer={verDoc}
              onEliminar={eliminarDoc}
            />
          )}

          <footer className="foot">
            <span>
              Fundación Huentala · datos guardados de forma privada en este dispositivo ·{' '}
              <span style={{ opacity: 0.6 }}>React 19 · {registros.length} registros</span>
            </span>
          </footer>
        </div>
      </div>

      {detalle && (
        <DetalleModal
          registro={detalle}
          puedeEditar={puedeEditar}
          onCerrar={() => setDetalleId(null)}
          onEditar={() => { setEditando({ registro: detalle }); setDetalleId(null); }}
        />
      )}
      {editando && puedeEditar && (
        <RegistroModal
          registro={editando.registro}
          onGuardar={guardarRegistro}
          onEliminar={eliminarRegistro}
          onCerrar={() => setEditando(null)}
        />
      )}
      {docModal && puedeEditar && <DocModal onGuardar={guardarDoc} onCerrar={() => setDocModal(false)} />}
    </div>
  );
}
