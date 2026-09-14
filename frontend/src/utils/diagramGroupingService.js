// diagramGroupingService.js - Геометрические вычисления и трансформация секций (Domain Service)

export class DiagramGroupingService {
  /**
   * Топологический порядок рендеринга: секции всегда должны быть раньше дочерних узлов в массиве React Flow
   */
  static sortNodesParentsFirst(nds = []) {
    const sections = [];
    const children = [];
    const others = [];
    nds.forEach(n => {
      if (n.type === 'sectionNode') {
        sections.push(n);
      } else if (n.parentId) {
        children.push(n);
      } else {
        others.push(n);
      }
    });
    return [...sections, ...others, ...children];
  }

  /**
   * Динамический подсчёт дочерних узлов для каждой секции
   */
  static calculateChildCounts(nodes = []) {
    const counts = {};
    nodes.forEach(n => {
      if (n.parentId) {
        counts[n.parentId] = (counts[n.parentId] || 0) + 1;
      }
    });
    return nodes.map(n => {
      if (n.type === 'sectionNode') {
        const count = counts[n.id] || 0;
        if (n.data?.childCount !== count) {
          return {
            ...n,
            data: { ...n.data, childCount: count }
          };
        }
      }
      return n;
    });
  }

  /**
   * Сгруппировать выбранные узлы в новую секцию (sectionNode) с расчётом относительных координат
   */
  static groupSelectedNodes(currentNodes, options = {}) {
    const nodesToGroup = currentNodes.filter(n => n.selected && n.type !== 'sectionNode');
    if (nodesToGroup.length === 0) return null;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    // Определение абсолютных позиций для каждого группируемого узла
    const nodesWithAbsPos = nodesToGroup.map(node => {
      let absX = node.position.x;
      let absY = node.position.y;
      if (node.parentId) {
        const parent = currentNodes.find(p => p.id === node.parentId);
        if (parent) {
          absX += parent.position.x;
          absY += parent.position.y;
        }
      }
      const width = node.measured?.width || node.width || (node.type === 'hierarchyNode' ? 520 : 480);
      const height = node.measured?.height || node.height || 260;
      return {
        node,
        absX,
        absY,
        width,
        height
      };
    });

    nodesWithAbsPos.forEach(({ absX, absY, width, height }) => {
      if (absX < minX) minX = absX;
      if (absY < minY) minY = absY;
      if (absX + width > maxX) maxX = absX + width;
      if (absY + height > maxY) maxY = absY + height;
    });

    const padding = options.padding || 45;
    const headerHeight = options.headerHeight || 60;
    const sectionX = Math.round(minX - padding);
    const sectionY = Math.round(minY - padding - headerHeight);
    const sectionW = Math.round((maxX - minX) + padding * 2);
    const sectionH = Math.round((maxY - minY) + padding * 2 + headerHeight);

    const sectionId = `section-${Date.now()}`;
    const newSection = {
      id: sectionId,
      type: 'sectionNode',
      position: { x: sectionX, y: sectionY },
      width: sectionW,
      height: sectionH,
      initialWidth: sectionW,
      initialHeight: sectionH,
      measured: { width: sectionW, height: sectionH },
      style: { width: sectionW, height: sectionH },
      data: {
        label: options.label || `Секция (${nodesToGroup.length} эл.)`,
        theme: options.theme || 'crimson',
        borderStyle: options.borderStyle || 'dashed',
        icon: options.icon || '📁',
        childCount: nodesToGroup.length,
        width: sectionW,
        height: sectionH
      },
      zIndex: -1
    };

    const groupedIds = new Set(nodesToGroup.map(n => n.id));
    const updatedNodes = currentNodes.map(n => {
      if (!groupedIds.has(n.id)) return n;
      const item = nodesWithAbsPos.find(i => i.node.id === n.id);
      return {
        ...n,
        parentId: sectionId,
        position: {
          x: Math.round(item.absX - sectionX),
          y: Math.round(item.absY - sectionY)
        },
        selected: false
      };
    });

    return this.sortNodesParentsFirst([newSection, ...updatedNodes]);
  }

  /**
   * Разгруппировать секцию (возвращает обновлённый массив с пересчитанными абсолютными координатами)
   */
  static ungroupSection(currentNodes, sectionId) {
    const sectionNode = currentNodes.find(n => n.id === sectionId);
    if (!sectionNode) return currentNodes;

    const groupPos = sectionNode.position;
    const updatedNodes = currentNodes
      .filter(n => n.id !== sectionId)
      .map(n => {
        if (n.parentId === sectionId) {
          const { parentId, ...rest } = n;
          return {
            ...rest,
            position: {
              x: Math.round(n.position.x + groupPos.x),
              y: Math.round(n.position.y + groupPos.y)
            },
            selected: true
          };
        }
        return n;
      });

    return updatedNodes;
  }

