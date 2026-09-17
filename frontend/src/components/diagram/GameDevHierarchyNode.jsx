import React, { useState, useEffect, useContext, useRef } from 'react';
import { Handle, Position, useUpdateNodeInternals } from '@xyflow/react';
import { DiagramActionsContext } from '../DiagramActionsContext';
import EmojiPickerPopover from './EmojiPickerPopover';
import ColorPickerPopover from './ColorPickerPopover';
import useBlockCornerScale from '../../hooks/useBlockCornerScale';

// Calculate dynamic tree branches (├──, └──, │   ,     ) based on nesting hierarchy
export const computeTreePrefix = (items = [], index = 0) => {
  const currentItem = items[index];
  if (!currentItem) return '';
  const currentLevel = currentItem.level || 0;

  if (currentLevel === 0) {
    const hasNextSibling = items.slice(index + 1).some(it => (it.level || 0) === 0);
    return hasNextSibling ? '├── ' : '└── ';
  }

  let prefix = '';
  // Each ancestor depth from 0 to currentLevel - 1 provides 4 characters
  for (let depth = 0; depth < currentLevel; depth++) {
    let hasMoreAtDepth = false;
    for (let j = index + 1; j < items.length; j++) {
      const nextLevel = items[j].level || 0;
      if (nextLevel < depth) break;
      if (nextLevel === depth) {
        hasMoreAtDepth = true;
        break;
      }
    }
    prefix += hasMoreAtDepth ? '│   ' : '    ';
  }

  let isLastSibling = true;
  for (let j = index + 1; j < items.length; j++) {
    const nextLevel = items[j].level || 0;
    if (nextLevel < currentLevel) break;
    if (nextLevel === currentLevel) {
      isLastSibling = false;
      break;
    }
  }

  prefix += isLastSibling ? '└── ' : '├── ';
  return prefix;
};

