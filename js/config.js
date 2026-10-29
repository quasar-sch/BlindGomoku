const COLORS = {
  red: '#e5383b',
  orange: '#f48c06',
  yellow: '#ffd60a',
  green: '#2fa84f',
  blue: '#2f6fed',
  purple: '#8e44ad',
  pink: '#ff7eb6',
  teal: '#1fb5a8',
};

export const COLOR_SETS = {
  1: [COLORS.teal],
  3: [COLORS.red, COLORS.yellow, COLORS.blue],
  5: [COLORS.red, COLORS.yellow, COLORS.green, COLORS.blue, COLORS.purple],
  7: [COLORS.red, COLORS.orange, COLORS.yellow, COLORS.green, COLORS.blue, COLORS.purple, COLORS.pink],
};

export const PRESETS = [
  { id: 'practice', name: '연습', desc: '돌 주인이 보여요', size: 11, colors: 3, helps: 0, judge: 'auto', ai: 'easy', showOwner: true },
  { id: 'easy', name: '입문', desc: '저학년 추천', size: 11, colors: 3, helps: 5, judge: 'auto', ai: 'easy', showOwner: false },
  { id: 'normal', name: '보통', desc: '고학년 추천', size: 13, colors: 5, helps: 3, judge: 'auto', ai: 'normal', showOwner: false },
  { id: 'hard', name: '도전', desc: '최고 난이도', size: 15, colors: 7, helps: 0, judge: 'declare', ai: 'hard', showOwner: false },
];

export const AI_NAMES = { easy: '쉬움', normal: '보통', hard: '어려움' };

export const OPTIONS = [
  { key: 'size', label: '판 크기', values: [[11, '11×11'], [13, '13×13'], [15, '15×15']] },
  { key: 'colors', label: '돌 색', values: [[1, '단색'], [3, '3색'], [5, '5색'], [7, '7색']] },
  { key: 'helps', label: '도우미', cpuOnly: true, values: [[0, '없음'], [3, '3회'], [5, '5회']] },
  { key: 'ai', label: '컴퓨터', cpuOnly: true, values: [['easy', '쉬움'], ['normal', '보통'], ['hard', '어려움']] },
];
