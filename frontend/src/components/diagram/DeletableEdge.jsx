import React, { useContext } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath
} from '@xyflow/react';
import { DiagramActionsContext } from '../DiagramActionsContext';

function DeletableEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  selected,
  data = {}
}) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition
  });

  const actions = useContext(DiagramActionsContext);
  const onDeleteEdge = data?.onDeleteEdge || actions?.onDeleteEdge;

  const handleDelete = (e) => {
    e.stopPropagation();
    if (onDeleteEdge) {
      onDeleteEdge(id);
    }
  };

  const edgeStyle = {
    ...style,
    stroke: selected ? '#ff7b72' : (style.stroke || '#58a6ff'),
    strokeWidth: selected ? 3 : (style.strokeWidth || 2),
    filter: selected ? 'drop-shadow(0 0 6px rgba(255, 123, 114, 0.7))' : undefined
  };

  return (
    <>
      {/* Invisible wider path to make clicking on the edge effortless */}
      <path
        d={edgePath}
        fill="none"
        strokeOpacity={0}
        strokeWidth={20}
        className="react-flow__edge-interaction"
        style={{ cursor: 'pointer' }}
      />
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={edgeStyle} />
      {selected && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
              zIndex: 1000
            }}
            className="nodrag nopan diagram-edge-pill-wrapper"
          >
            <button
              type="button"
              className="diagram-edge-delete-btn is-selected-edge"
              onClick={handleDelete}
              title="Удалить связь (или нажмите клавишу Delete)"
            >
              ✕
            </button>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export default React.memo(DeletableEdge);

