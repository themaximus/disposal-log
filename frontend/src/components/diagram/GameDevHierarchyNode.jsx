import React, { useState, useEffect, useContext, useRef } from 'react';
import { Handle, Position } from '@xyflow/react';
import { DiagramActionsContext } from '../DiagramActionsContext';

export default function GameDevHierarchyNode({ id, data, isConnectable }) {
  const actions = useContext(DiagramActionsContext);
  const onOpenInspector = actions?.onOpenInspector || actions?.onEditNode || data?.onEdit;
  const onDeleteNode = actions?.onDeleteNode || data?.onDelete;
  const onQuickAdd = actions?.onQuickAdd || data?.onQuickAdd;
  const onOpenTagModal = actions?.onOpenTagModal || data?.onOpenTagModal;
  const onUpdateHierarchyItem = actions?.onUpdateHierarchyItem;
  const onDeleteHierarchyItem = actions?.onDeleteHierarchyItem;
  const onUpdateHierarchyRoot = actions?.onUpdateHierarchyRoot;

  const [copied, setCopied] = useState(false);
  const [editingRowIdx, setEditingRowIdx] = useState(null);
  const [rowDraft, setRowDraft] = useState({ name: '', details: '', icon: '⚙️', level: 0 });
  const [editingRoot, setEditingRoot] = useState(false);
  const [rootDraft, setRootDraft] = useState(data.rootPath || 'Assets/Prefabs/Player/Player.prefab');

  const rootPath = data.rootPath || 'Assets/Prefabs/Player/Player.prefab';
  const treeItems = data.items || [];
  const nameInputRef = useRef(null);
  const rootInputRef = useRef(null);

  useEffect(() => {
    setRootDraft(rootPath);
  }, [rootPath]);

  useEffect(() => {
    if (editingRowIdx !== null && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [editingRowIdx]);

  useEffect(() => {
    if (editingRoot && rootInputRef.current) {
      rootInputRef.current.focus();
      rootInputRef.current.select();
    }
  }, [editingRoot]);

  // Build tree text for clipboard
  const getFullTreeText = () => {
    let result = `📁 ${rootPath}\n`;
    treeItems.forEach(item => {
      const indent = '   '.repeat(item.level || 0);
      const branch = item.isLast ? '└── ' : '├── ';
      const details = item.details ? ` (${item.details})` : '';
      result += `${indent}${branch}${item.icon ? item.icon + ' ' : ''}${item.name}${details}\n`;
    });
    return result;
  };

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(getFullTreeText()).then(() => {
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

  const handleStartRowEdit = (idx, item) => {
    setEditingRowIdx(idx);
    setRowDraft({
      name: item.name || '',
      details: item.details || '',
      icon: item.icon || '⚙️',
      level: item.level || 0,
      isLast: item.isLast
    });
  };

  const handleSaveRow = (idx) => {
    if (onUpdateHierarchyItem && rowDraft.name.trim()) {
      onUpdateHierarchyItem(id, idx, rowDraft);
    }
    setEditingRowIdx(null);
  };

  const handleRowKeyDown = (e, idx) => {
    if (e.key === 'Enter') {
      e.stopPropagation();
      handleSaveRow(idx);
    } else if (e.key === 'Escape') {
      e.stopPropagation();
      setEditingRowIdx(null);
    }
  };

  const handleDeleteRow = (e, idx) => {
    e.stopPropagation();
    if (onDeleteHierarchyItem) {
      onDeleteHierarchyItem(id, idx);
    }
    setEditingRowIdx(null);
  };

  const handleSaveRoot = () => {
    if (onUpdateHierarchyRoot && rootDraft.trim()) {
      onUpdateHierarchyRoot(id, rootDraft.trim());
    }
    setEditingRoot(false);
  };

  const handleRootKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.stopPropagation();
      handleSaveRoot();
    } else if (e.key === 'Escape') {
      e.stopPropagation();
      setRootDraft(rootPath);
      setEditingRoot(false);
    }
  };

  const handleQuickAddClick = (e) => {
    e.stopPropagation();
    if (onQuickAdd) {
      onQuickAdd(id);
      // Give the new item immediate edit focus
      setEditingRowIdx(treeItems.length);
      setRowDraft({
        level: treeItems.length > 0 ? (treeItems[treeItems.length - 1].level || 1) : 0,
        icon: '⚙️',
        name: 'NewComponent',
        details: 'Script, Component'
      });
    }
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
      className={`gamedev-hierarchy-card ${data.theme ? `theme-${data.theme}` : ''} ${data.glow ? 'has-glow' : ''}`}
      style={cardStyle}
    >
      {/* Handles for connections (Multiple connections allowed) */}
      <Handle
        type="target"
        position={Position.Left}
        id="target-left"
        isConnectable={isConnectable}
        style={handleStyle}
        className="diagram-handle handle-left"
      />
      <Handle
        type="source"
        position={Position.Left}
        id="source-left"
        isConnectable={isConnectable}
        style={handleStyle}
        className="diagram-handle handle-left"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="source-right"
        isConnectable={isConnectable}
        style={handleStyle}
        className="diagram-handle handle-right"
      />
      <Handle
        type="target"
        position={Position.Right}
        id="target-right"
        isConnectable={isConnectable}
        style={handleStyle}
        className="diagram-handle handle-right"
      />
      <Handle
        type="target"
        position={Position.Top}
        id="target-top"
        isConnectable={isConnectable}
        style={handleStyle}
        className="diagram-handle handle-top"
      />
      <Handle
        type="source"
        position={Position.Top}
        id="source-top"
        isConnectable={isConnectable}
        style={handleStyle}
        className="diagram-handle handle-top"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="source-bottom"
        isConnectable={isConnectable}
        style={handleStyle}
        className="diagram-handle handle-bottom"
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="target-bottom"
        isConnectable={isConnectable}
        style={handleStyle}
        className="diagram-handle handle-bottom"
      />

      {/* Top action bar */}
      <div className="card-top-action-bar">
        {data.tag && (
          <span
            className="card-custom-badge"
            onClick={handleTagClick}
            style={{
              cursor: 'pointer',
              background: data.badgeBg,
              color: data.badgeText,
              borderColor: data.badgeText
            }}
            title="Кликните для изменения привязки"
          >
            {data.tag}
          </span>
        )}
        <div className="card-icons-group">
          <button
            className="card-action-icon-btn"
            onClick={handleTagClick}
            title={data.tag ? `Привязка: ${data.tag}` : 'Привязать к задаче или тегу (@)'}
          >
            @
          </button>
          <button
            className={`card-action-icon-btn ${copied ? 'copied' : ''}`}
            onClick={handleCopy}
            title={copied ? 'Скопировано в буфер!' : 'Копировать структуру (❐)'}
          >
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

      {/* Card Content: Tree view */}
      <div className="card-tree-content">
        {/* Root Prefab Folder Path */}
        {editingRoot ? (
          <div className="tree-root-row-edit nodrag" onClick={(e) => e.stopPropagation()}>
            <span className="folder-icon">📁</span>
            <input
              ref={rootInputRef}
              type="text"
              className="root-inline-input"
              value={rootDraft}
              onChange={(e) => setRootDraft(e.target.value)}
              onKeyDown={handleRootKeyDown}
              placeholder="Assets/Prefabs/..."
            />
            <button className="row-inline-save-btn" onClick={handleSaveRoot} title="Сохранить">✓</button>
            <button className="row-inline-del-btn" onClick={() => setEditingRoot(false)} title="Отмена">✕</button>
          </div>
        ) : (
          <div
            className="tree-root-row tree-root-interactive"
            onClick={(e) => { e.stopPropagation(); setEditingRoot(true); }}
            title="Кликните для редактирования пути"
          >
            <span className="folder-icon">📁</span>
            <span className="root-path-text">{rootPath}</span>
            <span className="row-hover-pencil">✎</span>
          </div>
        )}

        {/* Tree items */}
        <div className="tree-items-list">
          {treeItems.map((item, idx) => {
            const indentSpaces = '   '.repeat(item.level || 0);
            const branchSymbol = item.isLast ? '└── ' : '├── ';
            const isEditing = editingRowIdx === idx;

            if (isEditing) {
              return (
                <div key={idx} className="tree-item-row-edit nodrag" onClick={(e) => e.stopPropagation()}>
                  <span className="tree-branch-prefix">{indentSpaces}{branchSymbol}</span>
                  <input
                    type="text"
                    className="row-inline-icon-input"
                    value={rowDraft.icon}
                    onChange={(e) => setRowDraft({ ...rowDraft, icon: e.target.value })}
                    title="Эмодзи иконки"
                  />
                  <input
                    ref={nameInputRef}
                    type="text"
                    className="row-inline-name-input"
                    value={rowDraft.name}
                    onChange={(e) => setRowDraft({ ...rowDraft, name: e.target.value })}
                    onKeyDown={(e) => handleRowKeyDown(e, idx)}
                    placeholder="Имя объекта"
                  />
                  <input
                    type="text"
                    className="row-inline-details-input"
                    value={rowDraft.details}
                    onChange={(e) => setRowDraft({ ...rowDraft, details: e.target.value })}
                    onKeyDown={(e) => handleRowKeyDown(e, idx)}
                    placeholder="Компоненты"
                  />
                  <button className="row-inline-save-btn" onClick={() => handleSaveRow(idx)} title="Сохранить (Enter)">✓</button>
                  <button className="row-inline-del-btn" onClick={(e) => handleDeleteRow(e, idx)} title="Удалить строку">✕</button>
                </div>
              );
            }

            return (
              <div
                key={idx}
                className="tree-item-row tree-item-interactive"
                onClick={(e) => {
                  e.stopPropagation();
                  handleStartRowEdit(idx, item);
                }}
                title="Кликните, чтобы редактировать этот элемент"
              >
                <span className="tree-branch-prefix">
                  {indentSpaces}{branchSymbol}
                </span>
                {item.icon && <span className="item-symbol-icon">{item.icon}</span>}
                <span className="item-name-text">{item.name}</span>
                {item.details && (
                  <span className="item-details-text">
                    ({item.details})
                  </span>
                )}
                <div className="row-hover-actions">
                  <span className="row-hover-pencil">✎</span>
                  <button
                    className="row-hover-delete-btn"
                    onClick={(e) => handleDeleteRow(e, idx)}
                    title="Удалить строку"
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Add Item Button */}
        <button
          className="btn-quick-add-tree-item"
          onClick={handleQuickAddClick}
          title="Быстро добавить компонент или дочерний объект"
        >
          <span>+ Добавить элемент</span>
        </button>
      </div>
    </div>
  );
}