function GameDevHierarchyNode({ id, data, isConnectable, selected }) {
  const updateNodeInternals = useUpdateNodeInternals();
  const actions = useContext(DiagramActionsContext);
  const onOpenInspector = actions?.onOpenInspector || actions?.onEditNode || data?.onEdit;
  const onDeleteNode = actions?.onDeleteNode || data?.onDelete;
  const onQuickAdd = actions?.onQuickAdd || data?.onQuickAdd;
  const onOpenTagModal = actions?.onOpenTagModal || data?.onOpenTagModal;
  const onScaleNode = actions?.onScaleNode;
  const onUpdateHierarchyItem = actions?.onUpdateHierarchyItem;
  const onDeleteHierarchyItem = actions?.onDeleteHierarchyItem;
  const onAddHierarchySubItem = actions?.onAddHierarchySubItem;
  const onAddHierarchySiblingItem = actions?.onAddHierarchySiblingItem;
  const onIndentHierarchyItem = actions?.onIndentHierarchyItem;
  const onUpdateHierarchyRoot = actions?.onUpdateHierarchyRoot;

  const rootPath = data.rootPath || 'Assets/Prefabs/Player/Player.prefab';
  const rootIcon = data.rootIcon || '📁';
  const rootColor = data.rootColor || '#e3b341';
  const treeItems = data.items || [];

  const [copied, setCopied] = useState(false);
  const [editingRowIdx, setEditingRowIdx] = useState(null);
  const [selectedRowIdx, setSelectedRowIdx] = useState(null);
  const [rowDraft, setRowDraft] = useState({ name: '', details: '', icon: '⚙️', level: 0 });
  const [editingRoot, setEditingRoot] = useState(false);
  const [rootDraft, setRootDraft] = useState(rootPath);
  const [rootIconDraft, setRootIconDraft] = useState(rootIcon);
  const [rootColorDraft, setRootColorDraft] = useState(rootColor);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [rowEmojiPickerIdx, setRowEmojiPickerIdx] = useState(null);
  const [showRootEmojiPicker, setShowRootEmojiPicker] = useState(false);
  const [showRootColorPicker, setShowRootColorPicker] = useState(false);
  const [viewRootEmojiPicker, setViewRootEmojiPicker] = useState(false);
  const [viewRootColorPicker, setViewRootColorPicker] = useState(false);

  const nameInputRef = useRef(null);
  const rootInputRef = useRef(null);
  const cardRef = useRef(null);

  const {
    handleCornerPointerDown,
    isScaling,
    liveScalePercent
  } = useBlockCornerScale({ id, data, cardRef });

  useEffect(() => {
    updateNodeInternals(id);
  }, [id, treeItems.length, data.scale, updateNodeInternals]);

  useEffect(() => {
    setRootDraft(rootPath);
    setRootIconDraft(rootIcon);
    setRootColorDraft(rootColor);
  }, [rootPath, rootIcon, rootColor]);

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
    let result = `${rootIcon} ${rootPath}\n`;
    treeItems.forEach((item, idx) => {
      const prefix = computeTreePrefix(treeItems, idx);
      const details = item.details ? ` (${item.details})` : '';
      result += `${prefix}${item.icon ? item.icon + ' ' : ''}${item.name}${details}\n`;
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
    setSelectedRowIdx(null);
  };

  const handleAddSubRow = (e, idx) => {
    if (e) e.stopPropagation();
    const parentItem = treeItems[idx];
    const parentLevel = parentItem ? (parentItem.level || 0) : 0;
    const subLevel = parentLevel + 1;
    const insertIdx = idx + 1;

    if (onAddHierarchySubItem) {
      onAddHierarchySubItem(id, idx);
    }
    setEditingRowIdx(insertIdx);
    setSelectedRowIdx(insertIdx);
    setRowDraft({
      level: subLevel,
      icon: '⚙️',
      name: 'NewChild',
      details: 'Component, Script'
    });
  };

  const handleAddSiblingRow = (e, idx) => {
    if (e) e.stopPropagation();
    const currentItem = treeItems[idx];
    const currentLevel = currentItem ? (currentItem.level || 0) : 0;

    let insertIdx = idx + 1;
    while (insertIdx < treeItems.length && (treeItems[insertIdx].level || 0) > currentLevel) {
      insertIdx++;
    }

    if (onAddHierarchySiblingItem) {
      onAddHierarchySiblingItem(id, idx);
    }
    setEditingRowIdx(insertIdx);
    setSelectedRowIdx(insertIdx);
    setRowDraft({
      level: currentLevel,
      icon: '⚙️',
      name: 'NewComponent',
      details: 'Component, Script'
    });
  };

  const handleIndentDraft = (e, delta) => {
    if (e) e.stopPropagation();
    setRowDraft(prev => ({
      ...prev,
      level: Math.max(0, Math.min(6, (prev.level || 0) + delta))
    }));
  };

  const handleRowKeyDown = (e, idx) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      e.stopPropagation();
      const delta = e.shiftKey ? -1 : 1;
      setRowDraft(prev => ({
        ...prev,
        level: Math.max(0, Math.min(6, (prev.level || 0) + delta))
      }));
    } else if (e.key === 'Enter') {
      e.stopPropagation();
      handleSaveRow(idx);
    } else if (e.key === 'Escape') {
      e.stopPropagation();
      setEditingRowIdx(null);
      setSelectedRowIdx(null);
    }
  };

  const handleDeleteRow = (e, idx) => {
    e.stopPropagation();
    if (onDeleteHierarchyItem) {
      onDeleteHierarchyItem(id, idx);
    }
    setEditingRowIdx(null);
    setSelectedRowIdx(null);
  };

  const handleSaveRoot = () => {
    if (onUpdateHierarchyRoot && rootDraft.trim()) {
      onUpdateHierarchyRoot(id, {
        rootPath: rootDraft.trim(),
        rootIcon: rootIconDraft,
        rootColor: rootColorDraft
      });
    }
    setEditingRoot(false);
    setShowRootEmojiPicker(false);
    setShowRootColorPicker(false);
  };

  const handleSelectViewEmoji = (emoji) => {
    if (onUpdateHierarchyRoot) {
      onUpdateHierarchyRoot(id, {
        rootIcon: emoji
      });
    }
    setViewRootEmojiPicker(false);
  };

  const handleSelectViewColor = (color) => {
    if (onUpdateHierarchyRoot) {
      onUpdateHierarchyRoot(id, {
        rootColor: color
      });
    }
    setViewRootColorPicker(false);
  };

  const handleRootKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.stopPropagation();
      handleSaveRoot();
    } else if (e.key === 'Escape') {
      e.stopPropagation();
      setRootDraft(rootPath);
      setRootIconDraft(rootIcon);
      setRootColorDraft(rootColor);
      setShowRootEmojiPicker(false);
      setShowRootColorPicker(false);
      setEditingRoot(false);
    }
  };

  const handleSaveAndAddSub = (idx) => {
    if (onUpdateHierarchyItem && rowDraft.name.trim()) {
      onUpdateHierarchyItem(id, idx, rowDraft);
    }
    handleAddSubRow(null, idx);
  };

  const handleQuickAddClick = (e) => {
    e.stopPropagation();
    if (treeItems.length === 0) {
      if (onQuickAdd) onQuickAdd(id);
      return;
    }
    const targetIdx = editingRowIdx !== null 
      ? editingRowIdx 
      : (selectedRowIdx !== null && selectedRowIdx < treeItems.length ? selectedRowIdx : treeItems.length - 1);

    if (editingRowIdx !== null && onUpdateHierarchyItem && rowDraft.name.trim()) {
      onUpdateHierarchyItem(id, editingRowIdx, rowDraft);
    }
    handleAddSiblingRow(e, targetIdx);
  };

  const currentScale = data.scale || 1;
  const cardStyle = {
    background: data.customBg,
    borderColor: data.customBorder,
    borderStyle: data.borderStyle || 'solid',
    boxShadow: data.glow ? `0 0 18px ${data.glowColor || 'rgba(88, 166, 255, 0.45)'}` : undefined,
    zoom: currentScale
  };

  const handleStyle = data.customAccent ? {
    background: data.customAccent,
    borderColor: data.customBg || '#111419'
  } : undefined;

  return (
    <div
      ref={cardRef}
      className={`gamedev-hierarchy-card ${data.theme ? `theme-${data.theme}` : ''} ${data.glow ? 'has-glow' : ''} ${selected ? 'selected' : ''}`}
      style={cardStyle}
    >
      {/* 4 Corner handles for interactive proportional scaling */}
      {selected && (
        <>
          <div
            className="block-corner-scale-handle block-corner-tl nodrag"
            style={{ backgroundColor: data.customAccent || '#58a6ff' }}
            onPointerDown={(e) => handleCornerPointerDown('top-left', e)}
            title="Масштабировать блок (угол ВЛ)"
          />
          <div
            className="block-corner-scale-handle block-corner-tr nodrag"
            style={{ backgroundColor: data.customAccent || '#58a6ff' }}
            onPointerDown={(e) => handleCornerPointerDown('top-right', e)}
            title="Масштабировать блок (угол ВП)"
          />
          <div
            className="block-corner-scale-handle block-corner-bl nodrag"
            style={{ backgroundColor: data.customAccent || '#58a6ff' }}
            onPointerDown={(e) => handleCornerPointerDown('bottom-left', e)}
            title="Масштабировать блок (угол НЛ)"
          />
          <div
            className="block-corner-scale-handle block-corner-br nodrag"
            style={{ backgroundColor: data.customAccent || '#58a6ff' }}
            onPointerDown={(e) => handleCornerPointerDown('bottom-right', e)}
            title="Масштабировать блок (угол НП)"
          >
            <span className="scale-grip-dots">⠿</span>
          </div>

          {/* Live scale percentage tooltip badge during scaling */}
          {isScaling && liveScalePercent && (
            <div className="block-scale-live-pill">
              Масштаб: {liveScalePercent}%
            </div>
          )}
        </>
      )}

      {/* 4 Outer Card Handles (1 per side, connectionMode="loose" enables dual in/out) */}
      <Handle
        type="source"
        position={Position.Left}
        id="handle-left"
        isConnectable={isConnectable}
        style={handleStyle}
        className="diagram-handle handle-left"
        title="Привязать к блоку (слева)"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="handle-right"
        isConnectable={isConnectable}
        style={handleStyle}
        className="diagram-handle handle-right"
        title="Привязать к блоку (справа)"
      />
      <Handle
        type="source"
        position={Position.Top}
        id="handle-top"
        isConnectable={isConnectable}
        style={handleStyle}
        className="diagram-handle handle-top"
        title="Привязать к блоку (сверху)"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="handle-bottom"
        isConnectable={isConnectable}
        style={handleStyle}
        className="diagram-handle handle-bottom"
        title="Привязать к блоку (снизу)"
      />

      {/* Top action bar (only rendered if tag exists) */}
      {data.tag && (
        <div className="card-top-action-bar">
          <span
            className="card-custom-badge nodrag"
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
        </div>
      )}

      {/* Floating Header Actions Overlay on Hover */}
      <div className="card-icons-group nodrag">
        {/* Quick scale control */}
        <div className="node-scale-control">
          <button
            type="button"
            className="btn-scale-step"
            onClick={(e) => {
              e.stopPropagation();
              if (onScaleNode) onScaleNode(id, (data.scale || 1) - 0.1);
            }}
            title="Уменьшить масштаб (-10%)"
          >
            -
          </button>
          <span
            className="scale-value-label"
            title="Текущий масштаб (клик для сброса на 100%)"
            onClick={(e) => {
              e.stopPropagation();
              if (onScaleNode) onScaleNode(id, 1.0);
            }}
          >
            {Math.round((data.scale || 1) * 100)}%
          </span>
          <button
            type="button"
            className="btn-scale-step"
            onClick={(e) => {
              e.stopPropagation();
              if (onScaleNode) onScaleNode(id, (data.scale || 1) + 0.1);
            }}
            title="Увеличить масштаб (+10%)"
          >
            +
          </button>
        </div>
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

      {/* Card Content: Tree view */}
      <div className="card-tree-content">
        {/* Root Prefab Folder Path */}
        {editingRoot ? (
          <div className="tree-root-row-edit nodrag" onClick={(e) => e.stopPropagation()}>
            {/* Header row handles for connecting to main prefab header */}
            <Handle
              type="source"
              position={Position.Left}
              id="header-left"
              isConnectable={isConnectable}
              className="diagram-handle row-handle row-handle-left"
              title={`Связать главный заголовок: ${rootDraft || rootPath}`}
              style={{ background: rootColorDraft || rootColor }}
            />
            <Handle
              type="source"
              position={Position.Right}
              id="header-right"
              isConnectable={isConnectable}
              className="diagram-handle row-handle row-handle-right"
              title={`Связать главный заголовок: ${rootDraft || rootPath}`}
              style={{ background: rootColorDraft || rootColor }}
            />

            {/* Root emoji picker */}
            <div className="row-inline-icon-trigger-wrapper">
              <button
                type="button"
                className="row-inline-icon-picker-btn root-icon-picker-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowRootEmojiPicker(prev => !prev);
                  setShowRootColorPicker(false);
                }}
                title="Выбрать эмодзи для главной строки"
              >
                <span className="current-icon">{rootIconDraft || '📁'}</span>
                <span className="picker-caret">▾</span>
              </button>
              {showRootEmojiPicker && (
                <EmojiPickerPopover
                  currentEmoji={rootIconDraft}
                  onSelect={(emoji) => {
                    setRootIconDraft(emoji);
                    setShowRootEmojiPicker(false);
                  }}
                  onClose={() => setShowRootEmojiPicker(false)}
                />
              )}
            </div>

            {/* Root color swatch button */}
            <div className="row-inline-color-trigger-wrapper">
              <button
                type="button"
                className="root-color-swatch-btn"
                style={{ backgroundColor: rootColorDraft }}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowRootColorPicker(prev => !prev);
                  setShowRootEmojiPicker(false);
                }}
                title="Выбрать цвет главной строки"
              >
                <span className="swatch-inner-dot"></span>
              </button>
              {showRootColorPicker && (
                <ColorPickerPopover
                  currentColor={rootColorDraft}
                  defaultColor="#e3b341"
                  onSelect={(color) => setRootColorDraft(color)}
                  onClose={() => setShowRootColorPicker(false)}
                  title="Цвет префаба / корня"
                />
              )}
            </div>

            <input
              ref={rootInputRef}
              type="text"
              className="root-inline-input"
              style={{ color: rootColorDraft, borderColor: rootColorDraft }}
              value={rootDraft}
              onChange={(e) => setRootDraft(e.target.value)}
              onKeyDown={handleRootKeyDown}
              placeholder="Assets/Prefabs/..."
            />
            <button className="row-inline-save-btn" onClick={handleSaveRoot} title="Сохранить">✓</button>
            <button className="row-inline-del-btn" onClick={() => {
              setEditingRoot(false);
              setRootDraft(rootPath);
              setRootIconDraft(rootIcon);
              setRootColorDraft(rootColor);
              setShowRootEmojiPicker(false);
              setShowRootColorPicker(false);
            }} title="Отмена">✕</button>
          </div>
        ) : (
          <div
            className="tree-root-row tree-root-interactive"
            onClick={(e) => { e.stopPropagation(); setEditingRoot(true); }}
            title="Кликните для редактирования строки"
            style={{ color: rootColor }}
          >
            {/* Header row handles for connecting to main prefab header */}
            <Handle
              type="source"
              position={Position.Left}
              id="header-left"
              isConnectable={isConnectable}
              className="diagram-handle row-handle row-handle-left"
              title={`Связать главный заголовок: ${rootPath}`}
              style={{ background: rootColor }}
            />
            <Handle
              type="source"
              position={Position.Right}
              id="header-right"
              isConnectable={isConnectable}
              className="diagram-handle row-handle row-handle-right"
              title={`Связать главный заголовок: ${rootPath}`}
              style={{ background: rootColor }}
            />

            {/* Interactive Emoji in view mode */}
            <div className="row-inline-icon-trigger-wrapper" style={{ display: 'inline-flex' }}>
              <span
                className="folder-icon item-symbol-interactive"
                onClick={(e) => {
                  e.stopPropagation();
                  setViewRootEmojiPicker(prev => !prev);
                  setViewRootColorPicker(false);
                }}
                title="Кликните, чтобы сменить эмодзи"
              >
                {rootIcon}
              </span>
              {viewRootEmojiPicker && (
                <EmojiPickerPopover
                  currentEmoji={rootIcon}
                  onSelect={handleSelectViewEmoji}
                  onClose={() => setViewRootEmojiPicker(false)}
                />
              )}
            </div>

            <span className="root-path-text" style={{ color: rootColor }}>
              {rootPath}
            </span>

            {/* Hover actions for root row */}
            <div className="root-hover-actions">
              <div className="row-inline-color-trigger-wrapper" style={{ display: 'inline-flex' }}>
                <button
                  type="button"
                  className="root-color-action-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setViewRootColorPicker(prev => !prev);
                    setViewRootEmojiPicker(false);
                  }}
                  title="Сменить цвет главной строки"
                >
                  <span className="root-color-dot" style={{ backgroundColor: rootColor }}></span>
                  <span className="root-color-palette-icon">🎨</span>
                </button>
                {viewRootColorPicker && (
                  <ColorPickerPopover
                    currentColor={rootColor}
                    defaultColor="#e3b341"
                    onSelect={handleSelectViewColor}
                    onClose={() => setViewRootColorPicker(false)}
                    title="Цвет префаба / корня"
                  />
                )}
              </div>
              <span className="row-hover-pencil">✎</span>
            </div>
          </div>
        )}

        {/* Tree items */}
        <div className="tree-items-list">
          {treeItems.map((item, idx) => {
            const isEditing = editingRowIdx === idx;

            if (isEditing) {
              return (
                <div key={idx} className="tree-item-row-edit nodrag" onClick={(e) => e.stopPropagation()}>
                  {/* Row-level component handles */}
                  <Handle
                    type="source"
                    position={Position.Left}
                    id={`item-${idx}-left`}
                    isConnectable={isConnectable}
                    className="diagram-handle row-handle row-handle-left"
                    title={`Связать компонент: ${rowDraft.name || 'Элемент'}`}
                  />
                  <Handle
                    type="source"
                    position={Position.Right}
                    id={`item-${idx}-right`}
                    isConnectable={isConnectable}
                    className="diagram-handle row-handle row-handle-right"
                    title={`Связать компонент: ${rowDraft.name || 'Элемент'}`}
                  />

                  {/* Indentation controls for sub-rows */}
                  <div className="row-indent-controls">
                    <button
                      type="button"
                      className="row-indent-btn"
                      onClick={(e) => handleIndentDraft(e, -1)}
                      disabled={(rowDraft.level || 0) <= 0}
                      title="Уменьшить вложенность (Shift+Tab)"
                    >
                      ⇤
                    </button>
                    <span className="row-level-badge" title={`Уровень вложенности: ${rowDraft.level || 0}`}>
                      L{rowDraft.level || 0}
                    </span>
                    <button
                      type="button"
                      className="row-indent-btn"
                      onClick={(e) => handleIndentDraft(e, 1)}
                      disabled={(rowDraft.level || 0) >= 6}
                      title="Увеличить вложенность (Tab)"
                    >
                      ⇥
                    </button>
                  </div>

                  <span className="tree-branch-prefix">{computeTreePrefix(treeItems, idx)}</span>
                  <div className="row-inline-icon-trigger-wrapper">
                    <button
                      type="button"
                      className="row-inline-icon-picker-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowEmojiPicker(prev => !prev);
                      }}
                      title="Выбрать эмодзи (кликните для открытия окна всех эмодзи)"
                    >
                      <span className="current-icon">{rowDraft.icon || '⚙️'}</span>
                      <span className="picker-caret">▾</span>
                    </button>
                    {showEmojiPicker && (
                      <EmojiPickerPopover
                        currentEmoji={rowDraft.icon}
                        onSelect={(emoji) => {
                          setRowDraft(prev => ({ ...prev, icon: emoji }));
                          setShowEmojiPicker(false);
                        }}
                        onClose={() => setShowEmojiPicker(false)}
                      />
                    )}
                  </div>
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
                  <button type="button" className="row-inline-save-btn row-inline-sub-btn" onClick={() => handleSaveAndAddSub(idx)} title="Сохранить и создать вложенную строку под этой (↳ +)">↳+</button>
                  <button className="row-inline-del-btn" onClick={(e) => handleDeleteRow(e, idx)} title="Удалить строку">✕</button>
                </div>
              );
            }

            return (
              <div
                key={idx}
                className={`tree-item-row tree-item-interactive ${selectedRowIdx === idx ? 'row-selected' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedRowIdx(idx);
                  handleStartRowEdit(idx, item);
                }}
                title="Кликните, чтобы редактировать этот элемент"
              >
                {/* Row-level component handles */}
                <Handle
                  type="source"
                  position={Position.Left}
                  id={`item-${idx}-left`}
                  isConnectable={isConnectable}
                  className="diagram-handle row-handle row-handle-left"
                  title={`Связать компонент: ${item.name || 'Элемент'}`}
                />
                <Handle
                  type="source"
                  position={Position.Right}
                  id={`item-${idx}-right`}
                  isConnectable={isConnectable}
                  className="diagram-handle row-handle row-handle-right"
                  title={`Связать компонент: ${item.name || 'Элемент'}`}
                />

                <span className="tree-branch-prefix">
                  {computeTreePrefix(treeItems, idx)}
                </span>
                <div className="row-inline-icon-trigger-wrapper" style={{ display: 'inline-flex' }}>
                  <span
                    className="item-symbol-icon item-symbol-interactive"
                    onClick={(e) => {
                      e.stopPropagation();
                      setRowEmojiPickerIdx(rowEmojiPickerIdx === idx ? null : idx);
                    }}
                    title="Кликните, чтобы сменить эмодзи"
                  >
                    {item.icon || '⚙️'}
                  </span>
                  {rowEmojiPickerIdx === idx && (
                    <EmojiPickerPopover
                      currentEmoji={item.icon}
                      onSelect={(selected) => {
                        if (onUpdateHierarchyItem) {
                          onUpdateHierarchyItem(id, idx, { ...item, icon: selected });
                        }
                        setRowEmojiPickerIdx(null);
                      }}
                      onClose={() => setRowEmojiPickerIdx(null)}
                    />
                  )}
                </div>
                <span className="item-name-text">{item.name}</span>
                {item.details && (
                  <span className="item-details-text">
                    ({item.details})
                  </span>
                )}
                <div className="row-hover-actions nodrag">
                  <button
                    type="button"
                    className="row-hover-indent-btn"
                    onClick={(e) => { e.stopPropagation(); if (onIndentHierarchyItem) onIndentHierarchyItem(id, idx, -1); }}
                    disabled={(item.level || 0) <= 0}
                    title="Уменьшить вложенность (⇤)"
                  >
                    ⇤
                  </button>
                  <button
                    type="button"
                    className="row-hover-indent-btn"
                    onClick={(e) => { e.stopPropagation(); if (onIndentHierarchyItem) onIndentHierarchyItem(id, idx, 1); }}
                    disabled={(item.level || 0) >= 6}
                    title="Увеличить вложенность (⇥)"
                  >
                    ⇥
                  </button>
                  <button
                    type="button"
                    className="row-hover-sub-btn"
                    onClick={(e) => handleAddSubRow(e, idx)}
                    title="Добавить подстроку (дочерний объект ↳)"
                  >
                    ↳ +
                  </button>
                  <button
                    type="button"
                    className="row-hover-add-btn"
                    onClick={(e) => handleAddSiblingRow(e, idx)}
                    title="Добавить объект на этом уровне (＋)"
                  >
                    ＋
                  </button>
                  <span className="row-hover-pencil" title="Редактировать">✎</span>
                  <button
                    type="button"
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

        {/* Quick Add Button */}
        <div className="card-add-buttons-bar nodrag">
          <button
            type="button"
            className="btn-card-add"
            onClick={handleQuickAddClick}
            title="Добавить строку"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>add</span>
            <span>+ Элемент</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default React.memo(GameDevHierarchyNode);
