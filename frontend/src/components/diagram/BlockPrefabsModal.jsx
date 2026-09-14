import React, { useState, useEffect } from 'react';
import { DEFAULT_BLOCK_PREFABS, getSavedBlockPrefabs, deleteBlockPrefab, BLOCK_THEMES } from '../../utils/diagramStorage';

export default function BlockPrefabsModal({
  isOpen,
  onClose,
  onSpawnPrefab
}) {
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'custom'
  const [customPrefabs, setCustomPrefabs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const loadCustom = () => {
    setCustomPrefabs(getSavedBlockPrefabs());
  };

  useEffect(() => {
    if (isOpen) {
      loadCustom();
      setSearchQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const allPrefabs = [...customPrefabs, ...DEFAULT_BLOCK_PREFABS];
  const displayList = (activeTab === 'custom' ? customPrefabs : allPrefabs).filter(p => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (p.title || '').toLowerCase().includes(q) ||
           (p.description || '').toLowerCase().includes(q) ||
           (p.tag || '').toLowerCase().includes(q);
  });

  const handleDeleteCustom = (e, prefabId) => {
    e.stopPropagation();
    if (window.confirm('Удалить этот пользовательский префаб из библиотеки?')) {
      const updated = deleteBlockPrefab(prefabId);
      setCustomPrefabs(updated);
    }
  };

  const handleSpawn = (prefab) => {
    if (onSpawnPrefab) {
      onSpawnPrefab(prefab);
    }
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content diagram-modal block-prefabs-modal" style={{ maxWidth: '780px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--github-yellow)' }}>
              category
            </span>
            <h2 className="modal-title">Библиотека префабов блоков</h2>
          </div>
          <button className="btn-close-modal" onClick={onClose}>✕</button>
        </div>

        {/* Toolbar: Search and Filter Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid var(--github-border)', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className={`node-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
              style={{ padding: '6px 12px', fontSize: '0.82rem' }}
              onClick={() => setActiveTab('all')}
            >
              Все префабы ({allPrefabs.length})
            </button>
            <button
              className={`node-tab-btn ${activeTab === 'custom' ? 'active' : ''}`}
              style={{ padding: '6px 12px', fontSize: '0.82rem' }}
              onClick={() => setActiveTab('custom')}
            >
              Мои префабы ({customPrefabs.length})
            </button>
          </div>

          <div style={{ width: '220px' }}>
            <input
              type="text"
              className="form-control"
              style={{ padding: '5px 10px', fontSize: '0.82rem' }}
              placeholder="Поиск префаба..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto', padding: '16px 20px' }}>
          {displayList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '3rem', opacity: 0.4, marginBottom: '8px' }}>
                extension_off
              </span>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>
                {activeTab === 'custom'
                  ? 'У вас пока нет сохранённых префабов. Настройте любой блок на холсте и нажмите 🎨 -> «⭐ В префабы»!'
                  : 'Префабы не найдены по вашему запросу.'}
              </p>
            </div>
          ) : (
            <div className="prefabs-grid">
              {displayList.map(prefab => {
                const theme = BLOCK_THEMES.find(t => t.id === (prefab.theme || 'default')) || BLOCK_THEMES[0];
                const itemCount = prefab.type === 'hierarchyNode'
                  ? (prefab.data?.items?.length || 0)
                  : (prefab.data?.lines?.length || 0);

                return (
                  <div
                    key={prefab.id}
                    className="prefab-card"
                    style={{ borderColor: theme.border }}
                    onClick={() => handleSpawn(prefab)}
                  >
                    <div className="prefab-card-header">
                      <span
                        className="prefab-badge"
                        style={{ background: theme.badgeBg, color: theme.badgeText, border: `1px solid ${theme.accent}` }}
                      >
                        {prefab.tag || (prefab.type === 'hierarchyNode' ? 'PREFAB' : 'LOGIC')}
                      </span>

                      {prefab.isCustom && (
                        <button
                          className="btn-del-custom-prefab"
                          onClick={(e) => handleDeleteCustom(e, prefab.id)}
                          title="Удалить из библиотеки"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    <div className="prefab-card-body">
                      <div className="prefab-card-title" style={{ color: theme.accent }}>
                        {prefab.title}
                      </div>
                      <div className="prefab-card-desc">
                        {prefab.description}
                      </div>
                    </div>

                    <div className="prefab-card-footer">
                      <span className="prefab-items-count">
                        {prefab.type === 'hierarchyNode' ? `📦 ${itemCount} комп.` : `⚡ ${itemCount} шагов`}
                      </span>
                      <button
                        type="button"
                        className="btn-spawn-prefab"
                        onClick={(e) => { e.stopPropagation(); handleSpawn(prefab); }}
                      >
                        + На холст
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Закрыть</button>
        </div>
      </div>
    </div>
  );
}
