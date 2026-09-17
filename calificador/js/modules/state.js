export const CRITERIA = [
  { id: 'creativity',    label: 'Creatividad',    icon: '🎨', desc: 'Originalidad e ideas creativas del video' },
  { id: 'participation', label: 'Participación',   icon: '👥', desc: 'Integración y roles del equipo en pantalla' },
  { id: 'editing',       label: 'Edición',         icon: '🎬', desc: 'Calidad de edición, cortes y efectos' },
  { id: 'content',       label: 'Contenido',       icon: '📦', desc: 'Información y presentación del producto' },
  { id: 'presentation',  label: 'Presentación',    icon: '🎭', desc: 'Fluidez, naturalidad y carisma en cámara' },
];

export const MAX_STARS = 5;
export const MAX_SCORE = CRITERIA.length * MAX_STARS; // 25

const STORAGE_KEY = 'rifa_sep2026_teams';

function defaultScores() {
  return Object.fromEntries(CRITERIA.map(c => [c.id, 0]));
}

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? []; }
  catch { return []; }
}

function save(teams) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(teams));
}

let teams = load();

export function getTeams()     { return [...teams]; }
export function getTeam(id)    { return teams.find(t => t.id === id) ?? null; }

export function addTeam(name, product) {
  const team = { id: crypto.randomUUID(), name: name.trim(), product: product.trim(), scores: defaultScores(), rated: false };
  teams.push(team);
  save(teams);
  return team;
}

export function removeTeam(id) {
  teams = teams.filter(t => t.id !== id);
  save(teams);
}

export function setScore(teamId, criterionId, value) {
  const team = teams.find(t => t.id === teamId);
  if (!team) return;
  team.scores[criterionId] = value;
  team.rated = CRITERIA.every(c => team.scores[c.id] > 0);
  save(teams);
}

export function resetAll() { teams = []; save(teams); }
