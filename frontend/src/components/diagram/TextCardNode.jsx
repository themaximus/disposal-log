// TextCardNode.jsx - Блок произвольного текста / заметки со стандартным фоном карточек, изменением размера и точками связей
import React, { useState, useEffect, useContext, useRef } from 'react';
import { Handle, Position, NodeResizer } from '@xyflow/react';
import { DiagramActionsContext } from '../DiagramActionsContext';
import EmojiPickerPopover from './EmojiPickerPopover';
import ColorPickerPopover from './ColorPickerPopover';
import useBlockCornerScale from '../../hooks/useBlockCornerScale';

const FONT_SIZES = ['sm', 'md', 'lg', 'xl'];

export default function TextCardNode({ id, data, isConnectable, selected }) {
  const actions = useContext(DiagramActionsContext);
  const onDeleteNode = actions?.onDeleteNode || data?.onDelete;
  const onOpenTagModal = actions?.onOpenTagModal || data?.onOpenTagModal;
  const onUpdateTextNode = actions?.onUpdateTextNode;

  const text = data.text || 'Текстовая заметка...';
  const tag = data.tag || 'NOTE';
  const icon = data.icon || '📝';
  const textColor = data.textColor || '#f0f6fc';
  const fontSize = data.fontSize || 'md'; // 'sm' | 'md' | 'lg' | 'xl'
  const align = data.align || 'left';

  const [isEditing, setIsEditing] = useState(false);
  const [textDraft, setTextDraft] = useState(text);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const textareaRef = useRef(null);
  const cardRef = useRef(null);

  const {
    handleCornerPointerDown,
    isScaling,
    liveScalePercent
  } = useBlockCornerScale({ id, data, cardRef });

  useEffect(() => {
    setTextDraft(text);
  }, [text]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const handleSaveText = () => {
    const finalVal = textDraft.trim() || 'Текстовая заметка...';
    if (onUpdateTextNode) {
      onUpdateTextNode(id, { text: finalVal });
    } else if (actions?.setNodes) {
      actions.setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, text: finalVal } } : n));
      if (actions?.triggerAutoSave) actions.triggerAutoSave();
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.stopPropagation();
      handleSaveText();
    } else if (e.key === 'Escape') {
      e.stopPropagation();
      setTextDraft(text);
      setIsEditing(false);
    }
  };

  const handleSelectColor = (color) => {
    if (onUpdateTextNode) {
      onUpdateTextNode(id, { textColor: color });
    } else if (actions?.setNodes) {
      actions.setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, textColor: color } } : n));
      if (actions?.triggerAutoSave) actions.triggerAutoSave();
    }
    setShowColorPicker(false);
  };

  const handleSelectEmoji = (newEmoji) => {
    if (onUpdateTextNode) {
      onUpdateTextNode(id, { icon: newEmoji });
    } else if (actions?.setNodes) {
      actions.setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, icon: newEmoji } } : n));
      if (actions?.triggerAutoSave) actions.triggerAutoSave();
    }
    setShowEmojiPicker(false);
  };

  const handleToggleFontSize = (e) => {
    e.stopPropagation();
    const curIdx = FONT_SIZES.indexOf(fontSize);
    const nextSize = FONT_SIZES[(curIdx + 1) % FONT_SIZES.length];
    if (onUpdateTextNode) {
      onUpdateTextNode(id, { fontSize: nextSize });
    } else if (actions?.setNodes) {
      actions.setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, fontSize: nextSize } } : n));
      if (actions?.triggerAutoSave) actions.triggerAutoSave();
    }
  };

  const currentScale = data.scale || 1;
  const cardStyle = {
    background: data.customBg,
    borderColor: data.customBorder,
    borderStyle: data.borderStyle || 'solid',
    boxShadow: data.glow ? `0 0 18px ${data.glowColor || 'rgba(88, 166, 255, 0.45)'}` : undefined,
    zoom: currentScale,
    width: '100%',
    height: '100%'
  };

  const handleStyle = data.customAccent ? {
    background: data.customAccent,
    borderColor: data.customBg || '#111419'
  } : undefined;

  return (
    <div
      ref={cardRef}
      className={`gamedev-hierarchy-card text-card-node ${data.theme ? `theme-${data.theme}` : ''} ${data.glow ? 'has-glow' : ''} ${selected ? 'selected' : ''}`}
      style={cardStyle}
      onDoubleClick={() => setIsEditing(true)}
    >
      {/* NodeResizer for free width & height box resizing */}
      <NodeResizer
        isVisible={selected}
        minWidth={140}
        minHeight={60}
        color="#58a6ff"
        lineClassName="text-resizer-line"
        handleClassName="text-resizer-handle"
      />

      {/* Connection Handles: Top, Right, Bottom, Left (Both source and target) */}
      <Handle type="target" position={Position.Top} id="top-target" className="diagram-handle" isConnectable={isConnectable} style={handleStyle} />
      <Handle type="source" position={Position.Top} id="top-source" className="diagram-handle" isConnectable={isConnectable} style={handleStyle} />

      <Handle type="target" position={Position.Bottom} id="bottom-target" className="diagram-handle" isConnectable={isConnectable} style={handleStyle} />
      <Handle type="source" position={Position.Bottom} id="bottom-source" className="diagram-handle" isConnectable={isConnectable} style={handleStyle} />

      <Handle type="target" position={Position.Left} id="left-target" className="diagram-handle" isConnectable={isConnectable} style={handleStyle} />
      <Handle type="source" position={Position.Left} id="left-source" className="diagram-handle" isConnectable={isConnectable} style={handleStyle} />

      <Handle type="target" position={Position.Right} id="right-target" className="diagram-handle" isConnectable={isConnectable} style={handleStyle} />
      <Handle type="source" position={Position.Right} id="right-source" className="diagram-handle" isConnectable={isConnectable} style={handleStyle} />

      {/* Header bar: Tag, Emoji and Action buttons */}
      <div className="text-card-header">
        <div className="text-card-meta">
          {/* Emoji */}
          <div className="row-inline-icon-trigger-wrapper" style={{ display: 'inline-flex' }}>
            <span
              className="text-card-icon item-symbol-interactive"
              onClick={(e) => {
                e.stopPropagation();
                setShowEmojiPicker(prev => !prev);
              }}
              title="Сменить эмодзи"
            >
              {icon}
            </span>
            {showEmojiPicker && (
              <EmojiPickerPopover
                currentEmoji={icon}
                onSelect={handleSelectEmoji}
                onClose={() => setShowEmojiPicker(false)}
              />
            )}
          </div>

          {/* Tag */}
          <span
            className="text-card-tag-badge"
            onClick={(e) => {
              e.stopPropagation();
              if (onOpenTagModal) onOpenTagModal(id);
            }}
            title="Кликните для редактирования тега"
          >
            {tag}
          </span>
        </div>

        {/* Hover Action buttons */}
        <div className="text-card-hover-actions">
          {/* Color Picker Button */}
          <div className="row-inline-color-trigger-wrapper" style={{ display: 'inline-flex' }}>
            <button
              type="button"
              className="card-action-icon-btn"
              onClick={(e) => {
                e.stopPropagation();
                setShowColorPicker(prev => !prev);
              }}
              title="Цвет текста"
            >
              <span className="root-color-dot" style={{ backgroundColor: textColor }}></span>
              <span style={{ fontSize: '0.8rem', marginLeft: '3px' }}>🎨</span>
            </button>
            {showColorPicker && (
              <ColorPickerPopover
                currentColor={textColor}
                defaultColor="#f0f6fc"
                onSelect={handleSelectColor}
                onClose={() => setShowColorPicker(false)}
                title="Цвет текста"
              />
            )}
          </div>

          {/* Font Size Toggle */}
          <button
            type="button"
            className="card-action-icon-btn btn-font-size"
            onClick={handleToggleFontSize}
            title={`Размер шрифта: ${fontSize.toUpperCase()} (кликните для смены)`}
          >
            <span className="font-size-label">{fontSize.toUpperCase()}</span>
          </button>

          {/* Edit Button */}
          <button
            type="button"
            className="card-action-icon-btn"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
            title="Редактировать текст"
          >
            ✎
          </button>

          {/* Delete Button */}
          <button
            type="button"
            className="card-action-icon-btn btn-trash"
            onClick={(e) => {
              e.stopPropagation();
              if (onDeleteNode) onDeleteNode(id);
            }}
            title="Удалить блок"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>

      {/* Body: Text display or editor */}
      <div className="text-card-body">
        {isEditing ? (
          <div className="text-card-edit-wrap nodrag" onClick={(e) => e.stopPropagation()}>
            <textarea
              ref={textareaRef}
              className="text-card-inline-textarea"
              style={{ color: textColor }}
              value={textDraft}
              onChange={(e) => setTextDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Введите текст или описание..."
              rows={3}
            />
            <div className="text-card-edit-actions">
              <span className="text-card-shortcut-hint">Ctrl+Enter для сохранения</span>
              <button
                type="button"
                className="row-inline-save-btn"
                onClick={handleSaveText}
                title="Сохранить"
              >
                ✓ Сохранить
              </button>
              <button
                type="button"
                className="row-inline-del-btn"
                onClick={() => {
                  setTextDraft(text);
                  setIsEditing(false);
                }}
                title="Отмена"
              >
                ✕
              </button>
            </div>
          </div>
        ) : (
          <div
            className={`text-card-content-display font-${fontSize}`}
            style={{ color: textColor, textAlign: align }}
            onClick={() => setIsEditing(true)}
            title="Двойной клик для редактирования"
          >
            {text}
          </div>
        )}
      </div>

      {/* Scale handle at bottom-right */}
      <div
        className="block-corner-scale-handle block-corner-br nodrag"
        onPointerDown={(e) => handleCornerPointerDown('bottom-right', e)}
        title="Потяните для пропорционального масштабирования"
      >
        <span className="scale-grip-dots">⠿</span>
      </div>

      {isScaling && liveScalePercent !== null && (
        <div className="block-scale-live-pill nodrag">
          🔍 {liveScalePercent}%
        </div>
      )}
    </div>
  );
}
