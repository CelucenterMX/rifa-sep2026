// ── CONFIGURACIÓN — edita después de desplegar el GAS ──────────────────────
// 1. Abre gas_calificador.gs en Google Apps Script
// 2. Despliega como Web App (acceso: Anyone)
// 3. Copia la URL y pégala aquí abajo

export const GAS_URL = 'https://script.google.com/macros/s/AKfycbxr_BrZlJhnxgvZmFt3F9GgIXqkhQ6pNx3CkvspRYpBLTe0W-HSIqBxl0mHFqM-7__L/exec';

// Nombres de los jueces (aparecen en la pantalla de resultados y en la app)
export const JUECES = [
  { id: '1', nombre: 'Juez 1' },
  { id: '2', nombre: 'Juez 2' },
  { id: '3', nombre: 'Juez 3' },
  { id: '4', nombre: 'Juez 4' },
];

export const CRITERIA = [
  { id: 'creativity',    label: 'Creatividad',    icon: '🎨', desc: 'Originalidad e ideas creativas del video' },
  { id: 'participation', label: 'Participación',   icon: '👥', desc: 'Integración y roles del equipo en pantalla' },
  { id: 'editing',       label: 'Edición',         icon: '🎬', desc: 'Calidad de edición, cortes y efectos' },
  { id: 'content',       label: 'Contenido',       icon: '📦', desc: 'Información y presentación del producto' },
  { id: 'presentation',  label: 'Presentación',    icon: '🎭', desc: 'Fluidez, naturalidad y carisma en cámara' },
];

export const MAX_STARS = 5;
export const MAX_SCORE = CRITERIA.length * MAX_STARS; // 25