  /**
   * Масштабирование одиночного узла
   */
  static scaleSingleNode(currentNodes, nodeId, newScale) {
    const clampedScale = Math.min(3.0, Math.max(0.3, Math.round(newScale * 100) / 100));
    return currentNodes.map(n => {
      if (n.id !== nodeId) return n;
      const oldScale = n.data?.scale || 1;
      const factor = clampedScale / oldScale;

      const updatedStyle = { ...(n.style || {}) };
      if (updatedStyle.width) updatedStyle.width = Math.round(updatedStyle.width * factor);
      if (updatedStyle.height) updatedStyle.height = Math.round(updatedStyle.height * factor);

      return {
        ...n,
        style: updatedStyle,
        data: {
          ...n.data,
          scale: clampedScale
        }
      };
    });
  }

  /**
   * Масштабирование секции и всех её дочерних блоков без потери взаимного расположения
   */
  static scaleSectionAndChildren(currentNodes, sectionId, factor) {
    const sectionNode = currentNodes.find(n => n.id === sectionId);
    if (!sectionNode) return currentNodes;

    const rawW = sectionNode.width || sectionNode.style?.width || sectionNode.measured?.width || 620;
    const rawH = sectionNode.height || sectionNode.style?.height || sectionNode.measured?.height || 420;
    const curW = typeof rawW === 'string' ? parseFloat(rawW) : rawW;
    const curH = typeof rawH === 'string' ? parseFloat(rawH) : rawH;

    const newW = Math.max(120, Math.round(curW * factor));
    const newH = Math.max(80, Math.round(curH * factor));
    const actualFactor = newW / curW;

    const curSecScale = sectionNode.data?.scale || 1;
    const newSecScale = Math.min(3.0, Math.max(0.3, Math.round((curSecScale * actualFactor) * 100) / 100));

    return currentNodes.map(n => {
      if (n.id === sectionId) {
        return {
          ...n,
          width: newW,
          height: newH,
          initialWidth: newW,
          initialHeight: newH,
          measured: { width: newW, height: newH },
          style: {
            ...(n.style || {}),
            width: newW,
            height: newH
          },
          data: {
            ...n.data,
            width: newW,
            height: newH,
            scale: newSecScale
          }
        };
      }

      if (n.parentId === sectionId) {
        const curChildScale = n.data?.scale || 1;
        const newChildScale = Math.min(3.0, Math.max(0.3, Math.round((curChildScale * actualFactor) * 100) / 100));

        const updatedStyle = { ...(n.style || {}) };
        const rawChildW = n.width || updatedStyle.width;
        const rawChildH = n.height || updatedStyle.height;
        const newChildW = rawChildW ? Math.round(rawChildW * actualFactor) : undefined;
        const newChildH = rawChildH ? Math.round(rawChildH * actualFactor) : undefined;
        if (newChildW) updatedStyle.width = newChildW;
        if (newChildH) updatedStyle.height = newChildH;

        return {
          ...n,
          ...(newChildW ? { width: newChildW, initialWidth: newChildW } : {}),
          ...(newChildH ? { height: newChildH, initialHeight: newChildH } : {}),
          position: {
            x: Math.round(n.position.x * actualFactor),
            y: Math.round(n.position.y * actualFactor)
          },
          style: updatedStyle,
          data: {
            ...n.data,
            scale: newChildScale
          }
        };
      }

      return n;
    });
  }

  /**
   * Пропорциональный пересчет дочерних узлов при завершении ручного ресайза секции
   */
  static proportionalResizeSectionChildren(currentNodes, sectionId, oldW, oldH, newW, newH) {
    if (!oldW || !newW || oldW === newW) return currentNodes;
    const widthRatio = newW / oldW;
    const heightRatio = oldH && newH ? newH / oldH : widthRatio;
    const avgRatio = (widthRatio + heightRatio) / 2;

    return currentNodes.map(n => {
      if (n.id === sectionId) {
        return {
          ...n,
          width: newW,
          height: newH,
          initialWidth: newW,
          initialHeight: newH,
          measured: { width: newW, height: newH },
          style: {
            ...(n.style || {}),
            width: newW,
            height: newH
          },
          data: {
            ...n.data,
            width: newW,
            height: newH
          }
        };
      }

      if (n.parentId !== sectionId) return n;

      const curChildScale = n.data?.scale || 1;
      const newChildScale = Math.min(3.0, Math.max(0.3, Math.round((curChildScale * avgRatio) * 100) / 100));

      const updatedStyle = { ...(n.style || {}) };
      if (updatedStyle.width) updatedStyle.width = Math.round(updatedStyle.width * avgRatio);
      if (updatedStyle.height) updatedStyle.height = Math.round(updatedStyle.height * avgRatio);

      return {
        ...n,
        position: {
          x: Math.round(n.position.x * widthRatio),
          y: Math.round(n.position.y * heightRatio)
        },
        style: updatedStyle,
        data: {
          ...n.data,
          scale: newChildScale
        }
      };
    });
  }

