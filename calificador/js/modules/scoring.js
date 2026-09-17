import { CRITERIA, MAX_SCORE, MAX_STARS } from '../config.js';

export function totalScore(scores) {
  return CRITERIA.reduce((sum, c) => sum + (scores[c.id] ?? 0), 0);
}

export function percentage(scores) {
  return Math.round((totalScore(scores) / MAX_SCORE) * 100);
}

export function criterionLabel(score) {
  const pct = Math.round((score / MAX_STARS) * 100);
  if (pct === 100) return 'Perfecto ✨';
  if (pct >= 80)   return 'Excelente';
  if (pct >= 60)   return 'Muy bien';
  if (pct >= 40)   return 'Bien';
  if (pct >= 20)   return 'Regular';
  return '—';
}

export function overallLabel(pct) {
  if (pct >= 90) return { text: 'Sobresaliente 🌟', cls: 'badge--gold' };
  if (pct >= 70) return { text: 'Excelente 🎉',     cls: 'badge--green' };
  if (pct >= 50) return { text: 'Muy Bien 👍',       cls: 'badge--blue' };
  if (pct >= 30) return { text: 'Bien 😊',           cls: 'badge--yellow' };
  return         { text: 'Puede mejorar 💪',         cls: 'badge--red' };
}

export function medal(rank) {
  return ['🥇', '🥈', '🥉'][rank] ?? `#${rank + 1}`;
}
