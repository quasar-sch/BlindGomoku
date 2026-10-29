export const DIRS = [[0, 1], [1, 0], [1, 1], [1, -1]];

export function createGame(size) {
  return {
    size,
    owners: new Int8Array(size * size),
    colors: new Int8Array(size * size).fill(-1),
    count: 0,
  };
}

export function place(g, i, owner, color = -1) {
  g.owners[i] = owner;
  g.colors[i] = color;
  g.count++;
}

export function remove(g, i) {
  g.owners[i] = 0;
  g.colors[i] = -1;
  g.count--;
}

export const isFull = g => g.count === g.owners.length;

export function run(g, i, owner, [dr, dc]) {
  const { size, owners } = g;
  const r0 = Math.floor(i / size);
  const c0 = i % size;
  const walk = sign => {
    let n = 0;
    let r = r0 + sign * dr;
    let c = c0 + sign * dc;
    const inside = () => r >= 0 && r < size && c >= 0 && c < size;
    while (inside() && owners[r * size + c] === owner) {
      n++;
      r += sign * dr;
      c += sign * dc;
    }
    return [n, inside() && owners[r * size + c] === 0 ? 1 : 0];
  };
  const [back, openBack] = walk(-1);
  const [fwd, openFwd] = walk(1);
  return { back, fwd, open: openBack + openFwd };
}

export function lineThrough(g, i, owner) {
  for (const d of DIRS) {
    const { back, fwd } = run(g, i, owner, d);
    if (back + fwd + 1 >= 5) {
      const step = d[0] * g.size + d[1];
      return Array.from({ length: back + fwd + 1 }, (_, k) => i + (k - back) * step);
    }
  }
  return null;
}

export function findLine(g, owner) {
  for (let i = 0; i < g.owners.length; i++) {
    if (g.owners[i] !== owner) continue;
    const line = lineThrough(g, i, owner);
    if (line) return line;
  }
  return null;
}
