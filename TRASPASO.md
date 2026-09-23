# Traspaso del proyecto — Fundación Huentala · Panel de gestión

Este documento tiene todo lo necesario para retomar el proyecto en tu nueva cuenta de Claude (Cowork). Leelo entero una vez y después seguí los pasos.

---

## 1. Qué es el proyecto

Webapp de gestión interna de la **Fundación Huentala**. Es un panel administrativo de una sola página (SPA) para cargar y seguir la actividad de la fundación.

Hoy existen **dos formas** del mismo producto:

1. **`WebAppFundacion-standalone.html`** — un único archivo HTML (HTML + CSS + JS embebidos, Chart.js por CDN, datos en IndexedDB del navegador). **Corre sin instalar nada** y es la versión donde hicimos todo el trabajo de diseño y funcionalidad. **ESTA es la fuente de verdad del diseño.**
2. **`src/` + `index.html` + Vite** — un refactor React + TypeScript + Vite (repo `CortezWalter/fundacion`). Necesita `npm install && npm run dev`. Quedó desactualizado respecto al standalone.

> Recomendación: seguí trabajando sobre el **standalone**. Es donde están todas las funciones nuevas.

---

## 2. Repos de GitHub asociados

| Repo | Rol |
| --- | --- |
| `karinwagnera-cpu/WebAppFundaci-n` | Tu repo original (versión monolítica / standalone) |
| `CortezWalter/fundacion` | Refactor React + TS + Vite |
| `karinwagnera-cpu/WebAppFundaci-nH` | Repo nuevo (estaba vacío) |

**Dato importante sobre Claude y GitHub:** Claude puede **leer** repos y **traer** archivos al proyecto, pero **NO puede hacer push / escribir** en GitHub. Para subir cambios lo hacés vos con git o desde la web de GitHub.

Comando para subir el standalone a un repo (ejemplo):
```bash
git clone https://github.com/karinwagnera-cpu/WebAppFundaci-nH.git
cd WebAppFundaci-nH
# copiá WebAppFundacion-standalone.html acá y renombralo a index.html
git add index.html
git commit -m "Panel Fundación Huentala"
git push -u origin main
```

---

## 3. Cómo retomar en la cuenta nueva (pasos)

1. **Subí el archivo del proyecto.** La forma más fácil de no perder nada: descargá desde acá el proyecto completo (te dejo el botón abajo) y en la cuenta nueva adjuntá / subí `WebAppFundacion-standalone.html`. Si querés también el refactor React, subí toda la carpeta.
2. **Pegá el "Prompt de arranque"** (sección 5) como primer mensaje. Le da a Claude todo el contexto del producto.
3. **Pedí los cambios** usando la lista de estado (sección 4) para saber qué ya está hecho.

---

## 4. Estado actual — qué ya está construido

**Layout / navegación**
- Sidebar **estático y angosto** (~92px): logo arriba, luego íconos con su nombre debajo (tipografía 9px). **Configuración** anclada al pie, separada con un borde.
- Vistas: Dashboard, Registro, **Analítica** (antes "Informes"), **Campañas**, Calendario, Documentación, **Configuración**.
- Tipografía unificada a **Montserrat**.
- Tema claro/oscuro (híbrido cálido: bordó/marrón/dorado/salvia).

**Dashboard**
- Tarjetas KPI **rectangulares y bajas** (se les quitó el formato cuadrado).

**Registro** (tabla principal)
- Columnas **Fila** (con casilla de selección + número) y **Acciones** fijas (sticky), sin superposición en hover/selección ni en modo oscuro.
- **Acciones solo con íconos**: ojo (ver), lápiz (editar), tacho (eliminar, con confirmación).
- **Filtro por columna**: botón de ícono (embudo) al lado de cada título; abre un popup con campo de texto.
- **Selección de filas** + "seleccionar todo"; al seleccionar aparece barra para **Crear gráfico** (agrupar por eje/unidad/tipo/mes/beneficiario; medir cantidad/inversión/costo/horas; barras/torta/líneas).
- Buscador queda en su lugar; botón **Filtros** movido al lado de **Nuevo registro**.

