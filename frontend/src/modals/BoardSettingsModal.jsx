import React, { useState, useEffect } from 'react';

export default function BoardSettingsModal({
  board,
  columns,
  currentUser,
  onClose,
  onUpdateBoard,
  onSaveColumns,
  onAddColumn,
  onEditColumn,
  onDeleteColumn,
  onToggleBoardMode,
  onDeleteBoard
}) {
  const [activeTab, setActiveTab] = useState('general');

  // General Settings State
  const [boardName, setBoardName] = useState(board ? board.name : '');
  const [boardIcon, setBoardIcon] = useState(board ? (board.icon || '📋') : '📋');
  const [boardDesc, setBoardDesc] = useState(board ? (board.description || '') : '');

  // Columns State
  const [colsList, setColsList] = useState(columns || []);
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColTitle, setNewColTitle] = useState('');
  const [newColColor, setNewColColor] = useState('#388bfd');

  // Share & Copy State
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (board) {
      setBoardName(board.name || '');
      setBoardIcon(board.icon || '📋');
      setBoardDesc(board.description || '');
    }
  }, [board]);

  useEffect(() => {
    setColsList(columns || []);
  }, [columns]);

  if (!board) return null;

  const handleSaveGeneral = (e) => {
    e.preventDefault();
    if (!boardName.trim()) return;
    if (typeof onUpdateBoard === 'function') {
      onUpdateBoard({
        ...board,
        name: boardName.trim(),
        icon: boardIcon,
        description: boardDesc.trim()
      });
    }
  };

  const handleMoveUp = (index) => {
    if (index <= 0) return;
    const updated = [...colsList];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    const reordered = updated.map((c, idx) => ({ ...c, position: idx }));
    setColsList(reordered);
    onSaveColumns(reordered);
  };

  const handleMoveDown = (index) => {
    if (index >= colsList.length - 1) return;
    const updated = [...colsList];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    const reordered = updated.map((c, idx) => ({ ...c, position: idx }));
    setColsList(reordered);
    onSaveColumns(reordered);
  };

  const handleCreateColumnSubmit = (e) => {
    e.preventDefault();
    if (!newColTitle.trim()) return;
    onAddColumn({
      title: newColTitle.trim(),
      color: newColColor,
      board_id: board.id
    });
    setNewColTitle('');
    setIsAddingColumn(false);
  };

  const getShareUrl = () => {
    const origin = window.location.origin;
    const token = board.share_token || board.id;
    return `${origin}/?share=${token}`;
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(getShareUrl());
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const iconOptions = ['📋', '🚀', '🎮', '⚙️', '📁', '🎨', '⚡', '📊', '🎯', '🔥', '🏆', '🛠️', '💡', '📌', '📦'];

  return (
    <div className="modal-overlay active">
      <div
        className="modal"
        style={{
          maxWidth: '840px',
          width: '92vw',
          height: '82vh',
          maxHeight: '640px',
          padding: 0,
          display: 'flex',
          flexDirection: 'row',
          overflow: 'hidden',
          borderRadius: '12px'
        }}
      >
        {/* Left Discord-Style Settings Sidebar */}
        <div style={{
          width: '230px',
          background: 'var(--github-canvas)',
          borderRight: '1px solid var(--github-border)',
          display: 'flex',
          flexDirection: 'column',
          padding: '1.25rem 0.75rem',
          gap: '0.4rem',
          flexShrink: 0
        }}>
          {/* Header Info */}
          <div style={{ padding: '0 0.5rem 0.9rem 0.5rem', borderBottom: '1px solid var(--github-border)', marginBottom: '0.4rem' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Настройки Доски
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              <span>{board.icon || '📋'}</span>
              <span>{board.name}</span>
            </div>
          </div>

          {/* Navigation Items */}
          <button
            type="button"
            className={`sidebar-nav-btn ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
            style={{ padding: '0.55rem 0.75rem', fontSize: '0.84rem' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>settings</span>
            Основное
          </button>

          <button
            type="button"
            className={`sidebar-nav-btn ${activeTab === 'columns' ? 'active' : ''}`}
            onClick={() => setActiveTab('columns')}
            style={{ padding: '0.55rem 0.75rem', fontSize: '0.84rem' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>view_column</span>
            Колонки и процессы
          </button>

          <button
            type="button"
            className={`sidebar-nav-btn ${activeTab === 'sync' ? 'active' : ''}`}
            onClick={() => setActiveTab('sync')}
            style={{ padding: '0.55rem 0.75rem', fontSize: '0.84rem' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>cloud_sync</span>
            Синхронизация
          </button>

          <button
            type="button"
            className={`sidebar-nav-btn ${activeTab === 'share' ? 'active' : ''}`}
            onClick={() => setActiveTab('share')}
            style={{ padding: '0.55rem 0.75rem', fontSize: '0.84rem' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>share</span>
            Доступ и шеринг
          </button>

          <div style={{ flex: 1 }} />

          <button
            type="button"
            className={`sidebar-nav-btn ${activeTab === 'danger' ? 'active' : ''}`}
            onClick={() => setActiveTab('danger')}
            style={{
              padding: '0.55rem 0.75rem',
              fontSize: '0.84rem',
              color: activeTab === 'danger' ? '#f85149' : '#f85149',
              background: activeTab === 'danger' ? 'rgba(248, 81, 73, 0.15)' : 'transparent',
              borderColor: activeTab === 'danger' ? 'rgba(248, 81, 73, 0.3)' : 'transparent'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.1rem', color: '#f85149' }}>delete</span>
            Удалить доску
          </button>
        </div>

        {/* Right Main Content Area */}
        <div style={{
          flex: 1,
          background: 'var(--github-surface)',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          position: 'relative'
        }}>
          {/* Top Close Button */}
          <button
            className="btn-close"
            onClick={onClose}
            title="Закрыть"
            style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', zIndex: 10 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>close</span>
          </button>

          <div style={{ padding: '1.75rem 2rem', flex: 1 }}>

            {/* TAB 1: GENERAL */}
            {activeTab === 'general' && (
              <form onSubmit={handleSaveGeneral} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.2rem' }}>
                    Общие настройки доски
                  </h2>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                    Измените название, иконку и описание текущей доски.
                  </p>
                </div>

                <div className="form-group">
                  <label>Иконка доски</label>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {iconOptions.map(ico => (
                      <button
                        key={ico}
                        type="button"
                        onClick={() => setBoardIcon(ico)}
                        style={{
                          width: '36px',
                          height: '36px',
                          fontSize: '1.2rem',
                          borderRadius: '8px',
                          border: boardIcon === ico ? '2px solid var(--github-blue)' : '1px solid var(--github-border)',
                          background: boardIcon === ico ? 'rgba(56, 139, 253, 0.15)' : 'var(--github-canvas)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {ico}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label>Название доски</label>
                  <input
                    type="text"
                    value={boardName}
                    onChange={e => setBoardName(e.target.value)}
                    placeholder="Например: Проект GDD 2026..."
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Описание / Заметки к доске</label>
                  <textarea
                    rows={3}
                    value={boardDesc}
                    onChange={e => setBoardDesc(e.target.value)}
                    placeholder="Дополнительные детали про задачи на этой доске..."
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                  <button type="submit" className="btn btn-primary" style={{ padding: '0.55rem 1.4rem' }}>
                    Сохранить изменения
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: COLUMNS */}
            {activeTab === 'columns' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.2rem' }}>
                    Управление колонками
                  </h2>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                    Настройте этапы Kanban пайплайна, порядок отображения и цвета колонок.
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '340px', overflowY: 'auto' }}>
                  {colsList.map((col, idx) => (
                    <div
                      key={col.id || idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justify: 'space-between',
                        background: 'var(--github-canvas)',
                        border: '1px solid var(--github-border)',
                        borderRadius: '8px',
                        padding: '0.6rem 0.85rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', width: '20px' }}>
                          #{idx + 1}
                        </span>
                        <span style={{ width: '14px', height: '14px', borderRadius: '50%', background: col.color || '#388bfd' }} />
                        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>
                          {col.title}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <button
                          type="button"
                          className="btn-icon"
                          disabled={idx === 0}
                          onClick={() => handleMoveUp(idx)}
                          title="Поднять выше"
                          style={{ opacity: idx === 0 ? 0.3 : 1 }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>arrow_upward</span>
                        </button>
                        <button
                          type="button"
                          className="btn-icon"
                          disabled={idx === colsList.length - 1}
                          onClick={() => handleMoveDown(idx)}
                          title="Опустить ниже"
                          style={{ opacity: idx === colsList.length - 1 ? 0.3 : 1 }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>arrow_downward</span>
                        </button>
                        <button
                          type="button"
                          className="btn-icon"
                          onClick={() => {
                            if (typeof onEditColumn === 'function') onEditColumn(col);
                          }}
                          title="Изменить колонку"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>edit</span>
                        </button>
                        <button
                          type="button"
                          className="btn-icon"
                          onClick={() => {
                            if (typeof onDeleteColumn === 'function') onDeleteColumn(col.id);
                          }}
                          title="Удалить колонку"
                          style={{ color: '#f85149' }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {!isAddingColumn ? (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setIsAddingColumn(true)}
                    style={{ width: '100%', justifyContent: 'center', padding: '0.6rem' }}
                  >
                    + Добавить новую колонку
                  </button>
                ) : (
                  <form onSubmit={handleCreateColumnSubmit} style={{ background: 'var(--github-canvas)', border: '1px solid var(--github-border)', borderRadius: '8px', padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>Новая колонка</div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        type="text"
                        value={newColTitle}
                        onChange={e => setNewColTitle(e.target.value)}
                        placeholder="Название колонки..."
                        autoFocus
                        style={{ flex: 1 }}
                      />
                      <input
                        type="color"
                        value={newColColor}
                        onChange={e => setNewColColor(e.target.value)}
                        style={{ width: '40px', height: '36px', padding: 0, border: 'none', background: 'transparent', cursor: 'pointer' }}
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                      <button type="button" className="btn btn-secondary" onClick={() => setIsAddingColumn(false)}>Отмена</button>
                      <button type="submit" className="btn btn-primary">Создать</button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* TAB 3: SYNC */}
            {activeTab === 'sync' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.2rem' }}>
                    Синхронизация и режим работы
                  </h2>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                    Выберите способ хранения этой доски: локальный или облачный SQLite.
                  </p>
                </div>

                <div style={{
                  background: 'var(--github-canvas)',
                  border: '1px solid var(--github-border)',
                  borderRadius: '8px',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span>{board.is_offline ? '💾 Локальный режим (Offline)' : '☁️ Облачный режим (Online)'}</span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      {board.is_offline
                        ? 'Данные этой доски хранятся локально в вашем браузере.'
                        : 'Данные синхронизируются с сервером и Telegram.'}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      if (typeof onToggleBoardMode === 'function') onToggleBoardMode(board);
                    }}
                    style={{ padding: '0.5rem 0.9rem', fontSize: '0.82rem' }}
                  >
                    Переключить в {board.is_offline ? 'Облако ☁️' : 'Офлайн 💾'}
                  </button>
                </div>
              </div>
            )}

            {/* TAB 4: SHARE */}
            {activeTab === 'share' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.2rem' }}>
                    Доступ и публикация по ссылке
                  </h2>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                    Поделитесь этой доской для просмотра коллегами или заказчиками.
                  </p>
                </div>

                <div style={{ background: 'var(--github-canvas)', border: '1px solid var(--github-border)', borderRadius: '8px', padding: '1rem' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '0.4rem' }}>
                    Публичная ссылка для просмотра
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      readOnly
                      value={getShareUrl()}
                      style={{ flex: 1, color: 'var(--github-blue-text)', fontWeight: 600 }}
                    />
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleCopyLink}
                      style={{ padding: '0.5rem 1rem' }}
                    >
                      {copiedLink ? '✓ Скопировано!' : 'Скопировать'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: DANGER ZONE */}
            {activeTab === 'danger' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f85149', marginBottom: '0.2rem' }}>
                    Опасная зона (Danger Zone)
                  </h2>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                    Действия в этой секции необратимы.
                  </p>
                </div>

                <div style={{
                  background: 'rgba(248, 81, 73, 0.08)',
                  border: '1px solid rgba(248, 81, 73, 0.3)',
                  borderRadius: '8px',
                  padding: '1.1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem'
                }}>
                  <div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#f85149' }}>
                      Удалить эту доску
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      Все задачи и колонки доски «{board.name}» будут удалены.
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      onClose();
                      if (typeof onDeleteBoard === 'function') onDeleteBoard(board);
                    }}
                    style={{
                      background: '#da3633',
                      color: '#ffffff',
                      borderColor: '#f85149',
                      padding: '0.55rem 1.1rem',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    🔥 Удалить доску
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
