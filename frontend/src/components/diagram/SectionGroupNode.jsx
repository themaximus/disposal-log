import React, { useState, useEffect, useRef, useContext } from 'react';
import { Handle, Position } from '@xyflow/react';
import { DiagramActionsContext } from '../DiagramActionsContext';
import EmojiPickerPopover from './EmojiPickerPopover';
import useSectionCornerScale from '../../hooks/useSectionCornerScale';

const THEMES = [
  { id: 'crimson', label: 'Crimson Red', color: '#ff4455', border: '#ff4455', bg: 'rgba(255, 68, 85, 0.06)' },
  { id: 'cyberpunk', label: 'Cyberpunk Blue', color: '#58a6ff', border: '#58a6ff', bg: 'rgba(56, 166, 255, 0.06)' },
  { id: 'emerald', label: 'Emerald Green', color: '#3fb950', border: '#3fb950', bg: 'rgba(63, 185, 80, 0.06)' },
  { id: 'amethyst', label: 'Amethyst Purple', color: '#bc8cff', border: '#bc8cff', bg: 'rgba(188, 140, 255, 0.06)' },
  { id: 'amber', label: 'Amber Yellow', color: '#d29922', border: '#d29922', bg: 'rgba(210, 153, 34, 0.06)' },
  { id: 'slate', label: 'Slate Grey', color: '#8b949e', border: '#444c56', bg: 'rgba(139, 148, 158, 0.06)' },
];

