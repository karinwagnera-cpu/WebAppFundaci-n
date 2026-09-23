import { useRef } from 'react';
import type { Tema } from '../types';
import Icon from '../components/Icon';
import { descargarPlantillaExcel } from '../lib/excelImport';

interface Props {
  tema: Tema;
  onTema: () => void;
  onExportarCsv: () => void;
  onImportarExcel: (file: File) => void;
  totalRegistros: number;
  puedeEditar: boolean;
}

const VERSION = '1.0.0';

export default function Configuracion({ tema, onTema, onExportarCsv, onImportarExcel, totalRegistros, puedeEditar }: Props) {
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
