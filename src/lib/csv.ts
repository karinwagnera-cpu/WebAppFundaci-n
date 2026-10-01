import type { Registro } from '../types';
import { descargar } from './storage';

const COLS = ['id', 'fecha', 'tipo', 'eje', 'ejeSecundario', 'unidad', 'beneficiario', 'aporte', 'motivo', 'costo', 'inversion', 'horas', 'contacto', 'numeroCertificado', 'numeroFactura', 'observaciones'] as const;
const HEADER = ['ID', 'Fecha', 'Tipo de movimiento', 'Eje estratégico principal', 'Eje estratégico secundario', 'Unidad de negocio', 'Beneficiario / Institución', 'Donación o aporte', 'Descripción', 'Costo interno (ARS)', 'Inversión (ARS)', 'Horas de voluntariado', 'Contacto', 'N° de certificado', 'N° de factura', 'Observaciones'];

export function exportarRegistrosCsv(registros: Registro[], nombreArchivo = 'fundacion-huentala-registros.csv'): void {
  const data = registros.slice().sort((a, b) => (a.fecha || '').localeCompare(b.fecha || ''));
  const esc = (v: unknown) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
  const lineas = [HEADER.join(','), ...data.map((r) => COLS.map((c) => esc(r[c])).join(','))];
  descargar(new Blob(['﻿' + lineas.join('\r\n')], { type: 'text/csv;charset=utf-8;' }), nombreArchivo);
}
