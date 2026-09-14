import React, { useState, useEffect, useContext, useRef } from 'react';
import { Handle, Position } from '@xyflow/react';
import { DiagramActionsContext } from '../DiagramActionsContext';

export default function LogicStepNode({ id, data, isConnectable }) {
  const actions = useContext(DiagramActionsContext);
  const onEditNode = actions?.onEditNode || data?.onEdit;
  const onDeleteNode = actions?.onDeleteNode || data?.onDelete;
  const onQuickAdd = actions?.onQuickAdd || data?.onQuickAdd;
  const onOpenTagModal = actions?.onOpenTagModal || data?.onOpenTagModal;
  const onUpdateLogicLine = actions?.onUpdateLogicLine;
  const onDeleteLogicLine = actions?.onDeleteLogicLine;
  const onUpdateLogicTitle = actions?.onUpdateLogicTitle;

  const [copied, setCopied] = useState(false);
  const [editingRowIdx, setEditingRowIdx] = useState(null);
  const [lineDraft, setLineDraft] = useState({ code: '', comment: '', icon: '⚡', prefix: '├── ' });
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(data.title || 'ExecuteLogicStep()');

  const title = data.title || 'ExecuteLogicStep()';
  const nodeType = data.nodeType || 'LOGIC';
  const lines = data.lines || [];
  const codeInputRef = useRef(null);
  const titleInputRef = useRef(null);

  useEffect(() => {
    setTitleDraft(title);
  }, [title]);

  useEffect(() => {
    if (editingRowIdx !== null && codeInputRef.current) {
      codeInputRef.current.focus();
      codeInputRef.current.select();
    }
  }, [editingRowIdx]);

  useEffect(() => {
    if (editingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [editingTitle]);

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
    if (onOpenTagModal) {
      onOpenTagModal(id);
    }
  };

  const handleStartRowEdit = (idx, line) => {
    setEditingRowIdx(idx);
    setLineDraft({
      code: line.code || '',
      comment: line.comment || '',
      icon: line.icon || '⚡',
      prefix: line.prefix || '├── '
    });
  };

  const handleSaveLine = (idx) => {
    if (onUpdateLogicLine && lineDraft.code.trim()) {
      onUpdateLogicLine(id, idx, lineDraft);
    }
    setEditingRowIdx(null);
  };

  const handleLineKeyDown = (e, idx) => {
    if (e.key === 'Enter') {
      e.stopPropagation();
      handleSaveLine(idx);
    } else if (e.key === 'Escape') {
      e.stopPropagation();
      setEditingRowIdx(null);
    }
  };

  const handleDeleteLine = (e, idx) => {
    e.stopPropagation();
    if (onDeleteLogicLine) {
      onDeleteLogicLine(id, idx);
    }
    setEditingRowIdx(null);
  };

  const handleSaveTitle = () => {
    if (onUpdateLogicTitle && titleDraft.trim()) {
      onUpdateLogicTitle(id, titleDraft.trim());
    }
    setEditingTitle(false);
  };

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.stopPropagation();
      handleSaveTitle();
    } else if (e.key === 'Escape') {
      e.stopPropagation();
      setTitleDraft(title);
      setEditingTitle(false);
    }
  };

  const handleQuickAddClick = (e) => {
    e.stopPropagation();
    if (onQuickAdd) {
      onQuickAdd(id);
      // Give the new line immediate focus
      setEditingRowIdx(lines.length);
      setLineDraft({
        prefix: '└── ',
        icon: '⚡',
        code: 'ExecuteAction()',
        comment: 'Новый шаг логики'
      });
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
          <button
            className="card-action-icon-btn"
            onClick={(e) => { e.stopPropagation(); if (onEditNode) onEditNode(id); }}
            title="Редактировать структуру (✎)"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button
            className="card-action-icon-btn btn-trash"
            onClick={(e) => { e.stopPropagation(); if (onDeleteNode) onDeleteNode(id); }}
            title="Удалить этот блок (🗑️)"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>

      <div className="card-tree-content">
        {editingTitle ? (
          <div className="tree-root-row-edit" onClick={(e) => e.stopPropagation()}>
            <span className="logic-icon">⚙️</span>
            <input
              ref={titleInputRef}
              type="text"
              className="root-inline-input"
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onKeyDown={handleTitleKeyDown}
              placeholder="ClassName.MethodName()"
            />
            <button className="row-inline-save-btn" onClick={handleSaveTitle} title="Сохранить">✓</button>
            <button className="row-inline-del-btn" onClick={() => setEditingTitle(false)} title="Отмена">✕</button>
          </div>
        ) : (
          <div
            className="tree-root-row logic-root-row tree-root-interactive"
            onClick={(e) => { e.stopPropagation(); setEditingTitle(true); }}
            title="Кликните для редактирования метода/заголовка"
          >
            <span className="logic-icon">⚙️</span>
            <span className="root-path-text logic-method-name">{title}</span>
            <span className="row-hover-pencil">✎</span>
          </div>
        )}

        <div className="tree-items-list">
          {lines.map((line, idx) => {
            const isEditing = editingRowIdx === idx;

            if (isEditing) {
              return (
                <div key={idx} className="tree-item-row-edit" onClick={(e) => e.stopPropagation()}>
                  <span className="tree-branch-prefix">{line.prefix || '├── '}</span>
                  <input
                    type="text"
                    className="row-inline-icon-input"
                    value={lineDraft.icon}
                    onChange={(e) => setLineDraft({ ...lineDraft, icon: e.target.value })}
                    title="Иконка шага"
                  />
                  <input
                    ref={codeInputRef}
                    type="text"
                    className="row-inline-code-input"
                    value={lineDraft.code}
                    onChange={(e) => setLineDraft({ ...lineDraft, code: e.target.value })}
                    onKeyDown={(e) => handleLineKeyDown(e, idx)}
                    placeholder="Код шага (напр. HandleAction())"
                  />
                  <input
                    type="text"
                    className="row-inline-comment-input"
                    value={lineDraft.comment}
                    onChange={(e) => setLineDraft({ ...lineDraft, comment: e.target.value })}
                    onKeyDown={(e) => handleLineKeyDown(e, idx)}
                    placeholder="Комментарий"
                  />
                  <button className="row-inline-save-btn" onClick={() => handleSaveLine(idx)} title="Сохранить (Enter)">✓</button>
                  <button className="row-inline-del-btn" onClick={(e) => handleDeleteLine(e, idx)} title="Удалить строку">✕</button>
                </div>
              );
            }

            return (
              <div
                key={idx}
                className="tree-item-row logic-code-row tree-item-interactive"
                onClick={(e) => {
                  e.stopPropagation();
                  handleStartRowEdit(idx, line);
                }}
                title="Кликните, чтобы редактировать этот шаг"
              >
                <span className="tree-branch-prefix">{line.prefix || '├── '}</span>
                {line.icon && <span className="item-symbol-icon">{line.icon}</span>}
                <code className="logic-code-text">{line.code}</code>
                {line.comment && <span className="item-details-text logic-comment">({line.comment})</span>}
                <div className="row-hover-actions">
                  <span className="row-hover-pencil">✎</span>
                  <button
                    className="row-hover-delete-btn"
                    onClick={(e) => handleDeleteLine(e, idx)}
                    title="Удалить строку"
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <button
          className="btn-quick-add-tree-item"
          onClick={handleQuickAddClick}
          title="Быстро добавить строчку кода или проверку"
        >
          <span>+ Добавить строку</span>
        </button>
      </div>
    </div>
  );
}