**Campañas** (hub nuevo)
- Contadores por estado (Activa / Planificada / Finalizada).
- Tabla: nombre+objetivo, eje, período, estado (con color) y **barra de avance de la meta** (% + beneficiarios alcanzados/meta).
- Buscador y filtro por estado. Alta/edición/eliminación con formulario (nombre, descripción, eje, estado, fechas, metas y alcanzados de beneficiarios y acciones). El % se calcula a partir de beneficiarios alcanzados vs meta.
- Las campañas se cargan **aparte** (no vinculadas a registros, por decisión de diseño). 4 campañas de ejemplo precargadas.

**Analítica** (antes Informes)
- Renombrada; sigue permitiendo emitir informes (Exportar CSV / Imprimir-PDF).
- Se quitaron las 3 tarjetas grandes (Acciones realizadas, Costo interno, Valor apalancado).
- Se agregaron 2 gráficos de campañas: **por estado** y **efectividad (% de meta)**, respetando filtros de año/eje.

**Configuración** (vista nueva)
- Apariencia (cambiar tema), Datos (exportar CSV, aviso de almacenamiento local), Acerca de.

**Modales y filtros**
- Todos los modales, los 3 paneles de Filtros y el popup de filtro por columna tienen **✕ para cerrar**, cierran con **clic afuera** y con **Escape** (mediante delegación de eventos, robusto ante recreación del DOM).

---

## 5. Prompt de arranque (pegar como primer mensaje en la cuenta nueva)

> Estoy retomando un proyecto existente: el **Panel de gestión de la Fundación Huentala**, una webapp administrativa de una sola página. Te adjunto `WebAppFundacion-standalone.html`, que es la **fuente de verdad**: un único archivo con HTML + CSS + JS embebidos, Chart.js por CDN y datos guardados en IndexedDB del navegador. Trabajá siempre sobre ese archivo (no lo migres a otro formato salvo que te lo pida).
>
> Contexto del producto:
> - Tipografía **Montserrat**. Paleta cálida (bordó, marrón, dorado, salvia) con modo claro/oscuro.
> - Sidebar estático y angosto con íconos + nombre debajo; **Configuración** al pie.
> - Vistas: Dashboard (KPIs), Registro (tabla con selección de filas, filtro por columna, acciones con íconos ver/editar/eliminar, y creación de gráficos a partir de la selección), **Campañas** (hub de seguimiento con barra de avance de meta), **Analítica** (informes + gráficos de campañas, export CSV / PDF), Calendario, Documentación, Configuración.
> - Todos los modales y filtros cierran con ✕, clic afuera y Escape.
>
> Reglas de trabajo:
> - Cuando pida un cambio chico, tocá solo eso; no rediseñes lo que no pedí.
> - Mantené el estilo visual y las convenciones existentes (mismos colores, tipografía, patrones de tarjetas/tablas/botones).
> - Respondé y escribí la interfaz en **español**.
>
> Para empezar, revisá el archivo y confirmame qué vistas y funciones ves, así validamos que quedó todo. Después te paso los próximos cambios.

---

## 6. Próximos pasos posibles (backlog sugerido)

- **Convertir en webapp real / multiusuario:** partir del refactor Vite + React, agregar **Supabase** (Postgres + Auth + Storage) para datos compartidos y persistentes en la nube; **React Router** para las vistas; PDF real con **jsPDF + html2canvas**; deploy en **Vercel** o **Netlify**.
- **Vincular campañas con registros** para que el avance se calcule automáticamente (hoy es carga manual).
- **Autenticación y roles** (ya hay lógica de "rol admin" en el código).

---

## 7. Detalles técnicos útiles

- **Datos locales:** IndexedDB, con respaldo en memoria. Claves principales: registros (`fundacion_huentala_...`), campañas (`fundacion_huentala_campanas`). Al vaciar datos del navegador se pierden; por eso conviene exportar CSV periódicamente.
- **Gráficos:** Chart.js vía CDN (necesita internet para renderizar; hay fallback con mensaje si no hay conexión).
- **Impresión/PDF:** la vista Analítica tiene CSS de impresión que aísla esa sección.
- **Sin build:** el standalone abre con doble clic en cualquier navegador moderno.
