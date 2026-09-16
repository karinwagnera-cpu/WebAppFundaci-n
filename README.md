# Fundación Huentala — Panel de gestión (React 19 + TypeScript)

Port del panel `index.html` original a React 19 + TypeScript + Vite, con las mismas
cinco secciones, los mismos datos (99 registros históricos) y la misma paleta.

## Correr el proyecto

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # tsc -b + build de producción en dist/
npm run typecheck  # solo chequeo de tipos
```

## Stack

- React 19.1 (`createRoot`, StrictMode)
- TypeScript 5.7 en modo `strict`
- Vite 6
- Chart.js 4 (mismos gráficos que el original)
- Persistencia en `localStorage` (registros, documentos, adjuntos y preferencias)

## Estructura

```
src/
  App.tsx                 estado global, persistencia y validaciones de alta/edición
  main.tsx                punto de entrada
  styles.css              CSS original del panel (tokens de color, temas claro/oscuro)
  types.ts                Registro, DocMeta, Filtro, RegistroForm, Rol, Tema, Vista…
  data/registros.ts       los 99 registros históricos, tipados como Registro[]
  lib/
    constants.ts          listas cerradas: tipos, ejes, unidades, categorías, meses
    format.ts             fmtMoney, fmtInt, tituloTexto, parseUnidades, ejeClase…
    agregados.ts          filtrar(), resumen() y construirInforme() (KPIs y tablas)
    storage.ts            lectura/escritura en localStorage, descargas, FileReader
    temaChart.ts          colores de Chart.js leídos de las variables CSS del tema
  components/             Sidebar, Navbar, PerfilMenu, FiltroBar, ChartCanvas, Icon
  views/                  Dashboard, Registro, Calendario, Informes, Documentacion
  modals/                 DetalleModal, RegistroModal, DocModal
```

## Equivalencias con el HTML original

| Original | Acá |
| --- | --- |
| `SEED_DATA` | `src/data/registros.ts` |
| `:root` / `[data-theme="dark"]` | `src/styles.css` (sin cambios de color) |
| `renderDashboard()` | `views/Dashboard.tsx` + `lib/agregados.ts` |
| `renderTabla()` + paginación | `views/Registro.tsx` |
| `renderCalMonth()` / `renderCalAgenda()` | `views/Calendario.tsx` |
| `renderInformes()` + CSV | `views/Informes.tsx` |
| `DOCS_INDEX` + subida | `views/Documentacion.tsx` + `modals/DocModal.tsx` |
| `openDetail()` / `openModal()` | `modals/DetalleModal.tsx` / `modals/RegistroModal.tsx` |
| IndexedDB + chunking de adjuntos | `lib/storage.ts` (localStorage, un registro por clave) |

Los adjuntos se guardan como data URL en `localStorage` (`fh_adj_<id>`), no por
fragmentos en IndexedDB. Si el volumen de fotos crece, ese es el punto a cambiar
por IndexedDB o un backend.
