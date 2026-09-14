import React, { useState, useEffect } from 'react';
import { BLOCK_THEMES } from '../../utils/diagramStorage';
import EmojiPickerPopover from './EmojiPickerPopover';

const ACCENT_COLORS = [
  { label: 'Синий', value: '#58a6ff' },
  { label: 'Циан / Неон', value: '#00f0ff' },
  { label: 'Изумруд', value: '#3fb950' },
  { label: 'Янтарь', value: '#d29922' },
  { label: 'Рубин', value: '#f85149' },
  { label: 'Аметист', value: '#bc8cff' },
  { label: 'Белый', value: '#f0f6fc' }
];

const BADGE_COLORS = [
  { label: 'Default', bg: 'rgba(56, 139, 253, 0.15)', text: '#58a6ff' },
  { label: 'Cyan', bg: 'rgba(0, 240, 255, 0.18)', text: '#00f0ff' },
  { label: 'Green', bg: 'rgba(63, 185, 80, 0.18)', text: '#3fb950' },
  { label: 'Gold', bg: 'rgba(210, 153, 34, 0.18)', text: '#d29922' },
  { label: 'Red', bg: 'rgba(248, 81, 73, 0.18)', text: '#f85149' },
  { label: 'Purple', bg: 'rgba(188, 140, 255, 0.18)', text: '#bc8cff' }
];

