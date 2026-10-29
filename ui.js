import { COLOR_SETS, PRESETS, OPTIONS, AI_NAMES } from './config.js';

const $ = id => document.getElementById(id);
const NUDGE_MS = 450;

let cells = [];
let stars = new Set();

const dots = hexes => hexes.map((hex, k) => `<b style="--c:${hex};--k:${k}"></b>`).join('');
const colorText = n => (n === 1 ? '단색' : `${n}색`);

export function initDecor() {
  $('orbs').innerHTML = COLOR_SETS[7]
    .map((hex, k) => `<i style="--c:${hex};--x:${6 + k * 14}%;--s:${46 + (k % 3) * 24}px;--t:${17 + k * 3}s;--d:-${k * 2.7}s"></i>`)
    .join('');
  $('hero').innerHTML = dots(COLOR_SETS[7]);
}

export function show(id) {
  document.querySelectorAll('.screen').forEach(el => el.classList.toggle('active', el.id === id));
}

export function renderHome(records) {
  const rows = PRESETS.filter(p => records[p.id])
    .map(p => `<span><em>${p.name}</em>${records[p.id].win}승 ${records[p.id].lose}패 ${records[p.id].draw}무</span>`)
    .join('');
  $('records').innerHTML = rows ? `<small>컴퓨터 대결 전적</small>${rows}` : '';
}

function summarize(cfg, mode) {
  const owner = cfg.showOwner ? '돌 주인 공개' : null;
  const help = cfg.helps ? `도우미 ${cfg.helps}회` : '도우미 없음';
  const parts = [
    `${cfg.size}×${cfg.size}`,
    colorText(cfg.colors),
    owner ?? (mode === 'cpu' ? help : null),
    mode === 'cpu' ? `컴퓨터 ${AI_NAMES[cfg.ai]}` : null,
    cfg.judge === 'auto' ? '자동 판정' : '오목 선언제',
  ];
  return parts.filter(Boolean).join(' · ');
}

export function renderSetup({ mode, presetId, cfg }) {
  $('setupTitle').textContent = mode === 'cpu' ? '컴퓨터와 대결' : '친구와 1:1';
  $('presets').innerHTML = PRESETS.map(
    p => `<button class="preset${p.id === presetId ? ' on' : ''}" data-act="preset" data-val="${p.id}">
      <span class="preset-dots">${dots(COLOR_SETS[p.colors])}</span>
      <strong>${p.name}</strong>
      <em>${p.desc}</em>
      <small>${p.size}×${p.size} · ${colorText(p.colors)}</small>
    </button>`,
  ).join('');
  $('summary').textContent = summarize(cfg, mode);
  $('optBox').innerHTML = OPTIONS.filter(o => mode === 'cpu' || !o.cpuOnly)
    .map(
      o => `<div class="opt-row"><span>${o.label}</span><div class="opt-group">${o.values
        .map(([v, text]) => `<button class="chip${cfg[o.key] === v ? ' on' : ''}" data-act="opt" data-key="${o.key}" data-val="${v}">${text}</button>`)
        .join('')}</div></div>`,
    )
    .join('');
}

export function playerNames(s) {
  if (s.mode === 'cpu') return ['나', '컴퓨터'];
  return s.flip ? ['친구 2', '친구 1'] : ['친구 1', '친구 2'];
}

export function buildBoard(s) {
  const n = s.cfg.size;
  const edge = 3;
  const mid = (n - 1) / 2;
  stars = new Set([[edge, edge], [edge, n - 1 - edge], [n - 1 - edge, edge], [n - 1 - edge, n - 1 - edge], [mid, mid]].map(([r, c]) => r * n + c));
  $('board').style.setProperty('--n', n);
  $('board').innerHTML = Array.from({ length: n * n }, (_, i) => `<div class="cell" data-i="${i}"><i></i></div>`).join('');
  cells = [...$('board').children];
}

export function drawBoard(s) {
  const lit = new Set(s.line);
  cells.forEach((el, i) => {
    const owner = s.game.owners[i];
    const reveal = owner && (s.over || s.cfg.showOwner || s.peek === i);
    el.className = ['cell', stars.has(i) && 'star', owner && `filled o${owner}`, reveal && 'reveal', i === s.last && 'last', lit.has(i) && 'win']
      .filter(Boolean)
      .join(' ');
    el.style.setProperty('--c', owner ? s.colors[s.game.colors[i]] : '');
    el.style.setProperty('--k', s.order[i]);
  });
  $('board').classList.toggle('ended', s.over);
}

function resultText(s) {
  const { winner, foul } = s.outcome;
  const names = playerNames(s);
  if (!winner) return ['무승부', '판이 가득 찼어요'];
  const main = s.mode === 'cpu' ? (winner === 1 ? '승리!' : '패배') : `${names[winner - 1]} 승리!`;
  const sub = foul ? `${names[2 - winner]}: 오목이 아닌데 선언해서 반칙패` : '돌 속 점이 진짜 주인이에요 · 검은 점 선공, 흰 점 후공';
  return [main, sub];
}

function turnText(s) {
  const names = playerNames(s);
  const hint = s.colors.length > 1 ? '색을 고르고 칸을 눌러요' : '칸을 눌러 돌을 놓아요';
  if (s.mode === 'cpu') return s.turn === 1 ? ['내 차례', hint] : ['컴퓨터가 생각 중', '같은 색으로 따라 놓아요'];
  return [`${names[s.turn - 1]} 차례`, s.turn === 1 ? hint : '선공이 고른 색으로 놓아요'];
}

function paletteHtml(s) {
  if (s.over || s.colors.length < 2) return '';
  const forced = s.turn === 2;
  const chosen = forced ? s.lastColor : s.picked;
  const swatches = s.colors.map((hex, k) => `<button class="swatch${k === chosen ? ' on' : ''}" style="--c:${hex}" data-act="pick" data-val="${k}"></button>`).join('');
  return `<div class="palette-label">${forced ? '선공이 고른 색을 따라 놓아요' : '놓을 색을 골라요'}</div><div class="palette-row">${swatches}</div>`;
}

function actionsHtml(s) {
  if (s.over) {
    return [
      '<button class="btn btn-red" data-act="again">다시 하기</button>',
      s.mode === 'pvp' ? '<button class="btn btn-gold" data-act="swap">선후공 바꿔 한 판 더</button>' : '',
      '<button class="btn" data-act="nav" data-val="home">메인으로</button>',
    ].join('');
  }
  const cpuTurn = s.mode === 'cpu' && s.turn === 2;
  return s.cfg.judge === 'declare' && !cpuTurn ? '<button class="btn btn-red declare" data-act="declare">오목!</button>' : '';
}

export function drawStatus(s) {
  const [main, sub] = s.over ? resultText(s) : turnText(s);
  $('bannerMain').textContent = main;
  $('bannerSub').textContent = sub;
  $('helperBox').textContent = s.cfg.helps ? `도우미 ${s.helpsLeft}회` : '';
  $('palette').innerHTML = paletteHtml(s);
  $('palette').classList.toggle('locked', s.turn === 2);
  $('actions').innerHTML = actionsHtml(s);
  const ghost = s.turn === 1 ? s.picked : s.lastColor;
  $('board').style.setProperty('--pc', ghost === null ? 'transparent' : s.colors[ghost]);
}

export function nudge() {
  const palette = $('palette');
  palette.classList.add('nudge');
  setTimeout(() => palette.classList.remove('nudge'), NUDGE_MS);
}
