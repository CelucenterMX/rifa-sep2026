import { addTeam, removeTeam, resetAll } from './modules/state.js';
import {
  renderTeams, renderLeaderboard,
  openScoringDialog, closeScoringDialog,
  saveScores, resetPendingScores,
} from './modules/ui.js';

// ── DOM refs ──────────────────────────────────────────────────────────────
const btnAdd      = document.getElementById('btn-add-team');
const addForm     = document.getElementById('add-team-form');
const nameInput   = document.getElementById('team-name-input');
const productInput= document.getElementById('product-input');
const btnCancel   = document.getElementById('btn-cancel-add');
const btnReset    = document.getElementById('btn-reset-all');
const dialog      = document.getElementById('scoring-dialog');
const btnClose    = document.getElementById('btn-close-dialog');
const btnSave     = document.getElementById('btn-save');
const btnResetSc  = document.getElementById('btn-reset-scores');
const teamList    = document.getElementById('team-list');

// ── Boot ──────────────────────────────────────────────────────────────────
refresh();

// ── Add team ──────────────────────────────────────────────────────────────
btnAdd.addEventListener('click', () => {
  addForm.hidden = false;
  btnAdd.hidden  = true;
  nameInput.focus();
});

btnCancel.addEventListener('click', cancelAdd);

addForm.addEventListener('submit', e => {
  e.preventDefault();
  const name    = nameInput.value.trim();
  const product = productInput.value.trim();
  if (!name || !product) return;
  addTeam(name, product);
  cancelAdd();
  refresh();
});

function cancelAdd() {
  addForm.hidden = true;
  btnAdd.hidden  = false;
  nameInput.value    = '';
  productInput.value = '';
}

// ── Team list delegation ──────────────────────────────────────────────────
teamList.addEventListener('click', e => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  if (btn.dataset.action === 'score')  openScoringDialog(btn.dataset.id);
  if (btn.dataset.action === 'delete') {
    if (confirm(`¿Eliminar "${btn.dataset.id}" y sus calificaciones?`)) {
      removeTeam(btn.dataset.id);
      refresh();
    }
  }
});

// ── Dialog ────────────────────────────────────────────────────────────────
btnClose.addEventListener('click', closeScoringDialog);
btnSave.addEventListener('click',  () => { saveScores(); refresh(); });
btnResetSc.addEventListener('click', resetPendingScores);

dialog.addEventListener('click', e => { if (e.target === dialog) closeScoringDialog(); });
dialog.addEventListener('cancel', e => { e.preventDefault(); closeScoringDialog(); });

// ── Reset all ─────────────────────────────────────────────────────────────
btnReset.addEventListener('click', () => {
  if (confirm('¿Reiniciar todo? Se borrarán equipos y calificaciones.')) {
    resetAll();
    refresh();
  }
});

// ── Helpers ───────────────────────────────────────────────────────────────
function refresh() {
  renderTeams();
  renderLeaderboard();
}
