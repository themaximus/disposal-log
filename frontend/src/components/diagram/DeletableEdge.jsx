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
          className="nodrag nopan diagram-edge-pill-wrapper"
        >
          <button
            type="button"
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

export default React.memo(DeletableEdge);

