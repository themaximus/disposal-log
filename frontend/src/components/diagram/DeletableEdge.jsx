import React from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath
} from '@xyflow/react';

export default function DeletableEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  label,
  data
}) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition
  });

  const handleDelete = (e) => {
    e.stopPropagation();
    if (data?.onDeleteEdge) {
      data.onDeleteEdge(id);
    }
  };

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all'
          }}
          className="nodrag nopan diagram-edge-label-container"
        >
          {label && <span className="diagram-edge-label-badge">{label}</span>}
          <button
            className="diagram-edge-delete-btn"
            onClick={handleDelete}
            title="Удалить связь"
          >
            ✕
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
