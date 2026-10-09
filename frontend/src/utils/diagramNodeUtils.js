// Helpers shared by the block nodes (hierarchy, logic step, text card).

/** Tree branch glyphs (├──, └──, │) for a row at `index` based on `level` nesting. */
export const computeTreePrefix = (items = [], index = 0) => {
  const currentItem = items[index];
  if (!currentItem) return '';
  const currentLevel = currentItem.level || 0;

  if (currentLevel === 0) {
    const hasNextSibling = items.slice(index + 1).some(it => (it.level || 0) === 0);
    return hasNextSibling ? '├── ' : '└── ';
  }

  let prefix = '';
  // Each ancestor depth from 0 to currentLevel - 1 provides 4 characters
  for (let depth = 0; depth < currentLevel; depth++) {
    let hasMoreAtDepth = false;
    for (let j = index + 1; j < items.length; j++) {
      const nextLevel = items[j].level || 0;
      if (nextLevel < depth) break;
      if (nextLevel === depth) {
        hasMoreAtDepth = true;
        break;
      }
    }
    prefix += hasMoreAtDepth ? '│   ' : '    ';
  }

  let isLastSibling = true;
  for (let j = index + 1; j < items.length; j++) {
    const nextLevel = items[j].level || 0;
    if (nextLevel < currentLevel) break;
    if (nextLevel === currentLevel) {
      isLastSibling = false;
      break;
    }
  }

  prefix += isLastSibling ? '└── ' : '├── ';
  return prefix;
};

export const MAX_TREE_LEVEL = 6;
export const clampTreeLevel = (level) => Math.max(0, Math.min(MAX_TREE_LEVEL, level || 0));

/** Inline style of a block card from its customisable `data` fields. */
export const getBlockCardStyle = (data, extra = {}) => ({
  background: data.customBg,
  borderColor: data.customBorder,
  borderStyle: data.borderStyle || 'solid',
  boxShadow: data.glow ? `0 0 18px ${data.glowColor || 'rgba(88, 166, 255, 0.45)'}` : undefined,
  zoom: data.scale || 1,
  ...extra
});

/** Connection handle style matching the block's accent colour. */
export const getBlockHandleStyle = (data) => (data.customAccent ? {
  background: data.customAccent,
  borderColor: data.customBg || '#111419'
} : undefined);

// --- Pure operations on a node's nested rows (hierarchy items / logic lines) ---

const levelOf = (row) => (row ? row.level || 0 : 0);

export const updateRow = (rows, index, patch) =>
  rows.map((row, idx) => (idx === index ? { ...row, ...patch } : row));

export const removeRow = (rows, index) => rows.filter((_, idx) => idx !== index);

export const indentRow = (rows, index, delta) =>
  rows.map((row, idx) => (idx === index ? { ...row, level: clampTreeLevel(levelOf(row) + delta) } : row));

/** Index where a new child of `parentIndex` is inserted. */
export const childInsertIndex = (rows, parentIndex) =>
  parentIndex >= 0 && parentIndex < rows.length ? parentIndex + 1 : rows.length;

/** Index right after the row at `index` and its whole subtree. */
export const siblingInsertIndex = (rows, index) => {
  const level = levelOf(rows[index]);
  let insertIdx = index + 1;
  while (insertIdx < rows.length && levelOf(rows[insertIdx]) > level) insertIdx++;
  return insertIdx;
};

export const insertRow = (rows, index, row) => [...rows.slice(0, index), row, ...rows.slice(index)];

export const rowLevel = levelOf;
