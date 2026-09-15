// useDiagramSmartGuides.js - Хук мягкого магнетирования блоков и прилипания к сетке холста
import { useCallback, useRef } from 'react';

const DEFAULT_SNAP_THRESHOLD = 8; // Порог дистанции мягкого примагничивания в пикселях холста

export function useDiagramSmartGuides({
  nodesRef,
  snapToGrid = true,
  gridSize = 18,
  snapThreshold = DEFAULT_SNAP_THRESHOLD,
  enabled = true
}) {
  const isDraggingRef = useRef(false);

  const handleNodesChangeWithSnapping = useCallback((changes, originalOnNodesChange, triggerAutoSave) => {
    if (!enabled) {
      originalOnNodesChange(changes);
      const hasPosOrRemove = changes.some(
        c => (c.type === 'position' && c.dragging === false) || c.type === 'remove' || c.type === 'dimensions'
      );
      if (hasPosOrRemove && triggerAutoSave) triggerAutoSave();
      return;
    }

    const posChange = changes.find(c => c.type === 'position' && c.dragging && c.position);

    if (!posChange) {
      const finishedDrag = changes.some(c => c.type === 'position' && c.dragging === false);
      if (finishedDrag) {
        isDraggingRef.current = false;
      }
      originalOnNodesChange(changes);
      const hasPosOrRemove = changes.some(
        c => (c.type === 'position' && c.dragging === false) || c.type === 'remove' || c.type === 'dimensions'
      );
      if (hasPosOrRemove && triggerAutoSave) triggerAutoSave();
      return;
    }

    isDraggingRef.current = true;
    const currentNodes = nodesRef.current || [];
    const draggedNode = currentNodes.find(n => n.id === posChange.id);

    if (!draggedNode) {
      originalOnNodesChange(changes);
      return;
    }

    // Размеры и масштаб перемещаемого узла
    const scale = draggedNode.data?.scale || 1;
    const rawW = draggedNode.measured?.width || draggedNode.width || 320;
    const rawH = draggedNode.measured?.height || draggedNode.height || 180;
    const draggedW = rawW * scale;
    const draggedH = rawH * scale;

    let targetX = posChange.position.x;
    let targetY = posChange.position.y;

    // Соседние блоки (исключая сам перемещаемый блок и секции-группы)
    const otherNodes = currentNodes.filter(n => n.id !== draggedNode.id && n.type !== 'sectionNode');

    let bestSnapX = null;
    let minDiffX = snapThreshold;

    let bestSnapY = null;
    let minDiffY = snapThreshold;

    for (const other of otherNodes) {
      const otherScale = other.data?.scale || 1;
      const otherW = (other.measured?.width || other.width || 320) * otherScale;
      const otherH = (other.measured?.height || other.height || 180) * otherScale;
      const otherX = other.position.x;
      const otherY = other.position.y;

      const otherLeft = otherX;
      const otherCenterX = otherX + otherW / 2;
      const otherRight = otherX + otherW;

      const otherTop = otherY;
      const otherCenterY = otherY + otherH / 2;
      const otherBottom = otherY + otherH;

      // 1. По левому краю
      const diffLeftLeft = Math.abs(targetX - otherLeft);
      if (diffLeftLeft < minDiffX) {
        minDiffX = diffLeftLeft;
        bestSnapX = otherLeft;
      }

      // 2. По центру X
      const curCenterX = targetX + draggedW / 2;
      const diffCenterCenter = Math.abs(curCenterX - otherCenterX);
      if (diffCenterCenter < minDiffX) {
        minDiffX = diffCenterCenter;
        bestSnapX = otherCenterX - draggedW / 2;
      }

      // 3. По правому краю
      const curRight = targetX + draggedW;
      const diffRightRight = Math.abs(curRight - otherRight);
      if (diffRightRight < minDiffX) {
        minDiffX = diffRightRight;
        bestSnapX = otherRight - draggedW;
      }

      // 4. Стык справа (левый край блока касается правого края соседа)
      const diffLeftRight = Math.abs(targetX - otherRight);
      if (diffLeftRight < minDiffX) {
        minDiffX = diffLeftRight;
        bestSnapX = otherRight;
      }

      // 5. Стык слева (правый край блока касается левого края соседа)
      const diffRightLeft = Math.abs(curRight - otherLeft);
      if (diffRightLeft < minDiffX) {
        minDiffX = diffRightLeft;
        bestSnapX = otherLeft - draggedW;
      }

      // Y: 1. По верхнему краю
      const diffTopTop = Math.abs(targetY - otherTop);
      if (diffTopTop < minDiffY) {
        minDiffY = diffTopTop;
        bestSnapY = otherTop;
      }

      // Y: 2. По центру Y
      const curCenterY = targetY + draggedH / 2;
      const diffCenterCenterY = Math.abs(curCenterY - otherCenterY);
      if (diffCenterCenterY < minDiffY) {
        minDiffY = diffCenterCenterY;
        bestSnapY = otherCenterY - draggedH / 2;
      }

      // Y: 3. По нижнему краю
      const curBottom = targetY + draggedH;
      const diffBottomBottom = Math.abs(curBottom - otherBottom);
      if (diffBottomBottom < minDiffY) {
        minDiffY = diffBottomBottom;
        bestSnapY = otherBottom - draggedH;
      }

      // Y: 4. Стык снизу (верх блока касается низа соседа)
      const diffTopBottom = Math.abs(targetY - otherBottom);
      if (diffTopBottom < minDiffY) {
        minDiffY = diffTopBottom;
        bestSnapY = otherBottom;
      }

      // Y: 5. Стык сверху (низ блока касается верха соседа)
      const diffBottomTop = Math.abs(curBottom - otherTop);
      if (diffBottomTop < minDiffY) {
        minDiffY = diffBottomTop;
        bestSnapY = otherTop - draggedH;
      }
    }

    // Применяем примагничивание по X (или по сетке)
    if (bestSnapX !== null) {
      targetX = bestSnapX;
    } else if (snapToGrid) {
      targetX = Math.round(targetX / gridSize) * gridSize;
    }

    // Применяем примагничивание по Y (или по сетке)
    if (bestSnapY !== null) {
      targetY = bestSnapY;
    } else if (snapToGrid) {
      targetY = Math.round(targetY / gridSize) * gridSize;
    }

    posChange.position.x = targetX;
    posChange.position.y = targetY;

    originalOnNodesChange(changes);
  }, [enabled, snapToGrid, gridSize, snapThreshold, nodesRef]);

  const clearGuides = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  return {
    handleNodesChangeWithSnapping,
    clearGuides
  };
}

export default useDiagramSmartGuides;
