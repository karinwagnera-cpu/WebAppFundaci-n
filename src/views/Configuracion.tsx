import { useRef, useState } from 'react';
import type { MiembroDirectorio, Tema } from '../types';
import Icon from '../components/Icon';
import { descargarPlantillaExcel } from '../lib/excelImport';

interface Props {
  tema: Tema;
  onTema: () => void;
  onExportarCsv: () => void;
  onImportarExcel: (file: File) => void;
  totalRegistros: number;
  puedeEditar: boolean;
  directorio: MiembroDirectorio[];
  onAgregarMiembro: (m: Omit<MiembroDirectorio, 'id'>) => Promise<boolean>;
  onBorrarMiembro: (id: number) => void;
}

const VERSION = '1.0.0';

export default function Configuracion({ tema, onTema, onExportarCsv, onImportarExcel, totalRegistros, puedeEditar, directorio, onAgregarMiembro, onBorrarMiembro }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <section className="view active">
      <div className="settings-grid">
        <div className="panel settings-card">
          <h3>Apariencia</h3>
          <div className="settings-row">
            <div>
              <div className="settings-label">Tema</div>
              <div className="settings-hint">Cambiá entre modo claro y oscuro.</div>
            </div>
            <button className="btn secondary" onClick={onTema}>
              <Icon name={tema === 'dark' ? 'moon' : 'sun'} /> {tema === 'dark' ? 'Oscuro' : 'Claro'}
            </button>
          </div>
        </div>

        <div className="panel settings-card">
          <h3>Datos</h3>
          <div className="settings-row">
            <div>
              <div className="settings-label">Exportar registros a CSV</div>
              <div className="settings-hint">Descarga todos los registros cargados (sin filtrar) en formato CSV.</div>
            </div>
            <button className="btn secondary" onClick={onExportarCsv}>
              <Icon name="download" /> Exportar CSV
            </button>
          </div>
          {puedeEditar && (
            <div className="settings-row">
              <div>
                <div className="settings-label">Importar registros desde Excel</div>
                <div className="settings-hint">
                  Cargá varios registros de una sola vez con la plantilla (mismas columnas que pide el formulario de alta).
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button className="btn secondary" onClick={descargarPlantillaExcel}>
                  <Icon name="download" /> Descargar plantilla
                </button>
                <button className="btn secondary" onClick={() => inputRef.current?.click()}>
                  <Icon name="upload" /> Importar Excel
                </button>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onImportarExcel(file);
                    e.target.value = '';
                  }}
                />
              </div>
            </div>
          )}
          <div className="settings-row">
            <div>
              <div className="settings-label">Almacenamiento</div>
              <div className="settings-hint">{totalRegistros} registros guardados. Usá "Descargar copia de seguridad" en el menú de perfil para respaldar todo.</div>
            </div>
          </div>
        </div>

        {puedeEditar && (
          <DirectorioCard directorio={directorio} onAgregar={onAgregarMiembro} onBorrar={onBorrarMiembro} />
        )}

        <div className="panel settings-card">
          <h3>Acerca de</h3>
          <div className="settings-row">
            <div>
              <div className="settings-label">Panel de gestión · Fundación Huentala</div>
              <div className="settings-hint">Versión {VERSION} · React 19 + TypeScript + Vite</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

interface DirectorioProps {
  directorio: MiembroDirectorio[];
  onAgregar: (m: Omit<MiembroDirectorio, 'id'>) => Promise<boolean>;
  onBorrar: (id: number) => void;
}

function DirectorioCard({ directorio, onAgregar, onBorrar }: DirectorioProps) {
  const [nuevo, setNuevo] = useState({ nombre: '', email: '', cargo: '' });
  const [guardando, setGuardando] = useState(false);

  const agregar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    try {
      if (await onAgregar({ nombre: nuevo.nombre.trim(), email: nuevo.email.trim().toLowerCase(), cargo: nuevo.cargo.trim() })) {
        setNuevo({ nombre: '', email: '', cargo: '' });
      }
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="panel settings-card">
      <h3>Directorio</h3>
      <div className="settings-hint" style={{ maxWidth: 'none', marginBottom: 12 }}>
        Miembros que pueden recibir avisos de la agenda aunque no usen el panel. Los usuarios de la plataforma ya aparecen solos al invitar.
      </div>
      {directorio.length > 0 && (
        <ul className="dir-list">
          {directorio.map((m) => (
            <li key={m.id}>
              <span className="dir-avatar">{m.nombre.charAt(0).toUpperCase()}</span>
              <span className="dir-text">
                <span className="dir-nombre">{m.nombre}{m.cargo && <small> · {m.cargo}</small>}</span>
                <span className="dir-mail">{m.email}</span>
              </span>
              <button className="icon-btn" onClick={() => onBorrar(m.id)} aria-label={`Quitar a ${m.nombre}`} title="Quitar"><Icon name="trash" /></button>
            </li>
          ))}
        </ul>
      )}
      <form className="dir-form" onSubmit={agregar}>
        <input type="text" placeholder="Nombre *" value={nuevo.nombre} onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })} aria-label="Nombre" />
        <input type="email" placeholder="Mail *" value={nuevo.email} onChange={(e) => setNuevo({ ...nuevo, email: e.target.value })} aria-label="Mail" />
        <input type="text" placeholder="Cargo" value={nuevo.cargo} onChange={(e) => setNuevo({ ...nuevo, cargo: e.target.value })} aria-label="Cargo" />
        <button type="submit" className="btn secondary" disabled={guardando}><Icon name="plus" /> Agregar</button>
      </form>
    </div>
  );
}
