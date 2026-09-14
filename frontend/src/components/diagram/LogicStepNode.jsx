import React, { useState, useEffect, useContext, useRef } from 'react';
import { Handle, Position } from '@xyflow/react';
import { DiagramActionsContext } from '../DiagramActionsContext';
import { computeTreePrefix } from './GameDevHierarchyNode';
import EmojiPickerPopover from './EmojiPickerPopover';

export default function LogicStepNode({ id, data, isConnectable }) {
  const actions = useContext(DiagramActionsContext);
  const onOpenInspector = actions?.onOpenInspector || actions?.onEditNode || data?.onEdit;
  const onDeleteNode = actions?.onDeleteNode || data?.onDelete;
  const onQuickAdd = actions?.onQuickAdd || data?.onQuickAdd;
  const onOpenTagModal = actions?.onOpenTagModal || data?.onOpenTagModal;
  const onUpdateLogicLine = actions?.onUpdateLogicLine;
  const onDeleteLogicLine = actions?.onDeleteLogicLine;
  const onAddLogicSubLine = actions?.onAddLogicSubLine;
  const onAddLogicSiblingLine = actions?.onAddLogicSiblingLine;
  const onIndentLogicLine = actions?.onIndentLogicLine;
  const onUpdateLogicTitle = actions?.onUpdateLogicTitle;

  const [copied, setCopied] = useState(false);
  const [editingRowIdx, setEditingRowIdx] = useState(null);
  const [lineDraft, setLineDraft] = useState({ code: '', comment: '', icon: '⚡', level: 0, prefix: '├── ' });
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(data.title || 'ExecuteLogicStep()');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [lineEmojiPickerIdx, setLineEmojiPickerIdx] = useState(null);

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
    const text = `${nodeType}: ${title}\n` + lines.map((l, idx) => {
      const pfx = computeTreePrefix(lines, idx);
      return `${pfx}${l.icon ? l.icon + ' ' : ''}${l.code || ''}${l.comment ? ' // ' + l.comment : ''}`;
    }).join('\n');
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
      level: line.level || 0,
      prefix: line.prefix || '├── '
    });
  };

  const handleSaveLine = (idx) => {
    if (onUpdateLogicLine && lineDraft.code.trim()) {
      onUpdateLogicLine(id, idx, lineDraft);
    }
    setEditingRowIdx(null);
  };

  const handleAddSubRow = (e, idx) => {
    e.stopPropagation();
    const parentLine = lines[idx];
    const parentLevel = parentLine ? (parentLine.level || 0) : 0;
    const subLevel = parentLevel + 1;

    let insertIdx = idx + 1;
    while (insertIdx < lines.length && (lines[insertIdx].level || 0) > parentLevel) {
      insertIdx++;
    }

    if (onAddLogicSubLine) {
      onAddLogicSubLine(id, idx);
    }
    setEditingRowIdx(insertIdx);
    setLineDraft({
      level: subLevel,
      icon: '⚡',
      code: 'ExecuteSubAction()',
      comment: 'Вложенное действие'
    });
  };

  const handleAddSiblingRow = (e, idx) => {
    e.stopPropagation();
    const curLine = lines[idx];
    const curLevel = curLine ? (curLine.level || 0) : 0;

    let insertIdx = idx + 1;
    while (insertIdx < lines.length && (lines[insertIdx].level || 0) > curLevel) {
      insertIdx++;
    }

    if (onAddLogicSiblingLine) {
      onAddLogicSiblingLine(id, idx);
    }
    setEditingRowIdx(insertIdx);
    setLineDraft({
      level: curLevel,
      icon: '⚡',
      code: 'PerformAction()',
      comment: 'Новый шаг'
    });
  };

  const handleIndentDraft = (e, delta) => {
    if (e) e.stopPropagation();
    setLineDraft(prev => ({
      ...prev,
      level: Math.max(0, Math.min(6, (prev.level || 0) + delta))
    }));
  };

  const handleLineKeyDown = (e, idx) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      e.stopPropagation();
      const delta = e.shiftKey ? -1 : 1;
      setLineDraft(prev => ({
        ...prev,
        level: Math.max(0, Math.min(6, (prev.level || 0) + delta))
      }));
    } else if (e.key === 'Enter') {
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
      setEditingRowIdx(lines.length);
      setLineDraft({
        level: lines.length > 0 ? (lines[lines.length - 1].level || 0) : 0,
        icon: '⚡',
        code: 'ExecuteAction()',
        comment: 'Новый шаг логики'
      });
    }
  };

  const handleQuickAddSubClick = (e) => {
    e.stopPropagation();
    if (lines.length === 0) {
      handleQuickAddClick(e);
      return;
    }
    const lastIdx = lines.length - 1;
    handleAddSubRow(e, lastIdx);
  };

  const cardStyle = {
    background: data.customBg,
    borderColor: data.customBorder,
    borderStyle: data.borderStyle || 'solid',
    boxShadow: data.glow ? `0 0 18px ${data.glowColor || 'rgba(88, 166, 255, 0.45)'}` : undefined
  };

  const handleStyle = data.customAccent ? {
    background: data.customAccent,
    borderColor: data.customBg || '#111419'
  } : undefined;

  return (
    <div
      className={`gamedev-hierarchy-card logic-step-card ${data.theme ? `theme-${data.theme}` : ''} ${data.glow ? 'has-glow' : ''}`}
      style={cardStyle}
    >
      <Handle type="target" position={Position.Left} id="target-left" isConnectable={isConnectable} style={handleStyle} className="diagram-handle handle-left" />
      <Handle type="source" position={Position.Left} id="source-left" isConnectable={isConnectable} style={handleStyle} className="diagram-handle handle-left" />
      <Handle type="source" position={Position.Right} id="source-right" isConnectable={isConnectable} style={handleStyle} className="diagram-handle handle-right" />
      <Handle type="target" position={Position.Right} id="target-right" isConnectable={isConnectable} style={handleStyle} className="diagram-handle handle-right" />
      <Handle type="target" position={Position.Top} id="target-top" isConnectable={isConnectable} style={handleStyle} className="diagram-handle handle-top" />
      <Handle type="source" position={Position.Top} id="source-top" isConnectable={isConnectable} style={handleStyle} className="diagram-handle handle-top" />
      <Handle type="source" position={Position.Bottom} id="source-bottom" isConnectable={isConnectable} style={handleStyle} className="diagram-handle handle-bottom" />
      <Handle type="target" position={Position.Bottom} id="target-bottom" isConnectable={isConnectable} style={handleStyle} className="diagram-handle handle-bottom" />

      <div className="card-top-action-bar">
        <span
          className="card-type-badge nodrag"
          onClick={handleTagClick}
          style={{
            cursor: 'pointer',
            background: data.badgeBg,
            color: data.badgeText,
            borderColor: data.badgeText
          }}
          title="Кликните для изменения тега"
        >
          {nodeType}
        </span>
        <div className="card-icons-group nodrag">
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
            className="card-action-icon-btn btn-inspector"
            onClick={(e) => { e.stopPropagation(); if (onOpenInspector) onOpenInspector(id); }}
            title="Свойства и стиль блока (🎨)"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="13.5" cy="6.5" r=".5" fill="currentColor"></circle>
              <circle cx="17.5" cy="10.5" r=".5" fill="currentColor"></circle>
              <circle cx="8.5" cy="7.5" r=".5" fill="currentColor"></circle>
              <circle cx="6.5" cy="12.5" r=".5" fill="currentColor"></circle>
              <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"></path>
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
          <div className="tree-root-row-edit nodrag" onClick={(e) => e.stopPropagation()}>
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
            const branchPrefix = computeTreePrefix(lines, idx);

            if (isEditing) {
              return (
                <div key={idx} className="tree-item-row-edit nodrag" onClick={(e) => e.stopPropagation()}>
                  <span className="tree-branch-prefix">{branchPrefix}</span>
                  
                  {/* Indentation level stepper */}
                  <div className="row-indent-control nodrag">
                    <button
                      type="button"
                      className="btn-indent"
                      onClick={(e) => handleIndentDraft(e, -1)}
                      disabled={(lineDraft.level || 0) <= 0}
                      title="Уменьшить вложенность (Shift+Tab)"
                    >
                      ⇤
                    </button>
                    <span className="indent-level-badge">L{lineDraft.level || 0}</span>
                    <button
                      type="button"
                      className="btn-indent"
                      onClick={(e) => handleIndentDraft(e, 1)}
                      disabled={(lineDraft.level || 0) >= 6}
                      title="Увеличить вложенность (Tab)"
                    >
                      ⇥
                    </button>
                  </div>

                  <div className="row-inline-icon-trigger-wrapper">
                    <button
                      type="button"
                      className="row-inline-icon-picker-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowEmojiPicker(prev => !prev);
                      }}
                      title="Выбрать эмодзи (кликните для открытия каталога)"
                    >
                      <span className="current-icon">{lineDraft.icon || '⚡'}</span>
                      <span className="picker-caret">▾</span>
                    </button>
                    {showEmojiPicker && (
                      <EmojiPickerPopover
                        currentEmoji={lineDraft.icon}
                        onSelect={(emoji) => {
                          setLineDraft(prev => ({ ...prev, icon: emoji }));
                          setShowEmojiPicker(false);
                        }}
                        onClose={() => setShowEmojiPicker(false)}
                      />
                    )}
                  </div>
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
                <span className="tree-branch-prefix">{branchPrefix}</span>
                <div className="row-inline-icon-trigger-wrapper" style={{ display: 'inline-flex' }}>
                  <span
                    className="item-symbol-icon item-symbol-interactive"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLineEmojiPickerIdx(lineEmojiPickerIdx === idx ? null : idx);
                    }}
                    title="Кликните, чтобы сменить эмодзи"
                  >
                    {line.icon || '⚡'}
                  </span>
                  {lineEmojiPickerIdx === idx && (
                    <EmojiPickerPopover
                      currentEmoji={line.icon}
                      onSelect={(selected) => {
                        if (onUpdateLogicLine) {
                          onUpdateLogicLine(id, idx, { ...line, icon: selected });
                        }
                        setLineEmojiPickerIdx(null);
                      }}
                      onClose={() => setLineEmojiPickerIdx(null)}
                    />
                  )}
                </div>
                <code className="logic-code-text">{line.code}</code>
                {line.comment && <span className="item-details-text logic-comment">({line.comment})</span>}
                <div className="row-hover-actions nodrag">
                  <button
                    type="button"
                    className="row-hover-sub-btn"
                    onClick={(e) => handleAddSubRow(e, idx)}
                    title="Добавить вложенный шаг (дочерняя строка ↳)"
                  >
                    ↳ +
                  </button>
                  <button
                    type="button"
                    className="row-hover-add-btn"
                    onClick={(e) => handleAddSiblingRow(e, idx)}
                    title="Добавить шаг на этом уровне (＋)"
                  >
                    ＋
                  </button>
                  <span className="row-hover-pencil" title="Редактировать">✎</span>
                  <button
                    type="button"
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

        {/* Dual Quick Add Buttons: Sibling vs Nested Tree */}
        <div className="card-add-buttons-bar nodrag">
          <button
            type="button"
            className="btn-card-add"
            onClick={handleQuickAddClick}
            title="Добавить шаг логики на текущем уровне"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>add</span>
            <span>+ Действие</span>
          </button>
          <button
            type="button"
            className="btn-card-add btn-add-sub"
            onClick={handleQuickAddSubClick}
            title="Добавить вложенный шаг (дочернее древо логики ↳)"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>subdirectory_arrow_right</span>
            <span>↳ + Вложенная строка (Древо)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