export default function BlockInspectorModal({
  isOpen,
  onClose,
  node,
  onUpdateNodeData,
  onSavePrefab
}) {
  const [activeTab, setActiveTab] = useState('style'); // 'style' | 'meta' | 'structure' | 'prefab'
  const [formData, setFormData] = useState({});
  const [prefabName, setPrefabName] = useState('');
  const [prefabDesc, setPrefabDesc] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [pickerItemIdx, setPickerItemIdx] = useState(null);

  useEffect(() => {
    if (node) {
      setFormData(JSON.parse(JSON.stringify(node.data || {})));
      const defaultName = node.type === 'hierarchyNode'
        ? (node.data?.items?.[0]?.name || node.data?.tag || 'Новый Префаб')
        : (node.data?.title?.split('(')[0] || 'Новая Логика');
      setPrefabName(defaultName);
      setPrefabDesc(node.type === 'hierarchyNode' ? 'Пользовательский префаб иерархии' : 'Пользовательский блок логики');
      setSavedSuccess(false);
    }
  }, [node, isOpen]);

  if (!isOpen || !node) return null;

  const handleFieldChange = (field, value) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    onUpdateNodeData(node.id, updated);
  };

  const handleSelectTheme = (themeId) => {
    const theme = BLOCK_THEMES.find(t => t.id === themeId);
    if (!theme) return;
    const updated = {
      ...formData,
      theme: theme.id,
      customBg: theme.bg,
      customBorder: theme.border,
      customAccent: theme.accent,
      badgeBg: theme.badgeBg,
      badgeText: theme.badgeText,
      glowColor: theme.glowColor
    };
    setFormData(updated);
    onUpdateNodeData(node.id, updated);
  };

  // Structure manipulation: Reorder, duplicate, delete rows
  const handleMoveHierarchyItem = (index, direction) => {
    const items = [...(formData.items || [])];
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= items.length) return;

    const temp = items[index];
    items[index] = items[targetIdx];
    items[targetIdx] = temp;

    // Maintain isLast flag
    items.forEach((it, idx) => {
      it.isLast = idx === items.length - 1;
    });

    handleFieldChange('items', items);
  };

  const handleDuplicateHierarchyItem = (index) => {
    const items = [...(formData.items || [])];
    const source = items[index];
    const duplicated = {
      ...source,
      name: `${source.name}_Copy`,
      isLast: false
    };
    items.splice(index + 1, 0, duplicated);
    items[items.length - 1].isLast = true;
    handleFieldChange('items', items);
  };

  const handleDeleteHierarchyItem = (index) => {
    let items = (formData.items || []).filter((_, idx) => idx !== index);
    if (items.length > 0) {
      items[items.length - 1] = { ...items[items.length - 1], isLast: true };
    }
    handleFieldChange('items', items);
  };

  const handleIndentHierarchyItem = (index, delta) => {
    const items = [...(formData.items || [])];
    if (index >= 0 && index < items.length) {
      const curLevel = items[index].level || 0;
      items[index] = { ...items[index], level: Math.max(0, Math.min(6, curLevel + delta)) };
      handleFieldChange('items', items);
    }
  };

  const handleAddSubHierarchyItem = (index) => {
    const items = [...(formData.items || [])];
    const parentItem = items[index];
    const parentLevel = parentItem ? (parentItem.level || 0) : 0;
    let insertIdx = index + 1;
    while (insertIdx < items.length && (items[insertIdx].level || 0) > parentLevel) {
      insertIdx++;
    }
    items.splice(insertIdx, 0, {
      level: parentLevel + 1,
      isLast: true,
      icon: '⚙️',
      name: 'NewChildObject',
      details: 'Component, Script'
    });
    handleFieldChange('items', items);
  };

  const handleMoveLogicLine = (index, direction) => {
    const lines = [...(formData.lines || [])];
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= lines.length) return;

    const temp = lines[index];
    lines[index] = lines[targetIdx];
    lines[targetIdx] = temp;

    lines.forEach((l, idx) => {
      l.prefix = idx === lines.length - 1 ? '└── ' : '├── ';
    });

    handleFieldChange('lines', lines);
  };

  const handleDuplicateLogicLine = (index) => {
    const lines = [...(formData.lines || [])];
    const source = lines[index];
    const duplicated = {
      ...source,
      code: `${source.code} // copy`,
      prefix: '├── '
    };
    lines.splice(index + 1, 0, duplicated);
    lines[lines.length - 1].prefix = '└── ';
    handleFieldChange('lines', lines);
  };

  const handleDeleteLogicLine = (index) => {
    let lines = (formData.lines || []).filter((_, idx) => idx !== index);
    if (lines.length > 0) {
      lines[lines.length - 1] = { ...lines[lines.length - 1], prefix: '└── ' };
    }
    handleFieldChange('lines', lines);
  };

  // Save as reusable block prefab
  const handleSaveAsPrefab = () => {
    if (!prefabName.trim()) return;
    const newPrefab = {
      title: prefabName.trim(),
      description: prefabDesc.trim() || 'Пользовательский шаблон блока',
      type: node.type,
      theme: formData.theme || 'default',
      glow: !!formData.glow,
      tag: formData.tag || formData.nodeType || 'CUSTOM',
      data: JSON.parse(JSON.stringify(formData))
    };

    if (onSavePrefab) {
      onSavePrefab(newPrefab);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal modal-content diagram-modal block-inspector-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--github-blue-text)' }}>
              palette
            </span>
            <h2 className="modal-title">Инспектор и стиль блока</h2>
          </div>
          <button className="btn-close-modal" onClick={onClose}>✕</button>
        </div>

        {/* Tab Navigation */}
        <div className="node-editor-tabs-bar">
          <button
            className={`node-tab-btn ${activeTab === 'style' ? 'active' : ''}`}
            onClick={() => setActiveTab('style')}
          >
            🎨 Внешний вид и стиль
          </button>
          <button
            className={`node-tab-btn ${activeTab === 'meta' ? 'active' : ''}`}
            onClick={() => setActiveTab('meta')}
          >
            🏷️ Бейдж и Роль
          </button>
          <button
            className={`node-tab-btn ${activeTab === 'structure' ? 'active' : ''}`}
            onClick={() => setActiveTab('structure')}
          >
            📐 Структура (⬆️/⬇️)
          </button>
          <button
            className={`node-tab-btn ${activeTab === 'prefab' ? 'active' : ''}`}
            onClick={() => setActiveTab('prefab')}
          >
            ⭐ В префабы
          </button>
        </div>

        <div className="modal-body" style={{ maxHeight: '65vh', overflowY: 'auto', padding: '16px 20px' }}>
          {/* TAB 1: STYLE */}
          {activeTab === 'style' && (
            <div className="inspector-tab-content">
              <div className="form-group">
                <label className="form-label" style={{ marginBottom: '8px' }}>
                  Готовые темы оформления (Color Schemes)
                </label>
                <div className="themes-grid">
                  {BLOCK_THEMES.map(th => {
                    const isSelected = (formData.theme || 'default') === th.id;
                    return (
                      <div
                        key={th.id}
                        className={`theme-card-option ${isSelected ? 'active' : ''}`}
                        onClick={() => handleSelectTheme(th.id)}
                      >
                        <div className="theme-card-preview" style={{ background: th.bg, borderColor: th.border }}>
                          <span className="theme-dot" style={{ background: th.accent }}></span>
                          <span className="theme-badge-mini" style={{ background: th.badgeBg, color: th.badgeText }}>TAG</span>
                        </div>
                        <div className="theme-card-title">{th.name}</div>
                        <div className="theme-card-sub">{th.description}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Неоновое свечение (Glow)</label>
                  <label className="toggle-switch-label">
                    <input
                      type="checkbox"
                      checked={!!formData.glow}
                      onChange={(e) => handleFieldChange('glow', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                    <span style={{ fontSize: '0.84rem', color: formData.glow ? '#58a6ff' : 'var(--text-muted)' }}>
                      {formData.glow ? 'Включено (Neon Glow)' : 'Выключено'}
                    </span>
                  </label>
                </div>

                <div className="form-group">
                  <label className="form-label">Стиль рамки</label>
                  <select
                    className="form-control"
                    value={formData.borderStyle || 'solid'}
                    onChange={(e) => handleFieldChange('borderStyle', e.target.value)}
                  >
                    <option value="solid">Сплошная (Solid)</option>
                    <option value="dashed">Пунктирная (Dashed)</option>
                    <option value="dotted">Точечная (Dotted)</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '12px' }}>
                <label className="form-label">Цвет акцента и коннекторов</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {ACCENT_COLORS.map(acc => (
                    <button
                      key={acc.value}
                      type="button"
                      className={`accent-color-chip ${formData.customAccent === acc.value ? 'selected' : ''}`}
                      style={{ background: acc.value }}
                      onClick={() => handleFieldChange('customAccent', acc.value)}
                      title={acc.label}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: META & BADGE */}
          {activeTab === 'meta' && (
            <div className="inspector-tab-content">
              <div className="form-group">
                <label className="form-label">Текст бейджа / Роль сущности</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.tag || formData.nodeType || ''}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase();
                    if (node.type === 'hierarchyNode') {
                      handleFieldChange('tag', val);
                    } else {
                      handleFieldChange('nodeType', val);
                    }
                  }}
                  placeholder="Например: PREFAB, PLAYER, AI FSM, WEAPON, LOOT"
                />
              </div>

              <div className="form-group" style={{ marginTop: '12px' }}>
                <label className="form-label">Цвет бейджа</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {BADGE_COLORS.map(b => (
                    <button
                      key={b.label}
                      type="button"
                      className="badge-color-preset"
                      style={{ background: b.bg, color: b.text, border: `1px solid ${b.text}` }}
                      onClick={() => {
                        handleFieldChange('badgeBg', b.bg);
                        handleFieldChange('badgeText', b.text);
                      }}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: STRUCTURE (REORDER & DUPLICATE) */}
          {activeTab === 'structure' && (
            <div className="inspector-tab-content">
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                Здесь можно менять порядок строк вверх и вниз, дублировать строки или удалять их.
              </p>

              {node.type === 'hierarchyNode' ? (
                <div className="inspector-reorder-list">
                  {(formData.items || []).map((item, idx) => (
                    <div key={idx} className="inspector-reorder-item">
                      <div className="row-inline-icon-trigger-wrapper" style={{ position: 'relative' }}>
                        <button
                          type="button"
                          className="reorder-item-icon icon-btn-interactive"
                          onClick={() => setPickerItemIdx(pickerItemIdx === `h_${idx}` ? null : `h_${idx}`)}
                          title="Кликните, чтобы сменить эмодзи"
                        >
                          {item.icon || '🟢'}
                        </button>
                        {pickerItemIdx === `h_${idx}` && (
                          <EmojiPickerPopover
                            currentEmoji={item.icon}
                            onSelect={(selected) => {
                              const updatedItems = [...(formData.items || [])];
                              updatedItems[idx] = { ...updatedItems[idx], icon: selected };
                              handleFieldChange('items', updatedItems);
                              setPickerItemIdx(null);
                            }}
                            onClose={() => setPickerItemIdx(null)}
                          />
                        )}
                      </div>
                      <div className="reorder-item-content">
                        <span className="reorder-item-name">{item.name}</span>
                        {item.details && <span className="reorder-item-details">({item.details})</span>}
                      </div>
                      <div className="reorder-item-actions">
                        <div className="inspector-level-stepper">
                          <button
                            type="button"
                            className="btn-order-action"
                            disabled={(item.level || 0) <= 0}
                            onClick={() => handleIndentHierarchyItem(idx, -1)}
                            title="Уменьшить вложенность (⇤)"
                          >
                            ⇤
                          </button>
                          <span className="reorder-item-level-pill" title={`Уровень: ${item.level || 0}`}>
                            L{item.level || 0}
                          </span>
                          <button
                            type="button"
                            className="btn-order-action"
                            disabled={(item.level || 0) >= 6}
                            onClick={() => handleIndentHierarchyItem(idx, 1)}
                            title="Увеличить вложенность (⇥)"
                          >
                            ⇥
                          </button>
                        </div>
                        <button
                          type="button"
                          className="btn-order-action btn-add-sub-modal"
                          onClick={() => handleAddSubHierarchyItem(idx)}
                          title="Добавить подстроку (дочерний объект ↳)"
                        >
                          ↳+
                        </button>
                        <button
                          type="button"
                          className="btn-order-action"
                          disabled={idx === 0}
                          onClick={() => handleMoveHierarchyItem(idx, -1)}
                          title="Поднять выше"
                        >
                          ⬆️
                        </button>
                        <button
                          type="button"
                          className="btn-order-action"
                          disabled={idx === (formData.items.length - 1)}
                          onClick={() => handleMoveHierarchyItem(idx, 1)}
                          title="Опустить ниже"
                        >
                          ⬇️
                        </button>
                        <button
                          type="button"
                          className="btn-order-action"
                          onClick={() => handleDuplicateHierarchyItem(idx)}
                          title="Дублировать строку"
                        >
                          ❐
                        </button>
                        <button
                          type="button"
                          className="btn-order-action btn-del"
                          onClick={() => handleDeleteHierarchyItem(idx)}
                          title="Удалить строку"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="inspector-reorder-list">
                  {(formData.lines || []).map((line, idx) => (
                    <div key={idx} className="inspector-reorder-item">
                      <div className="row-inline-icon-trigger-wrapper" style={{ position: 'relative' }}>
                        <button
                          type="button"
                          className="reorder-item-icon icon-btn-interactive"
                          onClick={() => setPickerItemIdx(pickerItemIdx === `l_${idx}` ? null : `l_${idx}`)}
                          title="Кликните, чтобы сменить эмодзи"
                        >
                          {line.icon || '⚡'}
                        </button>
                        {pickerItemIdx === `l_${idx}` && (
                          <EmojiPickerPopover
                            currentEmoji={line.icon}
                            onSelect={(selected) => {
                              const updatedLines = [...(formData.lines || [])];
                              updatedLines[idx] = { ...updatedLines[idx], icon: selected };
                              handleFieldChange('lines', updatedLines);
                              setPickerItemIdx(null);
                            }}
                            onClose={() => setPickerItemIdx(null)}
                          />
                        )}
                      </div>
                      <div className="reorder-item-content">
                        <code className="reorder-item-code">{line.code}</code>
                        {line.comment && <span className="reorder-item-comment">({line.comment})</span>}
                      </div>
                      <div className="reorder-item-actions">
                        <button
                          type="button"
                          className="btn-order-action"
                          disabled={idx === 0}
                          onClick={() => handleMoveLogicLine(idx, -1)}
                          title="Поднять выше"
                        >
                          ⬆️
                        </button>
                        <button
                          type="button"
                          className="btn-order-action"
                          disabled={idx === (formData.lines.length - 1)}
                          onClick={() => handleMoveLogicLine(idx, 1)}
                          title="Опустить ниже"
                        >
                          ⬇️
                        </button>
                        <button
                          type="button"
                          className="btn-order-action"
                          onClick={() => handleDuplicateLogicLine(idx)}
                          title="Дублировать строку"
                        >
                          ❐
                        </button>
                        <button
                          type="button"
                          className="btn-order-action btn-del"
                          onClick={() => handleDeleteLogicLine(idx)}
                          title="Удалить строку"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SAVE AS PREFAB */}
          {activeTab === 'prefab' && (
            <div className="inspector-tab-content">
              <p style={{ fontSize: '0.84rem', color: 'var(--text-main)', marginBottom: '14px', lineHeight: 1.5 }}>
                Сохраните текущую конфигурацию блока (со всеми его компонентами, цветами, тегами и настройками) в библиотеку личных префабов. Вы сможете создавать этот блок в 1 клик на любой схеме!
              </p>

              <div className="form-group">
                <label className="form-label">Название префаба</label>
                <input
                  type="text"
                  className="form-control"
                  value={prefabName}
                  onChange={(e) => setPrefabName(e.target.value)}
                  placeholder="Например: Мой Босс Фазы 2, Контроллер Транспорта..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">Описание префаба</label>
                <textarea
                  rows={3}
                  className="form-control"
                  value={prefabDesc}
                  onChange={(e) => setPrefabDesc(e.target.value)}
                  placeholder="Краткое назначение этого блока в проекте"
                />
              </div>

              {savedSuccess ? (
                <div style={{ background: 'rgba(63, 185, 80, 0.15)', border: '1px solid #3fb950', color: '#3fb950', padding: '10px 14px', borderRadius: '6px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>✓</span>
                  <span>Префаб успешно сохранён в вашу библиотеку! Доступен в меню «📦 Префабы».</span>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '10px' }}
                  onClick={handleSaveAsPrefab}
                >
                  <span>⭐ Сохранить в библиотеку префабов</span>
                </button>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>Готово</button>
        </div>
      </div>
    </div>
  );
}
