import React, { useState } from 'react';
import { Handle, Position } from '@xyflow/react';

export default function LogicStepNode({ id, data, isConnectable }) {
  const [copied, setCopied] = useState(false);

  const title = data.title || 'ExecuteLogicStep()';
  const nodeType = data.nodeType || 'LOGIC';
  const lines = data.lines || [];

  const handleCopy = (e) => {
    e.stopPropagation();
    const text = `${nodeType}: ${title}\n` + lines.map(l => `${l.prefix || ''}${l.code || ''} // ${l.comment || ''}`).join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };

  const handleTagClick = (e) => {
    e.stopPropagation();
    if (data.onOpenTagModal) {
      data.onOpenTagModal(id);
    }
  };

  return (
    <div className="gamedev-hierarchy-card logic-step-card">
      <Handle type="target" position={Position.Left} id="target-left" isConnectable={isConnectable} className="diagram-handle handle-left" />
      <Handle type="source" position={Position.Left} id="source-left" isConnectable={isConnectable} className="diagram-handle handle-left" />
      <Handle type="source" position={Position.Right} id="source-right" isConnectable={isConnectable} className="diagram-handle handle-right" />
      <Handle type="target" position={Position.Right} id="target-right" isConnectable={isConnectable} className="diagram-handle handle-right" />
      <Handle type="target" position={Position.Top} id="target-top" isConnectable={isConnectable} className="diagram-handle handle-top" />
      <Handle type="source" position={Position.Top} id="source-top" isConnectable={isConnectable} className="diagram-handle handle-top" />
      <Handle type="source" position={Position.Bottom} id="source-bottom" isConnectable={isConnectable} className="diagram-handle handle-bottom" />
      <Handle type="target" position={Position.Bottom} id="target-bottom" isConnectable={isConnectable} className="diagram-handle handle-bottom" />

      <div className="card-top-action-bar">
        <span
          className="card-type-badge"
          onClick={handleTagClick}
          style={{ cursor: 'pointer' }}
          title="Кликните для изменения тега"
        >
          {nodeType}
        </span>
        <div className="card-icons-group">
          <button className="card-action-icon-btn" onClick={handleTagClick} title="Привязать к задаче или тегу (@)">@</button>
          <button className={`card-action-icon-btn ${copied ? 'copied' : ''}`} onClick={handleCopy} title="Копировать код (❐)">
            {copied ? '✓' : (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            )}
          </button>
          {data.onEdit && (
            <button className="card-action-icon-btn" onClick={(e) => { e.stopPropagation(); data.onEdit(id); }} title="Редактировать (✎)">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
          )}
          {data.onDelete && (
            <button className="card-action-icon-btn btn-trash" onClick={(e) => { e.stopPropagation(); data.onDelete(id); }} title="Удалить этот блок (🗑️)">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="card-tree-content">
        <div
          className="tree-root-row logic-root-row"
          onClick={() => { if (data.onEdit) data.onEdit(id); }}
          style={{ cursor: 'pointer' }}
          title="Кликните для редактирования заголовка"
        >
          <span className="logic-icon">⚙️</span>
          <span className="root-path-text logic-method-name">{title}</span>
        </div>

        <div className="tree-items-list">
          {lines.map((line, idx) => (
            <div key={idx} className="tree-item-row logic-code-row">
              <span className="tree-branch-prefix">{line.prefix || '├── '}</span>
              {line.icon && <span className="item-symbol-icon">{line.icon}</span>}
              <code className="logic-code-text">{line.code}</code>
              {line.comment && <span className="item-details-text logic-comment">({line.comment})</span>}
            </div>
          ))}
        </div>

        {data.onQuickAdd && (
          <button
            className="btn-quick-add-tree-item"
            onClick={(e) => { e.stopPropagation(); data.onQuickAdd(id); }}
            title="Быстро добавить строчку кода или проверку"
          >
            <span>+ Добавить строку</span>
          </button>
        )}
      </div>
    </div>
  );
}