function SectionGroupNode({ id, data, selected, width, height, isConnectable = true }) {
  const actions = useContext(DiagramActionsContext);
  const onUngroup = actions?.onUngroup;
  const onDeleteSection = actions?.onDeleteSection || actions?.onDeleteNode;
  const onUpdateSection = actions?.onUpdateSection;
  const onScaleSection = actions?.onScaleSection;

  const {
    handleCornerPointerDown,
    handleEdgePointerDown,
    isScaling,
    liveScalePercent,
    activeCorner
  } = useSectionCornerScale({ id, data });

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(data.label || 'Новая секция');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const titleInputRef = useRef(null);

  const currentTheme = THEMES.find(t => t.id === (data.theme || 'crimson')) || THEMES[0];
  const borderStyle = data.borderStyle || 'dashed'; // 'dashed' | 'solid'
  const icon = data.icon || '📁';
  const childCount = data.childCount ?? 0;

  useEffect(() => {
    setTitleDraft(data.label || 'Новая секция');
  }, [data.label]);

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  const handleSaveTitle = () => {
    if (onUpdateSection && titleDraft.trim()) {
      onUpdateSection(id, { label: titleDraft.trim() });
    }
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.stopPropagation();
      handleSaveTitle();
    } else if (e.key === 'Escape') {
      e.stopPropagation();
      setTitleDraft(data.label || 'Новая секция');
      setIsEditingTitle(false);
    }
  };

  const handleSelectTheme = (themeId) => {
    if (onUpdateSection) {
      onUpdateSection(id, { theme: themeId });
    }
    setShowThemePicker(false);
  };

  const handleToggleBorderStyle = (e) => {
    e.stopPropagation();
    if (onUpdateSection) {
      onUpdateSection(id, { borderStyle: borderStyle === 'dashed' ? 'solid' : 'dashed' });
    }
  };

  const handleSelectIcon = (newEmoji) => {
    if (onUpdateSection) {
      onUpdateSection(id, { icon: newEmoji });
    }
    setShowEmojiPicker(false);
  };

  const connectable = isConnectable !== false;
  const sectionHandleStyle = {
    backgroundColor: currentTheme.color || '#58a6ff',
    borderColor: '#0d1117'
  };

  return (
    <div
      className={`diagram-section-node theme-${currentTheme.id} style-${borderStyle} ${selected ? 'is-selected' : ''}`}
      style={{
        width: data?.width ? `${data.width}px` : (width ? `${width}px` : '100%'),
        height: data?.height ? `${data.height}px` : (height ? `${height}px` : '100%'),
        borderColor: currentTheme.border,
        borderStyle: borderStyle,
        backgroundColor: currentTheme.bg
      }}
    >
      {/* Connection Handles (Точки привязки к зоне группы): Top, Bottom, Left, Right */}
      {/* Top handles */}
      <Handle type="target" position={Position.Top} id="top-left-target" isConnectable={connectable} style={{ left: '25%', ...sectionHandleStyle }} className="diagram-handle handle-top section-handle" />
      <Handle type="source" position={Position.Top} id="top-left-source" isConnectable={connectable} style={{ left: '25%', ...sectionHandleStyle }} className="diagram-handle handle-top section-handle" />
      <Handle type="target" position={Position.Top} id="top-center-target" isConnectable={connectable} style={{ left: '50%', ...sectionHandleStyle }} className="diagram-handle handle-top section-handle" />
      <Handle type="source" position={Position.Top} id="top-center-source" isConnectable={connectable} style={{ left: '50%', ...sectionHandleStyle }} className="diagram-handle handle-top section-handle" />
      <Handle type="target" position={Position.Top} id="top-right-target" isConnectable={connectable} style={{ left: '75%', ...sectionHandleStyle }} className="diagram-handle handle-top section-handle" />
      <Handle type="source" position={Position.Top} id="top-right-source" isConnectable={connectable} style={{ left: '75%', ...sectionHandleStyle }} className="diagram-handle handle-top section-handle" />

      {/* Bottom handles */}
      <Handle type="target" position={Position.Bottom} id="bottom-left-target" isConnectable={connectable} style={{ left: '25%', ...sectionHandleStyle }} className="diagram-handle handle-bottom section-handle" />
      <Handle type="source" position={Position.Bottom} id="bottom-left-source" isConnectable={connectable} style={{ left: '25%', ...sectionHandleStyle }} className="diagram-handle handle-bottom section-handle" />
      <Handle type="target" position={Position.Bottom} id="bottom-center-target" isConnectable={connectable} style={{ left: '50%', ...sectionHandleStyle }} className="diagram-handle handle-bottom section-handle" />
      <Handle type="source" position={Position.Bottom} id="bottom-center-source" isConnectable={connectable} style={{ left: '50%', ...sectionHandleStyle }} className="diagram-handle handle-bottom section-handle" />
      <Handle type="target" position={Position.Bottom} id="bottom-right-target" isConnectable={connectable} style={{ left: '75%', ...sectionHandleStyle }} className="diagram-handle handle-bottom section-handle" />
      <Handle type="source" position={Position.Bottom} id="bottom-right-source" isConnectable={connectable} style={{ left: '75%', ...sectionHandleStyle }} className="diagram-handle handle-bottom section-handle" />

      {/* Left handles */}
      <Handle type="target" position={Position.Left} id="left-top-target" isConnectable={connectable} style={{ top: '25%', ...sectionHandleStyle }} className="diagram-handle handle-left section-handle" />
      <Handle type="source" position={Position.Left} id="left-top-source" isConnectable={connectable} style={{ top: '25%', ...sectionHandleStyle }} className="diagram-handle handle-left section-handle" />
      <Handle type="target" position={Position.Left} id="left-center-target" isConnectable={connectable} style={{ top: '50%', ...sectionHandleStyle }} className="diagram-handle handle-left section-handle" />
      <Handle type="source" position={Position.Left} id="left-center-source" isConnectable={connectable} style={{ top: '50%', ...sectionHandleStyle }} className="diagram-handle handle-left section-handle" />
      <Handle type="target" position={Position.Left} id="left-bottom-target" isConnectable={connectable} style={{ top: '75%', ...sectionHandleStyle }} className="diagram-handle handle-left section-handle" />
      <Handle type="source" position={Position.Left} id="left-bottom-source" isConnectable={connectable} style={{ top: '75%', ...sectionHandleStyle }} className="diagram-handle handle-left section-handle" />

      {/* Right handles */}
      <Handle type="target" position={Position.Right} id="right-top-target" isConnectable={connectable} style={{ top: '25%', ...sectionHandleStyle }} className="diagram-handle handle-right section-handle" />
      <Handle type="source" position={Position.Right} id="right-top-source" isConnectable={connectable} style={{ top: '25%', ...sectionHandleStyle }} className="diagram-handle handle-right section-handle" />
      <Handle type="target" position={Position.Right} id="right-center-target" isConnectable={connectable} style={{ top: '50%', ...sectionHandleStyle }} className="diagram-handle handle-right section-handle" />
      <Handle type="source" position={Position.Right} id="right-center-source" isConnectable={connectable} style={{ top: '50%', ...sectionHandleStyle }} className="diagram-handle handle-right section-handle" />
      <Handle type="target" position={Position.Right} id="right-bottom-target" isConnectable={connectable} style={{ top: '75%', ...sectionHandleStyle }} className="diagram-handle handle-right section-handle" />
      <Handle type="source" position={Position.Right} id="right-bottom-source" isConnectable={connectable} style={{ top: '75%', ...sectionHandleStyle }} className="diagram-handle handle-right section-handle" />

      {/* Interactive resize and corner scale handles when section is selected */}
      {selected && (
        <>
          {/* 4 Edges for boundary adjustment */}
          <div
            className="section-edge-handle section-edge-top nodrag"
            onPointerDown={(e) => handleEdgePointerDown('top', e)}
            title="Изменить верхнюю границу секции"
          />
          <div
            className="section-edge-handle section-edge-bottom nodrag"
            onPointerDown={(e) => handleEdgePointerDown('bottom', e)}
            title="Изменить нижнюю границу секции"
          />
          <div
            className="section-edge-handle section-edge-left nodrag"
            onPointerDown={(e) => handleEdgePointerDown('left', e)}
            title="Изменить левую границу секции"
          />
          <div
            className="section-edge-handle section-edge-right nodrag"
            onPointerDown={(e) => handleEdgePointerDown('right', e)}
            title="Изменить правую границу секции"
          />

          {/* 4 Corners for proportional scaling of section AND all child blocks */}
          <div
            className="section-corner-handle section-corner-tl nodrag"
            style={{ backgroundColor: currentTheme.color, borderColor: '#161b22' }}
            onPointerDown={(e) => handleCornerPointerDown('top-left', e)}
            title="Масштабировать группу и все блоки внутри (угол ВЛ)"
          />
          <div
            className="section-corner-handle section-corner-tr nodrag"
            style={{ backgroundColor: currentTheme.color, borderColor: '#161b22' }}
            onPointerDown={(e) => handleCornerPointerDown('top-right', e)}
            title="Масштабировать группу и все блоки внутри (угол ВП)"
          />
          <div
            className="section-corner-handle section-corner-bl nodrag"
            style={{ backgroundColor: currentTheme.color, borderColor: '#161b22' }}
            onPointerDown={(e) => handleCornerPointerDown('bottom-left', e)}
            title="Масштабировать группу и все блоки внутри (угол НЛ)"
          />
          <div
            className="section-corner-handle section-corner-br nodrag"
            style={{ backgroundColor: currentTheme.color, borderColor: '#161b22' }}
            onPointerDown={(e) => handleCornerPointerDown('bottom-right', e)}
            title="Масштабировать группу и все блоки внутри (угол НП)"
          />

          {/* Live scale percentage tooltip badge during corner scaling */}
          {isScaling && liveScalePercent && (
            <div className={`section-scale-live-pill corner-${activeCorner}`}>
              Масштаб группы: {liveScalePercent}%
            </div>
          )}
        </>
      )}

      {/* Section Header Bar - Grabbing here moves section and children */}
      <div
        className="section-node-header"
        style={{
          borderBottomColor: borderStyle === 'solid' ? currentTheme.border : 'rgba(255,255,255,0.08)'
        }}
      >
        <div className="section-header-left">
          {/* Section Icon / Emoji Picker trigger */}
          <div style={{ position: 'relative' }}>
            <button
              className="section-icon-btn nodrag"
              onClick={(e) => {
                e.stopPropagation();
                setShowEmojiPicker(prev => !prev);
              }}
              title="Сменить иконку секции"
            >
              {icon}
            </button>
            {showEmojiPicker && (
              <EmojiPickerPopover
                currentEmoji={icon}
                onSelect={handleSelectIcon}
                onClose={() => setShowEmojiPicker(false)}
              />
            )}
          </div>

          {/* Section Title */}
          {isEditingTitle ? (
            <input
              ref={titleInputRef}
              type="text"
              className="section-title-input nodrag"
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onKeyDown={handleTitleKeyDown}
              onBlur={handleSaveTitle}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span
              className="section-title-text"
              onDoubleClick={(e) => {
                e.stopPropagation();
                setIsEditingTitle(true);
              }}
              title="Двойной клик для редактирования названия"
            >
              {data.label || 'Секция'}
            </span>
          )}

          {/* Child elements badge */}
          {childCount > 0 && (
            <span className="section-count-badge" title={`Элементов в секции: ${childCount}`}>
              {childCount} {childCount === 1 ? 'блок' : childCount < 5 ? 'блока' : 'блоков'}
            </span>
          )}
        </div>

        {/* Action icons */}
        <div className="section-header-actions nodrag">
          {/* Section & Group Scale Control */}
          <div className="node-scale-control section-scale-control nodrag">
            <button
              type="button"
              className="btn-scale-step"
              onClick={(e) => {
                e.stopPropagation();
                if (onScaleSection) onScaleSection(id, 0.9);
              }}
              title="Уменьшить масштаб группы (-10%)"
            >
              -
            </button>
            <span
              className="scale-value-label"
              title="Масштаб группы (клик для сброса на 100%)"
              onClick={(e) => {
                e.stopPropagation();
                if (onScaleSection && (data.scale || 1) !== 1) {
                  onScaleSection(id, 1 / (data.scale || 1));
                }
              }}
            >
              {Math.round((data.scale || 1) * 100)}%
            </span>
            <button
              type="button"
              className="btn-scale-step"
              onClick={(e) => {
                e.stopPropagation();
                if (onScaleSection) onScaleSection(id, 1.1);
              }}
              title="Увеличить масштаб группы (+10%)"
            >
              +
            </button>
          </div>

          {/* Theme Palette Picker */}
          <div style={{ position: 'relative' }}>
            <button
              className="section-action-btn"
              onClick={(e) => {
                e.stopPropagation();
                setShowThemePicker(prev => !prev);
              }}
              title="Цвет и тема секции"
              style={{ color: currentTheme.color }}
            >
              🎨
            </button>

            {showThemePicker && (
              <div
                className="section-theme-dropdown nodrag nopan"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="section-theme-title">Цвет секции</div>
                <div className="section-theme-grid">
                  {THEMES.map(theme => (
                    <button
                      key={theme.id}
                      className={`theme-dot-btn ${currentTheme.id === theme.id ? 'active' : ''}`}
                      style={{ backgroundColor: theme.color }}
                      onClick={() => handleSelectTheme(theme.id)}
                      title={theme.label}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Border style toggle */}
          <button
            className="section-action-btn"
            onClick={handleToggleBorderStyle}
            title={borderStyle === 'dashed' ? 'Стиль границы: Пунктир (кликните для сплошной)' : 'Стиль границы: Сплошная (кликните для пунктира)'}
          >
            {borderStyle === 'dashed' ? '╌' : '―'}
          </button>

          {/* Ungroup button */}
          <button
            className="section-action-btn btn-ungroup"
            onClick={(e) => {
              e.stopPropagation();
              if (onUngroup) onUngroup(id);
            }}
            title="Разгруппировать секцию (Ctrl+Shift+G) — блоки останутся на местах"
          >
            🔓
          </button>

          {/* Delete section */}
          <button
            className="section-action-btn btn-delete-section"
            onClick={(e) => {
              e.stopPropagation();
              if (onDeleteSection) onDeleteSection(id);
            }}
            title="Удалить секцию"
          >
            🗑️
          </button>
        </div>
      </div>

      {/* Inner section watermarked title for large zoomed-out view */}
      <div className="section-watermark-label">
        {data.label || 'СЕКЦИЯ'}
      </div>
    </div>
  );
}

export default React.memo(SectionGroupNode);
