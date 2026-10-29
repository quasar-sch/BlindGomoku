import { DIRS, run, place, remove } from './game.js';

const FIVE = 100000;
const WIN = 1e7;
const SCORE = { 1: [0, 1, 10], 2: [0, 10, 100], 3: [0, 100, 1000], 4: [0, 1000, 10000] };
const WINDOW = [0, 1, 10, 100, 1000, FIVE];
const DEFENSE = 1.1;
const NORMAL_MISTAKE_RATE = 0.15;
const SEARCH_DEPTH = 4;
const SEARCH_BRANCH = 8;

const lengthOf = r => r.back + r.fwd + 1;
const makesFive = (g, i, who) => DIRS.some(d => lengthOf(run(g, i, who, d)) >= 5);
const randomOf = list => list[Math.floor(Math.random() * list.length)];

function cellScore(g, i, who) {
  return DIRS.reduce((sum, d) => {
    const r = run(g, i, who, d);
    const len = lengthOf(r);
    return sum + (len >= 5 ? FIVE : SCORE[len][r.open]);
  }, 0);
}

function candidates(g) {
  const { size, owners } = g;
  if (g.count === 0) return [Math.floor((size * size) / 2)];
  const near = new Uint8Array(owners.length);
  owners.forEach((o, i) => {
    if (!o) return;
    const r = Math.floor(i / size);
    const c = i % size;
    for (let y = Math.max(0, r - 2); y <= Math.min(size - 1, r + 2); y++) {
      for (let x = Math.max(0, c - 2); x <= Math.min(size - 1, c + 2); x++) near[y * size + x] = 1;
    }
  });
  const list = [];
  near.forEach((v, i) => {
    if (v && !owners[i]) list.push(i);
  });
  return list.length ? list : Array.from(owners.keys()).filter(i => !owners[i]);
}

function ranked(g, me, opp, weight) {
  return candidates(g)
    .map(i => ({ i, score: cellScore(g, i, me) + cellScore(g, i, opp) * weight }))
    .sort((a, b) => b.score - a.score);
}

function forcedMove(g, me, opp) {
  const list = candidates(g);
  return list.find(i => makesFive(g, i, me)) ?? list.find(i => makesFive(g, i, opp)) ?? null;
}

function evaluate(g, me, opp) {
  const { size, owners } = g;
  let score = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      for (const [dr, dc] of DIRS) {
        const endR = r + 4 * dr;
        const endC = c + 4 * dc;
        if (endR < 0 || endR >= size || endC < 0 || endC >= size) continue;
        let mine = 0;
        let theirs = 0;
        for (let k = 0; k < 5; k++) {
          const o = owners[(r + k * dr) * size + c + k * dc];
          if (o === me) mine++;
          else if (o === opp) theirs++;
        }
        if (mine && !theirs) score += WINDOW[mine];
        else if (theirs && !mine) score -= WINDOW[theirs] * DEFENSE;
      }
    }
  }
  return score;
}

function search(g, depth, alpha, beta, me, opp) {
  let best = { score: -Infinity, move: -1 };
  for (const { i } of ranked(g, me, opp, 1).slice(0, SEARCH_BRANCH)) {
    let score;
    if (makesFive(g, i, me)) {
      score = WIN + depth;
    } else {
      place(g, i, me);
      score = depth === 1 ? evaluate(g, me, opp) : -search(g, depth - 1, -beta, -alpha, opp, me).score;
      remove(g, i);
    }
    if (score > best.score) best = { score, move: i };
    alpha = Math.max(alpha, score);
    if (alpha >= beta) break;
  }
  return best;
}

const LEVELS = {
  easy: (g, me, opp) => forcedMove(g, me, opp) ?? randomOf(candidates(g)),
  normal: (g, me, opp) => {
    const forced = forcedMove(g, me, opp);
    if (forced !== null) return forced;
    const mistake = Math.random() < NORMAL_MISTAKE_RATE;
    return randomOf(ranked(g, me, opp, 0.9).slice(0, mistake ? 4 : 1)).i;
  },
  hard: (g, me, opp) => forcedMove(g, me, opp) ?? search(g, SEARCH_DEPTH, -Infinity, Infinity, me, opp).move,
};

export const chooseMove = (g, me, opp, level) => LEVELS[level](g, me, opp);
