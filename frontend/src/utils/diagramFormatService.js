// diagramFormatService.js - Сервис стандартизированного формата .diagram (JSON)
// Спецификация: disposal-diagram-v1.0

export const DIAGRAM_SCHEMA_VERSION = 'disposal-diagram-v1.0';

/**
 * Нормализует ID точек привязки для обратной совместимости (старые 8-точечные и секционные -> единые 4-точечные)
 */
export function normalizeHandleId(handleId) {
  if (!handleId || typeof handleId !== 'string') return handleId;
  const lower = handleId.toLowerCase();
  if (['source-left', 'target-left', 'left-source', 'left-target', 'left-top-source', 'left-center-source', 'left-bottom-source', 'left-top-target', 'left-center-target', 'left-bottom-target'].includes(lower)) {
    return 'handle-left';
  }
  if (['source-right', 'target-right', 'right-source', 'right-target', 'right-top-source', 'right-center-source', 'right-bottom-source', 'right-top-target', 'right-center-target', 'right-bottom-target'].includes(lower)) {
    return 'handle-right';
  }
  if (['source-top', 'target-top', 'top-source', 'top-target', 'top-left-source', 'top-center-source', 'top-right-source', 'top-left-target', 'top-center-target', 'top-right-target'].includes(lower)) {
    return 'handle-top';
  }
  if (['source-bottom', 'target-bottom', 'bottom-source', 'bottom-target', 'bottom-left-source', 'bottom-center-source', 'bottom-right-source', 'bottom-left-target', 'bottom-center-target', 'bottom-right-target'].includes(lower)) {
    return 'handle-bottom';
  }
  return handleId;
}

/**
 * Создает валидный объект проекта схемы для экспорта в файл .diagram
 */
export function serializeDiagramProject({
  id,
  title = 'Схема архитектуры',
  description = '',
  nodes = [],
  edges = [],
  viewport = { x: 0, y: 0, zoom: 1 }
}) {
  const cleanNodes = (nodes || []).map(n => ({
    id: n.id,
    type: n.type || 'hierarchyNode',
    position: {
      x: Math.round(n.position?.x || 0),
      y: Math.round(n.position?.y || 0)
    },
    data: n.data || {},
    ...(n.parentId ? { parentId: n.parentId } : {}),
    ...(n.extent ? { extent: n.extent } : {}),
    ...(n.style ? { style: n.style } : {}),
    ...(n.width ? { width: n.width } : {}),
    ...(n.height ? { height: n.height } : {})
  }));

  const cleanEdges = (edges || []).map(e => ({
    id: e.id,
    source: e.source,
    target: e.target,
    sourceHandle: normalizeHandleId(e.sourceHandle) || null,
    targetHandle: normalizeHandleId(e.targetHandle) || null,
    type: e.type || 'deletable',
    animated: e.animated !== false,
    label: e.label || '',
    data: e.data || {},
    style: e.style || { stroke: '#58a6ff', strokeWidth: 2 }
  }));

  return {
    $schema: DIAGRAM_SCHEMA_VERSION,
    version: 1,
    id: id || 'diagram_' + Date.now(),
    title: title.trim() || 'Untitled Diagram',
    description: description || '',
    exportedAt: new Date().toISOString(),
    appVersion: '1.0.0',
    viewport: {
      x: Math.round(viewport?.x || 0),
      y: Math.round(viewport?.y || 0),
      zoom: Number((viewport?.zoom || 1).toFixed(3))
    },
    stats: {
      nodesCount: cleanNodes.length,
      edgesCount: cleanEdges.length
    },
    nodes: cleanNodes,
    edges: cleanEdges
  };
}

/**
 * Валидирует и нормализует загруженный JSON файл
 */
export function validateAndParseDiagramProject(jsonContent) {
  let parsed;
  try {
    parsed = typeof jsonContent === 'string' ? JSON.parse(jsonContent) : jsonContent;
  } catch (err) {
    throw new Error('Файл не является корректным JSON документом: ' + err.message);
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Некорректная структура файла проекта.');
  }

  // Check nodes array
  const rawNodes = parsed.nodes || parsed.data?.nodes || [];
  if (!Array.isArray(rawNodes)) {
    throw new Error('В файле отсутствует массив блоков (nodes).');
  }

  const rawEdges = parsed.edges || parsed.data?.edges || [];

  const validNodes = rawNodes.map((n, idx) => {
    const id = n.id || `imported_node_${idx}_${Date.now()}`;
    const type = n.type || (n.data?.lines ? 'logicNode' : (n.data?.text !== undefined ? 'textNode' : 'hierarchyNode'));
    const pos = n.position || { x: 100 + (idx % 4) * 220, y: 100 + Math.floor(idx / 4) * 180 };

    return {
      ...n,
      id,
      type,
      position: { x: Number(pos.x) || 0, y: Number(pos.y) || 0 },
      data: {
        ...(n.data || {}),
        items: Array.isArray(n.data?.items) ? n.data.items : [],
        lines: Array.isArray(n.data?.lines) ? n.data.lines : []
      }
    };
  });

  const validEdges = Array.isArray(rawEdges) ? rawEdges.map((e, idx) => ({
    ...e,
    id: e.id || `imported_edge_${idx}_${Date.now()}`,
    source: String(e.source),
    target: String(e.target),
    sourceHandle: normalizeHandleId(e.sourceHandle) || null,
    targetHandle: normalizeHandleId(e.targetHandle) || null,
    type: e.type || 'deletable',
    animated: e.animated !== false
  })) : [];

  return {
    isValid: true,
    schema: parsed.$schema || 'legacy-disposal-diagram',
    title: parsed.title || parsed.name || 'Импортированная схема',
    description: parsed.description || '',
    exportedAt: parsed.exportedAt || null,
    viewport: parsed.viewport || { x: 0, y: 0, zoom: 1 },
    nodes: validNodes,
    edges: validEdges
  };
}

/**
 * Скачивание проекта в виде .diagram файла
 */
export function downloadDiagramProjectFile(projectData, customFilename) {
  const serialized = serializeDiagramProject(projectData);
  const jsonStr = JSON.stringify(serialized, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const cleanName = (customFilename || serialized.title || 'diagram')
    .replace(/[\\/:*?"<>|]/g, '_')
    .trim();
  const filename = cleanName.endsWith('.diagram') ? cleanName : `${cleanName}.diagram`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Считывание файла из input/drag-and-drop
 */
export function readDiagramFileAsync(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error('Файл не выбран.'));
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = validateAndParseDiagramProject(e.target.result);
        resolve(parsed);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Ошибка чтения файла.'));
    reader.readAsText(file);
  });
}
