// NodeEditModal.jsx - Детальный модальный редактор нод (визуальный и raw-текст)
import React from 'react';

const COMMON_ICONS = ['🟢', '👁️', '📷', '🎯', '📱', '📦', '⚔️', '🛡️', '⚙️', '💀', '💡', '🔊', '🎮', '✨', '🧟', '🦴', '⚡', '🔄', '📡', '🏷️'];

export default function NodeEditModal({
  isOpen,
  onClose,
  node,
  editModeTab,
  setEditModeTab,
  editHierarchyData,
  setEditHierarchyData,
  editLogicData,
  setEditLogicData,
  addHierarchyItemRow,
  removeHierarchyItemRow,
  updateHierarchyItemRow,
  addLogicLineRow,
  removeLogicLineRow,
  updateLogicLineRow,
  onSave
}) {
  if (!isOpen || !node) return null;

  const isHierarchy = node.type === 'hierarchyNode';

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal modal-content diagram-modal node-editor-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--github-green-text)' }}>
              edit_document
            </span>
            <h2 className="modal-title">
              {isHierarchy ? 'Редактирование блока префаба' : 'Редактирование блока логики'}
            </h2>
          </div>
          <button className="btn-close-modal" onClick={onClose}>✕</button>
        </div>

        <div className="node-editor-tabs-bar">
          <button
            className={`node-tab-btn ${editModeTab === 'visual' ? 'active' : ''}`}
            onClick={() => setEditModeTab('visual')}
          >
            Визуальный конструктор
          </button>
          <button
            className={`node-tab-btn ${editModeTab === 'raw' ? 'active' : ''}`}
            onClick={() => setEditModeTab('raw')}
          >
            Текстовый режим (Raw Text)
          </button>
        </div>

        <div className="modal-body" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
          {isHierarchy ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Путь к ассету / файлу</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editHierarchyData.rootPath}
                    onChange={(e) => setEditHierarchyData({ ...editHierarchyData, rootPath: e.target.value })}
                    placeholder="Assets/Prefabs/Player/Player.prefab"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Тег сущности</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editHierarchyData.tag}
                    onChange={(e) => setEditHierarchyData({ ...editHierarchyData, tag: e.target.value.toUpperCase() })}
                    placeholder="PREFAB"
                  />
                </div>
              </div>

              {editModeTab === 'visual' ? (
                <div className="form-group">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <label className="form-label" style={{ margin: 0 }}>Компоненты и дочерние объекты</label>
                    <button type="button" className="btn-diagram-tool btn-primary-diagram" onClick={addHierarchyItemRow} style={{ padding: '4px 8px', fontSize: '0.78rem' }}>
                      + Добавить строку
                    </button>
                  </div>

                  <div className="node-builder-table">
                    {editHierarchyData.items.map((item, idx) => (
                      <div key={idx} className="builder-row">
                        <select
                          className="builder-select-level"
                          value={item.level || 0}
                          onChange={(e) => updateHierarchyItemRow(idx, 'level', Number(e.target.value))}
                          title="Уровень вложенности"
                        >
                          <option value="0">Root (lvl 0)</option>
                          <option value="1">Sub (lvl 1)</option>
                          <option value="2">Child (lvl 2)</option>
                          <option value="3">Leaf (lvl 3)</option>
                        </select>

                        <input
                          type="text"
                          className="builder-input-icon"
                          value={item.icon || '🟢'}
                          onChange={(e) => updateHierarchyItemRow(idx, 'icon', e.target.value)}
                          title="Иконка (эмодзи)"
                        />

                        <input
                          type="text"
                          className="builder-input-name"
                          value={item.name}
                          onChange={(e) => updateHierarchyItemRow(idx, 'name', e.target.value)}
                          placeholder="Имя объекта (напр. Main Camera)"
                          title="Имя объекта"
                        />

                        <input
                          type="text"
                          className="builder-input-details"
                          value={item.details || ''}
                          onChange={(e) => updateHierarchyItemRow(idx, 'details', e.target.value)}
                          placeholder="Компоненты (напр. Camera, AudioListener)"
                          title="Компоненты в скобках"
                        />

                        <button
                          type="button"
                          className="builder-btn-delete"
                          onClick={() => removeHierarchyItemRow(idx)}
                          title="Удалить строку"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="icon-palette-bar" style={{ marginTop: '8px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', alignSelf: 'center', marginRight: '4px' }}>Быстрые иконки:</span>
                    {COMMON_ICONS.slice(0, 14).map(icon => (
                      <button
                        key={icon}
                        type="button"
                        className="icon-palette-chip"
                        onClick={() => {
                          if (editHierarchyData.items.length > 0) {
                            updateHierarchyItemRow(editHierarchyData.items.length - 1, 'icon', icon);
                          }
                        }}
                        title={`Вставить ${icon} в последнюю строку`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label">Исходный текст структуры</label>
                  <textarea
                    rows={10}
                    className="form-control"
                    style={{ fontFamily: 'Consolas, monospace', fontSize: '0.86rem' }}
                    value={editHierarchyData.rawText}
                    onChange={(e) => setEditHierarchyData({ ...editHierarchyData, rawText: e.target.value })}
                  />
                </div>
              )}
            </>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Метод / Скрипт</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editLogicData.title}
                    onChange={(e) => setEditLogicData({ ...editLogicData, title: e.target.value })}
                    placeholder="PlayerController.Update()"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Тип блока</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editLogicData.nodeType}
                    onChange={(e) => setEditLogicData({ ...editLogicData, nodeType: e.target.value.toUpperCase() })}
                    placeholder="LOGIC"
                  />
                </div>
              </div>

              {editModeTab === 'visual' ? (
                <div className="form-group">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <label className="form-label" style={{ margin: 0 }}>Шаги выполнения логики</label>
                    <button type="button" className="btn-diagram-tool btn-primary-diagram" onClick={addLogicLineRow} style={{ padding: '4px 8px', fontSize: '0.78rem' }}>
                      + Добавить строку
                    </button>
                  </div>

                  <div className="node-builder-table">
                    {editLogicData.lines.map((line, idx) => (
                      <div key={idx} className="builder-row">
                        <select
                          className="builder-select-level"
                          value={line.level || 0}
                          onChange={(e) => updateLogicLineRow(idx, 'level', Number(e.target.value))}
                          title="Уровень вложенности"
                        >
                          <option value="0">Root (lvl 0)</option>
                          <option value="1">Sub (lvl 1)</option>
                          <option value="2">Child (lvl 2)</option>
                          <option value="3">Leaf (lvl 3)</option>
                        </select>

                        <input
                          type="text"
                          className="builder-input-icon"
                          value={line.icon || '⚡'}
                          onChange={(e) => updateLogicLineRow(idx, 'icon', e.target.value)}
                          title="Иконка шага"
                        />

                        <input
                          type="text"
                          className="builder-input-name"
                          value={line.code}
                          onChange={(e) => updateLogicLineRow(idx, 'code', e.target.value)}
                          placeholder="Код (напр. HandleMovement())"
                          style={{ flex: 1.5 }}
                          title="Код действия"
                        />

                        <input
                          type="text"
                          className="builder-input-details"
                          value={line.comment || ''}
                          onChange={(e) => updateLogicLineRow(idx, 'comment', e.target.value)}
                          placeholder="Пояснение / Комментарий"
                          style={{ flex: 1 }}
                          title="Комментарий"
                        />

                        <button
                          type="button"
                          className="builder-btn-delete"
                          onClick={() => removeLogicLineRow(idx)}
                          title="Удалить строку"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label">Исходный код шагов логики</label>
                  <textarea
                    rows={10}
                    className="form-control"
                    style={{ fontFamily: 'Consolas, monospace', fontSize: '0.86rem' }}
                    value={editLogicData.rawText}
                    onChange={(e) => setEditLogicData({ ...editLogicData, rawText: e.target.value })}
                  />
                </div>
              )}
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Отмена</button>
          <button className="btn btn-primary" onClick={onSave}>Применить изменения</button>
        </div>
      </div>
    </div>
  );
}
