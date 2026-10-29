import { PRESETS, COLOR_SETS } from './config.js';
import { createGame, place, lineThrough, findLine, isFull } from './game.js';
import { chooseMove } from './ai.js';
import { loadRecords, addRecord } from './record.js';
import * as ui from './ui.js';

const CPU_DELAY_MS = 500;
const PEEK_MS = 1500;
const DEFAULT_PRESET = PRESETS[1];

let setup = null;
let s = null;
let peekTimer = 0;

const isCpuTurn = () => s.mode === 'cpu' && s.turn === 2;

function render() {
  ui.drawBoard(s);
  ui.drawStatus(s);
}

function begin(cfg, mode, recordId, flip) {
  s = {
    cfg,
    mode,
    recordId,
    flip,
    colors: COLOR_SETS[cfg.colors],
    game: createGame(cfg.size),
    turn: 1,
    picked: null,
    lastColor: null,
    last: -1,
    peek: -1,
    helpsLeft: cfg.helps,
    over: false,
    line: [],
    outcome: null,
    order: new Int16Array(cfg.size * cfg.size),
  };
  clearTimeout(peekTimer);
  ui.buildBoard(s);
  render();
  ui.show('game');
}

function finish(winner, line = [], foul = false) {
  s.over = true;
  s.line = line;
  s.outcome = { winner, foul };
  if (s.mode === 'cpu' && s.recordId) addRecord(s.recordId, ['draw', 'win', 'lose'][winner]);
  render();
}

function commit(i, color) {
  const mover = s.turn;
  place(s.game, i, mover, color);
  s.order[i] = s.game.count;
  s.last = i;
  s.picked = null;
  if (mover === 1) s.lastColor = color;
  const line = lineThrough(s.game, i, mover);
  const declares = s.cfg.judge === 'auto' || (s.mode === 'cpu' && mover === 2);
  if (line && declares) return finish(mover, line);
  if (isFull(s.game)) return finish(0);
  s.turn = 3 - mover;
  render();
  if (isCpuTurn()) cpuTurn();
}

function cpuTurn() {
  const current = s;
  setTimeout(() => {
    if (s === current) commit(chooseMove(s.game, 2, 1, s.cfg.ai), s.lastColor);
  }, CPU_DELAY_MS);
}

function peek(i) {
  if (s.over || s.cfg.showOwner || s.helpsLeft <= 0) return;
  s.helpsLeft--;
  s.peek = i;
  render();
  clearTimeout(peekTimer);
  peekTimer = setTimeout(() => {
    s.peek = -1;
    render();
  }, PEEK_MS);
}

function tapCell(i) {
  if (s.over || isCpuTurn()) return;
  if (s.game.owners[i]) return peek(i);
  const color = s.turn === 2 ? s.lastColor : s.colors.length === 1 ? 0 : s.picked;
  if (color === null) return ui.nudge();
  commit(i, color);
}

function declare() {
  if (s.over || isCpuTurn()) return;
  const line = findLine(s.game, s.turn);
  if (line) finish(s.turn, line);
  else finish(3 - s.turn, [], true);
}

function openSetup(mode) {
  setup = { mode, presetId: DEFAULT_PRESET.id, cfg: { ...DEFAULT_PRESET } };
  ui.renderSetup(setup);
  ui.show('setup');
}

const parse = v => (Number.isNaN(Number(v)) ? v : Number(v));

const handlers = {
  open: openSetup,
  nav: id => {
    if (id === 'home') {
      s = null;
      ui.renderHome(loadRecords());
    }
    ui.show(id);
  },
  preset: id => {
    const preset = PRESETS.find(p => p.id === id);
    setup = { ...setup, presetId: id, cfg: { ...preset } };
    ui.renderSetup(setup);
  },
  opt: (val, el) => {
    setup = { ...setup, presetId: null, cfg: { ...setup.cfg, [el.dataset.key]: parse(val), showOwner: false } };
    ui.renderSetup(setup);
  },
  start: () => {
    const cfg = setup.mode === 'pvp' ? { ...setup.cfg, helps: 0 } : setup.cfg;
    begin(cfg, setup.mode, setup.presetId, false);
  },
  pick: val => {
    if (s.turn !== 1) return;
    s.picked = Number(val);
    render();
  },
  declare,
  again: () => begin(s.cfg, s.mode, s.recordId, s.flip),
  swap: () => begin(s.cfg, s.mode, s.recordId, !s.flip),
};

document.addEventListener('click', e => {
  const cell = e.target.closest('.cell');
  if (cell && s) return tapCell(Number(cell.dataset.i));
  const el = e.target.closest('[data-act]');
  if (el) handlers[el.dataset.act]?.(el.dataset.val, el);
});

ui.initDecor();
ui.renderHome(loadRecords());
