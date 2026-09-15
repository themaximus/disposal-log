// diagramExportService.js - Экспорт холста схем в PNG / SVG / PDF в высоком разрешении
import { toPng, toSvg } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { getNodesBounds } from '@xyflow/react';

/**
 * Скачивание dataUrl в файл браузером
 */
function downloadDataUrl(dataUrl, filename) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Главная функция экспорта изображения или документа схемы
 */
export async function exportDiagram({
  nodes = [],
  scope = 'all', // 'all' | 'selection'
  selectedNodeIds = [],
  format = 'png', // 'png' | 'svg' | 'pdf'
  scale = 2, // 1 | 2 | 3
  background = 'canvas', // 'canvas' (#0d1117) | 'transparent' | 'white' | 'dark-card' (#161b22)
  title = 'Схема'
}) {
  const selectedSet = new Set(selectedNodeIds);
  const nodesToExport = scope === 'selection'
    ? nodes.filter(n => selectedSet.has(n.id))
    : nodes;

  if (!nodesToExport || nodesToExport.length === 0) {
    throw new Error(scope === 'selection' ? 'Не выбрано ни одного блока для экспорта.' : 'Схема пуста, нет блоков для экспорта.');
  }

  const viewportElement = document.querySelector('.react-flow__viewport');
  if (!viewportElement) {
    throw new Error('Элемент холста не найден в DOM.');
  }

  // Вычисляем границы целевых блоков
  const bounds = getNodesBounds(nodesToExport);
  const padding = 60;
  const width = Math.ceil(bounds.width + padding * 2);
  const height = Math.ceil(bounds.height + padding * 2);

  // Очистка имени файла
  const cleanTitle = (title || 'diagram')
    .replace(/[\\/:*?"<>|]/g, '_')
    .trim();
  const timestamp = new Date().toISOString().slice(0, 10);
  const baseFilename = `${cleanTitle}_${scope === 'selection' ? 'selection_' : ''}${timestamp}`;

  // Определение цвета фона
  let bgColor = '#0d1117';
  if (background === 'transparent') {
    bgColor = null;
  } else if (background === 'white') {
    bgColor = '#ffffff';
  } else if (background === 'dark-card') {
    bgColor = '#161b22';
  }

  // Фильтр отсечения посторонних UI элементов
  const filter = (node) => {
    if (!node || !node.classList) return true;
    if (
      node.classList.contains('react-flow__minimap') ||
      node.classList.contains('react-flow__controls') ||
      node.classList.contains('diagram-floating-selection-bar') ||
      node.classList.contains('react-flow__panel') ||
      node.classList.contains('react-flow__selection') ||
      node.classList.contains('row-hover-actions') ||
      node.classList.contains('root-hover-actions') ||
      node.classList.contains('root-color-palette-popover') ||
      node.classList.contains('emoji-picker-popover')
    ) {
      return false;
    }

    if (scope === 'selection' && node.classList.contains('react-flow__node')) {
      const id = node.getAttribute('data-id');
      if (id && !selectedSet.has(id)) return false;
    }

    return true;
  };

  const exportOptions = {
    backgroundColor: bgColor,
    width,
    height,
    style: {
      width: `${width}px`,
      height: `${height}px`,
      transform: `translate(${-(bounds.x - padding)}px, ${-(bounds.y - padding)}px) scale(1)`,
      transformOrigin: 'top left'
    },
    pixelRatio: Number(scale) || 2,
    filter
  };

  try {
    if (format === 'png') {
      const dataUrl = await toPng(viewportElement, exportOptions);
      downloadDataUrl(dataUrl, `${baseFilename}.png`);
      return { success: true, filename: `${baseFilename}.png` };
    }

    if (format === 'svg') {
      const dataUrl = await toSvg(viewportElement, exportOptions);
      downloadDataUrl(dataUrl, `${baseFilename}.svg`);
      return { success: true, filename: `${baseFilename}.svg` };
    }

    if (format === 'pdf') {
      // Для PDF генерируем четкий растровый слой высокого разрешения (минимум 2x)
      const dataUrl = await toPng(viewportElement, {
        ...exportOptions,
        backgroundColor: background === 'transparent' ? '#ffffff' : bgColor, // PDF на прозрачном фоне часто отображается некорректно в просмотрщиках
        pixelRatio: Math.max(2, Number(scale) || 2)
      });

      const orientation = width >= height ? 'landscape' : 'portrait';
      const pdf = new jsPDF({
        orientation,
        unit: 'px',
        format: [width, height],
        hotfixes: ['px_scaling']
      });

      pdf.addImage(dataUrl, 'PNG', 0, 0, width, height);
      pdf.save(`${baseFilename}.pdf`);
      return { success: true, filename: `${baseFilename}.pdf` };
    }

    throw new Error(`Неподдерживаемый формат: ${format}`);
  } catch (err) {
    console.error('Export diagram error:', err);
    throw new Error('Не удалось экспортировать схему: ' + err.message);
  }
}