  /**
   * Масштабирование выделенной группы узлов (секции + блоки)
   */
  static scaleSelectedNodes(currentNodes, selectedIds = [], factor, isAbsolute = false) {
    if (!selectedIds.length) return currentNodes;
    const selectedSet = new Set(selectedIds);

    // Секции среди выделенных
    const selectedSections = currentNodes.filter(n => selectedSet.has(n.id) && n.type === 'sectionNode');
    const selectedSectionIds = new Set(selectedSections.map(s => s.id));

    // Дочерние узлы этих секций (чтобы не масштабировать их дважды)
    const childrenOfSelectedSections = new Set(
      currentNodes.filter(n => n.parentId && selectedSectionIds.has(n.parentId)).map(n => n.id)
    );

    if (isAbsolute && factor === 1.0) {
      return currentNodes.map(n => {
        if (selectedSet.has(n.id) || childrenOfSelectedSections.has(n.id)) {
          return {
            ...n,
            data: {
              ...n.data,
              scale: 1.0
            }
          };
        }
        return n;
      });
    }

    // Свободные выделенные ноды (не дочерние выбранных секций)
    const standaloneNodes = currentNodes.filter(
      n => selectedSet.has(n.id) && n.type !== 'sectionNode' && !childrenOfSelectedSections.has(n.id)
    );

    let updated = currentNodes;

    // 1. Масштабируем каждую выбранную секцию со всеми её детьми
    selectedSections.forEach(sec => {
      updated = this.scaleSectionAndChildren(updated, sec.id, factor);
    });

    // 2. Если есть свободные выделенные ноды (2 и более), масштабируем их относительно общего центра
    if (standaloneNodes.length >= 2) {
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      standaloneNodes.forEach(n => {
        if (n.position.x < minX) minX = n.position.x;
        if (n.position.x > maxX) maxX = n.position.x;
        if (n.position.y < minY) minY = n.position.y;
        if (n.position.y > maxY) maxY = n.position.y;
      });
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;

      const standaloneIds = new Set(standaloneNodes.map(n => n.id));

      updated = updated.map(n => {
        if (!standaloneIds.has(n.id)) return n;
        const curScale = n.data?.scale || 1;
        const newScale = Math.min(3.0, Math.max(0.3, Math.round((curScale * factor) * 100) / 100));

        const updatedStyle = { ...(n.style || {}) };
        if (updatedStyle.width) updatedStyle.width = Math.round(updatedStyle.width * factor);
        if (updatedStyle.height) updatedStyle.height = Math.round(updatedStyle.height * factor);

        return {
          ...n,
          position: {
            x: Math.round(centerX + (n.position.x - centerX) * factor),
            y: Math.round(centerY + (n.position.y - centerY) * factor)
          },
          style: updatedStyle,
          data: {
            ...n.data,
            scale: newScale
          }
        };
      });
    } else if (standaloneNodes.length === 1) {
      // Одиночная свободная выделенная нода
      const single = standaloneNodes[0];
      const curScale = single.data?.scale || 1;
      const newScale = Math.min(3.0, Math.max(0.3, Math.round((curScale * factor) * 100) / 100));
      updated = this.scaleSingleNode(updated, single.id, newScale);
    }

    return updated;
  }

  /**
   * Создать пустую рамку секции
   */
  static createEmptySection(options = {}) {
    const sectionId = `section-${Date.now()}`;
    return {
      id: sectionId,
      type: 'sectionNode',
      position: options.position || { x: 250, y: 120 },
      width: 620,
      height: 420,
      initialWidth: 620,
      initialHeight: 420,
      measured: { width: 620, height: 420 },
      style: options.style || { width: 620, height: 420 },
      data: {
        label: options.label || 'Новая секция',
        theme: options.theme || 'crimson',
        borderStyle: options.borderStyle || 'dashed',
        icon: options.icon || '📁',
        childCount: 0,
        scale: 1.0,
        width: 620,
        height: 420
      },
      zIndex: -1
    };
  }
}

export default DiagramGroupingService;
