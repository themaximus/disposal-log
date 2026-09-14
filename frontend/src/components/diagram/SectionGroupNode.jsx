import React, { useState, useEffect, useRef, useContext } from 'react';
import { NodeResizer } from '@xyflow/react';
import { DiagramActionsContext } from '../DiagramActionsContext';
import EmojiPickerPopover from './EmojiPickerPopover';

const THEMES = [
  { id: 'crimson', label: 'Crimson Red', color: '#ff4455', border: '#ff4455', bg: 'rgba(255, 68, 85, 0.06)' },
  { id: 'cyberpunk', label: 'Cyberpunk Blue', color: '#58a6ff', border: '#58a6ff', bg: 'rgba(56, 166, 255, 0.06)' },
  { id: 'emerald', label: 'Emerald Green', color: '#3fb950', border: '#3fb950', bg: 'rgba(63, 185, 80, 0.06)' },
  { id: 'amethyst', label: 'Amethyst Purple', color: '#bc8cff', border: '#bc8cff', bg: 'rgba(188, 140, 255, 0.06)' },
  { id: 'amber', label: 'Amber Yellow', color: '#d29922', border: '#d29922', bg: 'rgba(210, 153, 34, 0.06)' },
  { id: 'slate', label: 'Slate Grey', color: '#8b949e', border: '#444c56', bg: 'rgba(139, 148, 158, 0.06)' },
];

export default function SectionGroupNode({ id, data, selected }) {
  const actions = useContext(DiagramActionsContext);
  const onUngroup = actions?.onUngroup;
  const onDeleteSection = actions?.onDeleteSection || actions?.onDeleteNode;
  const onUpdateSection = actions?.onUpdateSection;

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

  return (
    <div
      className={`diagram-section-node theme-${currentTheme.id} style-${borderStyle} ${selected ? 'is-selected' : ''}`}
      style={{
        width: '100%',
        height: '100%',
        borderColor: currentTheme.border,
        borderStyle: borderStyle,
        backgroundColor: currentTheme.bg
      }}
    >
      {/* Resizer controls when section is selected */}
      <NodeResizer
        isVisible={selected}
        minWidth={260}
        minHeight={160}
        lineClassName="section-resizer-line"
        handleClassName="section-resizer-handle"
        color={currentTheme.color}
      />

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
