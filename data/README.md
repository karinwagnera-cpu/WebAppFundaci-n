# Histórico de acciones (SQLite)

`fundacion-historico.sqlite` es la migración de `ACCIONES FUNDACIÓN HUENTALA.xlsx`
(13 hojas, una por año, 2014–2026) a una única tabla `acciones_historico`.

Generado con `scripts/excel-to-sqlite.mjs` (Node, usa `node:sqlite` — no necesita
instalar nada extra). Para regenerarlo tras actualizar el Excel:

```bash
node scripts/excel-to-sqlite.mjs
```

El script busca automáticamente un archivo `ACCIONES*.xlsx` en la carpeta
inmediatamente superior al repo (`../`).

## Qué incluye y qué no

- Todas las columnas originales de la planilla, con nombres normalizados
  (`unidad_negocio`, `servicio_adicional`, etc.). Se guarda tanto el valor
  parseado (`fecha`, `costo`, `inversion`) como el texto tal cual venía en la
  celda (`fecha_raw`, `costo_raw`, `inversion_raw`), por si algún parseo
  necesita revisión manual.
- La planilla mezcla formatos de fecha (D/M/Y y M/D/Y según quién cargó la
  fila) y de monto ($118,036.71 vs $246.236,55). El script detecta cuál es
  cada caso; cuando una fecha es genuinamente ambigua (ambas lecturas dan un
  día válido) se asume D/M/Y (convención AR). Una sola fila quedó sin poder
  parsear la fecha (`"3 Y 4/12/2021"`, un texto literal, no una fecha).
- **No incluye los logos de auspiciantes**: son 47 imágenes incrustadas en la
  planilla (no texto de celda), fuera de alcance de esta migración.

Esta tabla es un archivo histórico independiente — no está conectada en vivo
con los datos de Supabase que usa la app (`registros` / `campanas`).
