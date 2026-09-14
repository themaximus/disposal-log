import React, { useState, useEffect, useContext, useRef } from 'react';
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
  label = '',
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
  const onUpdateEdgeLabel = data?.onUpdateEdgeLabel || actions?.onUpdateEdgeLabel;

  const currentLabel = label || data?.label || '';
  const [isEditing, setIsEditing] = useState(false);
  const [tempLabel, setTempLabel] = useState(currentLabel);
  const inputRef = useRef(null);

  useEffect(() => {
    setTempLabel(currentLabel);
  }, [currentLabel]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDelete = (e) => {
    e.stopPropagation();
    if (onDeleteEdge) {
      onDeleteEdge(id);
    }
  };

  const handleStartEdit = (e) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleSave = () => {
    setIsEditing(false);
    if (onUpdateEdgeLabel && tempLabel !== currentLabel) {
      onUpdateEdgeLabel(id, tempLabel.trim());
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.stopPropagation();
      handleSave();
    } else if (e.key === 'Escape') {
      e.stopPropagation();
      setTempLabel(currentLabel);
      setIsEditing(false);
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
          {isEditing ? (
            <div className="diagram-edge-edit-box">
              <input
                ref={inputRef}
                type="text"
                className="diagram-edge-input"
                value={tempLabel}
                onChange={(e) => setTempLabel(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleSave}
                placeholder="Подпись связи..."
              />
              <button
                className="diagram-edge-save-btn"
                onClick={handleSave}
                title="Сохранить (Enter)"
              >
                ✓
              </button>
            </div>
          ) : (
            <div className="diagram-edge-view-box">
              <button
                className={`diagram-edge-label-btn ${!currentLabel ? 'is-placeholder' : ''}`}
                onClick={handleStartEdit}
                title="Кликните, чтобы изменить подпись связи"
              >
                {currentLabel ? (
                  <>
                    <span className="diagram-edge-text">{currentLabel}</span>
                    <span className="diagram-edge-pencil-icon">✎</span>
                  </>
                ) : (
                  <span className="diagram-edge-placeholder">+ текст</span>
                )}
              </button>
              <button
                className="diagram-edge-delete-btn"
                onClick={handleDelete}
                title="Удалить связь"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export default React.memo(DeletableEdge);
