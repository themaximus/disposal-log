import React, { useState, useEffect, useContext, useRef } from 'react';
import { Handle, Position, useUpdateNodeInternals } from '@xyflow/react';
import { DiagramActionsContext } from '../DiagramActionsContext';
import EmojiPickerPopover from './EmojiPickerPopover';
import ColorPickerPopover from './ColorPickerPopover';
import useBlockCornerScale from '../../hooks/useBlockCornerScale';
import { useTreeRowEditor } from '../../hooks/useTreeRowEditor';
import { useNodeHeaderEditor } from '../../hooks/useNodeHeaderEditor';
import { useCopyFeedback } from '../../hooks/useCopyFeedback';
import { computeTreePrefix, getBlockCardStyle, getBlockHandleStyle } from '../../utils/diagramNodeUtils';

const NEW_LINE_DRAFTS = {
  sub: { code: 'ExecuteSubAction()', comment: 'Вложенное действие' },
  sibling: { code: 'PerformAction()', comment: 'Новый шаг' }
};

function LogicStepNode({ id, data, isConnectable, selected }) {
  const updateNodeInternals = useUpdateNodeInternals();
  const actions = useContext(DiagramActionsContext);
  const onOpenInspector = actions?.onOpenInspector || actions?.onEditNode || data?.onEdit;
  const onDeleteNode = actions?.onDeleteNode || data?.onDelete;
  const onQuickAdd = actions?.onQuickAdd || data?.onQuickAdd;
  const onOpenTagModal = actions?.onOpenTagModal || data?.onOpenTagModal;
  const onScaleNode = actions?.onScaleNode;
  const onUpdateLogicLine = actions?.onUpdateLogicLine;
  const onDeleteLogicLine = actions?.onDeleteLogicLine;
  const onAddLogicSubLine = actions?.onAddLogicSubLine;
  const onAddLogicSiblingLine = actions?.onAddLogicSiblingLine;
  const onIndentLogicLine = actions?.onIndentLogicLine;
  const onUpdateLogicTitle = actions?.onUpdateLogicTitle;

  const title = data.title || 'ExecuteLogicStep()';
  const titleIcon = data.titleIcon || '⚙️';
  const titleColor = data.titleColor || '#58a6ff';
  const nodeType = data.nodeType || 'LOGIC';
  const lines = data.lines || [];

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [lineEmojiPickerIdx, setLineEmojiPickerIdx] = useState(null);
  const cardRef = useRef(null);

  const {
    handleCornerPointerDown,
    isScaling,
    liveScalePercent
  } = useBlockCornerScale({ id, data, cardRef });

  useEffect(() => {
    updateNodeInternals(id);
  }, [id, lines.length, data.scale, updateNodeInternals]);

  const {
    editingRowIdx, setEditingRowIdx, selectedRowIdx, setSelectedRowIdx,
    draft: lineDraft, setDraft: setLineDraft, inputRef: codeInputRef,
    startEdit: handleStartRowEdit, saveRow: handleSaveLine, saveAndAddSub: handleSaveAndAddSub,
    addSubRow: handleAddSubRow, addSiblingRow: handleAddSiblingRow, indentDraft: handleIndentDraft,
    rowKeyDown: handleLineKeyDown, deleteRow: handleDeleteLine, quickAdd: handleQuickAddClick
  } = useTreeRowEditor({
    nodeId: id,
    rows: lines,
    primaryField: 'code',
    selectOnEdit: true,
    initialDraft: { code: '', comment: '', icon: '⚡', level: 0, prefix: '├── ' },
    toDraft: (line) => ({
      code: line.code || '',
      comment: line.comment || '',
      icon: line.icon || '⚡',
      level: line.level || 0,
      prefix: line.prefix || '├── '
    }),
    newDraft: (kind, level) => ({ level, icon: '⚡', ...NEW_LINE_DRAFTS[kind] }),
    actions: {
      update: onUpdateLogicLine,
      remove: onDeleteLogicLine,
      addSub: onAddLogicSubLine,
      addSibling: onAddLogicSiblingLine,
      quickAdd: onQuickAdd
    }
  });

  const {
    editing: editingTitle, setEditing: setEditingTitle,
    textDraft: titleDraft, setTextDraft: setTitleDraft,
    iconDraft: titleIconDraft, setIconDraft: setTitleIconDraft,
    colorDraft: titleColorDraft, setColorDraft: setTitleColorDraft,
    showEditEmojiPicker: showTitleEmojiPicker, setShowEditEmojiPicker: setShowTitleEmojiPicker,
    showEditColorPicker: showTitleColorPicker, setShowEditColorPicker: setShowTitleColorPicker,
    showViewEmojiPicker: viewTitleEmojiPicker, setShowViewEmojiPicker: setViewTitleEmojiPicker,
    showViewColorPicker: viewTitleColorPicker, setShowViewColorPicker: setViewTitleColorPicker,
    inputRef: titleInputRef, save: handleSaveTitle, keyDown: handleTitleKeyDown,
    selectViewEmoji: handleSelectViewEmoji, selectViewColor: handleSelectViewColor
  } = useNodeHeaderEditor({
    nodeId: id,
    values: { text: title, icon: titleIcon, color: titleColor },
    fields: { text: 'title', icon: 'titleIcon', color: 'titleColor' },
    onUpdate: onUpdateLogicTitle
  });

  const { copied, copy } = useCopyFeedback();

  const handleCopy = (e) => {
    e.stopPropagation();
    copy(`${nodeType}: ${titleIcon} ${title}\n` + lines.map((l, idx) => {
      const pfx = computeTreePrefix(lines, idx);
      return `${pfx}${l.icon ? l.icon + ' ' : ''}${l.code || ''}${l.comment ? ' // ' + l.comment : ''}`;
    }).join('\n'));
  };

  const handleTagClick = (e) => {
    e.stopPropagation();
    if (onOpenTagModal) onOpenTagModal(id);
  };

  const cardStyle = getBlockCardStyle(data);
  const handleStyle = getBlockHandleStyle(data);

  return (
    <div
      ref={cardRef}
      className={`gamedev-hierarchy-card logic-step-card ${data.theme ? `theme-${data.theme}` : ''} ${data.glow ? 'has-glow' : ''} ${selected ? 'selected' : ''}`}
      style={cardStyle}
    >
      {/* 4 Corner handles for interactive proportional scaling */}
      {selected && (
        <>
          <div
            className="block-corner-scale-handle block-corner-tl nodrag"
            style={{ backgroundColor: data.customAccent || '#d29922' }}
            onPointerDown={(e) => handleCornerPointerDown('top-left', e)}
            title="Масштабировать блок (угол ВЛ)"
          />
          <div
            className="block-corner-scale-handle block-corner-tr nodrag"
            style={{ backgroundColor: data.customAccent || '#d29922' }}
            onPointerDown={(e) => handleCornerPointerDown('top-right', e)}
            title="Масштабировать блок (угол ВП)"
          />
          <div
            className="block-corner-scale-handle block-corner-bl nodrag"
            style={{ backgroundColor: data.customAccent || '#d29922' }}
            onPointerDown={(e) => handleCornerPointerDown('bottom-left', e)}
            title="Масштабировать блок (угол НЛ)"
          />
          <div
            className="block-corner-scale-handle block-corner-br nodrag"
            style={{ backgroundColor: data.customAccent || '#d29922' }}
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
      </div>

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

      <div className="card-tree-content">
        {editingTitle ? (
          <div className="tree-root-row-edit nodrag" onClick={(e) => e.stopPropagation()}>
            {/* Header row handles for connecting to main script/method title */}
            <Handle
              type="source"
              position={Position.Left}
              id="header-left"
              isConnectable={isConnectable}
              className="diagram-handle row-handle row-handle-left"
              title={`Связать главный метод/заголовок: ${titleDraft || title}`}
              style={{ background: titleColorDraft || titleColor }}
            />
            <Handle
              type="source"
              position={Position.Right}
              id="header-right"
              isConnectable={isConnectable}
              className="diagram-handle row-handle row-handle-right"
              title={`Связать главный метод/заголовок: ${titleDraft || title}`}
              style={{ background: titleColorDraft || titleColor }}
            />

            {/* Title emoji picker */}
            <div className="row-inline-icon-trigger-wrapper">
              <button
                type="button"
                className="row-inline-icon-picker-btn root-icon-picker-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowTitleEmojiPicker(prev => !prev);
                  setShowTitleColorPicker(false);
                }}
                title="Выбрать эмодзи для метода"
              >
                <span className="current-icon">{titleIconDraft || '⚙️'}</span>
                <span className="picker-caret">▾</span>
              </button>
              {showTitleEmojiPicker && (
                <EmojiPickerPopover
                  currentEmoji={titleIconDraft}
                  onSelect={(emoji) => {
                    setTitleIconDraft(emoji);
                    setShowTitleEmojiPicker(false);
                  }}
                  onClose={() => setShowTitleEmojiPicker(false)}
                />
              )}
            </div>

            {/* Title color swatch button */}
            <div className="row-inline-color-trigger-wrapper">
              <button
                type="button"
                className="root-color-swatch-btn"
                style={{ backgroundColor: titleColorDraft }}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowTitleColorPicker(prev => !prev);
                  setShowTitleEmojiPicker(false);
                }}
                title="Выбрать цвет заголовка"
              >
                <span className="swatch-inner-dot"></span>
              </button>
              {showTitleColorPicker && (
                <ColorPickerPopover
                  currentColor={titleColorDraft}
                  defaultColor="#58a6ff"
                  onSelect={(color) => setTitleColorDraft(color)}
                  onClose={() => setShowTitleColorPicker(false)}
                  title="Цвет метода / заголовка"
                />
              )}
            </div>

            <input
              ref={titleInputRef}
              type="text"
              className="root-inline-input"
              style={{ color: titleColorDraft, borderColor: titleColorDraft }}
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onKeyDown={handleTitleKeyDown}
              placeholder="ClassName.MethodName()"
            />
            <button className="row-inline-save-btn" onClick={handleSaveTitle} title="Сохранить">✓</button>
            <button className="row-inline-del-btn" onClick={() => {
              setEditingTitle(false);
              setTitleDraft(title);
              setTitleIconDraft(titleIcon);
              setTitleColorDraft(titleColor);
              setShowTitleEmojiPicker(false);
              setShowTitleColorPicker(false);
            }} title="Отмена">✕</button>
          </div>
        ) : (
          <div
            className="tree-root-row logic-root-row tree-root-interactive"
            onClick={(e) => { e.stopPropagation(); setEditingTitle(true); }}
            title="Кликните для редактирования метода/заголовка"
            style={{ color: titleColor }}
          >
            {/* Header row handles for connecting to main script/method title */}
            <Handle
              type="source"
              position={Position.Left}
              id="header-left"
              isConnectable={isConnectable}
              className="diagram-handle row-handle row-handle-left"
              title={`Связать главный метод/заголовок: ${title}`}
              style={{ background: titleColor }}
            />
            <Handle
              type="source"
              position={Position.Right}
              id="header-right"
              isConnectable={isConnectable}
              className="diagram-handle row-handle row-handle-right"
              title={`Связать главный метод/заголовок: ${title}`}
              style={{ background: titleColor }}
            />

            {/* Interactive Emoji in view mode */}
            <div className="row-inline-icon-trigger-wrapper" style={{ display: 'inline-flex' }}>
              <span
                className="logic-icon item-symbol-interactive"
                onClick={(e) => {
                  e.stopPropagation();
                  setViewTitleEmojiPicker(prev => !prev);
                  setViewTitleColorPicker(false);
                }}
                title="Кликните, чтобы сменить эмодзи"
              >
                {titleIcon}
              </span>
              {viewTitleEmojiPicker && (
                <EmojiPickerPopover
                  currentEmoji={titleIcon}
                  onSelect={handleSelectViewEmoji}
                  onClose={() => setViewTitleEmojiPicker(false)}
                />
              )}
            </div>

            <span className="root-path-text logic-method-name" style={{ color: titleColor }}>
              {title}
            </span>

            {/* Hover actions for root row */}
            <div className="root-hover-actions">
              <div className="row-inline-color-trigger-wrapper" style={{ display: 'inline-flex' }}>
                <button
                  type="button"
                  className="root-color-action-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setViewTitleColorPicker(prev => !prev);
                    setViewTitleEmojiPicker(false);
                  }}
                  title="Сменить цвет заголовка"
                >
                  <span className="root-color-dot" style={{ backgroundColor: titleColor }}></span>
                  <span className="root-color-palette-icon">🎨</span>
                </button>
                {viewTitleColorPicker && (
                  <ColorPickerPopover
                    currentColor={titleColor}
                    defaultColor="#58a6ff"
                    onSelect={handleSelectViewColor}
                    onClose={() => setViewTitleColorPicker(false)}
                    title="Цвет метода / заголовка"
                  />
                )}
              </div>
              <span className="row-hover-pencil">✎</span>
            </div>
          </div>
        )}

        <div className="tree-items-list">
          {lines.map((line, idx) => {
            const isEditing = editingRowIdx === idx;
            const branchPrefix = computeTreePrefix(lines, idx);

            if (isEditing) {
              return (
                <div key={idx} className="tree-item-row-edit nodrag" onClick={(e) => e.stopPropagation()}>
                  {/* Row-level component handles */}
                  <Handle
                    type="source"
                    position={Position.Left}
                    id={`line-${idx}-left`}
                    isConnectable={isConnectable}
                    className="diagram-handle row-handle row-handle-left"
                    title={`Связать шаг логики: ${lineDraft.code || lineDraft.comment || 'Шаг'}`}
                  />
                  <Handle
                    type="source"
                    position={Position.Right}
                    id={`line-${idx}-right`}
                    isConnectable={isConnectable}
                    className="diagram-handle row-handle row-handle-right"
                    title={`Связать шаг логики: ${lineDraft.code || lineDraft.comment || 'Шаг'}`}
                  />

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
                  <button type="button" className="row-inline-save-btn row-inline-sub-btn" onClick={() => handleSaveAndAddSub(idx)} title="Сохранить и создать вложенную строку под этой (↳ +)">↳+</button>
                  <button className="row-inline-del-btn" onClick={(e) => handleDeleteLine(e, idx)} title="Удалить строку">✕</button>
                </div>
              );
            }

            return (
              <div
                key={idx}
                className={`tree-item-row logic-code-row tree-item-interactive ${selectedRowIdx === idx ? 'row-selected' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedRowIdx(idx);
                  handleStartRowEdit(idx, line);
                }}
                title="Кликните, чтобы редактировать этот шаг"
              >
                {/* Row-level component handles */}
                <Handle
                  type="source"
                  position={Position.Left}
                  id={`line-${idx}-left`}
                  isConnectable={isConnectable}
                  className="diagram-handle row-handle row-handle-left"
                  title={`Связать шаг логики: ${line.code || line.comment || 'Шаг'}`}
                />
                <Handle
                  type="source"
                  position={Position.Right}
                  id={`line-${idx}-right`}
                  isConnectable={isConnectable}
                  className="diagram-handle row-handle row-handle-right"
                  title={`Связать шаг логики: ${line.code || line.comment || 'Шаг'}`}
                />

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
                    className="row-hover-indent-btn"
                    onClick={(e) => { e.stopPropagation(); if (onIndentLogicLine) onIndentLogicLine(id, idx, -1); }}
                    disabled={(line.level || 0) <= 0}
                    title="Уменьшить вложенность (⇤)"
                  >
                    ⇤
                  </button>
                  <button
                    type="button"
                    className="row-hover-indent-btn"
                    onClick={(e) => { e.stopPropagation(); if (onIndentLogicLine) onIndentLogicLine(id, idx, 1); }}
                    disabled={(line.level || 0) >= 6}
                    title="Увеличить вложенность (⇥)"
                  >
                    ⇥
                  </button>
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

        {/* Quick Add Button */}
        <div className="card-add-buttons-bar nodrag">
          <button
            type="button"
            className="btn-card-add"
            onClick={handleQuickAddClick}
            title="Добавить действие"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>add</span>
            <span>+ Действие</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default React.memo(LogicStepNode);
