const KEY = 'blindOmok.records';

export function loadRecords() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) ?? {};
  } catch {
    return {};
  }
}

export function addRecord(id, result) {
  const records = loadRecords();
  const entry = records[id] ?? { win: 0, lose: 0, draw: 0 };
  entry[result]++;
  records[id] = entry;
  try {
    localStorage.setItem(KEY, JSON.stringify(records));
  } catch {
    return;
  }
}
