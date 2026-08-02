import React from 'react';

export default function BoardSyncModal({ board, onClose, onToggleBoardMode }) {
  if (!board) return null;

  const isOffline = !!board.is_offline;

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal" style={{ maxWidth: '460px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.4rem', color: 'var(--github-blue-text)' }}>
              cloud_sync
            </span>
            <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Синхронизация доски</h2>
          </div>
          <button className="btn-icon" onClick={onClose} title="Закрыть">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Board Name Header */}
          <div style={{ background: 'var(--github-subtle)', padding: '0.8rem 1rem', borderRadius: '8px', border: '1px solid var(--github-border)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
              Текущая доска:
            </span>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {board.icon || '📋'} {board.name}
            </span>
          </div>

          {/* Status Indicator Card */}
          <div style={{ padding: '1rem', borderRadius: '10px', background: isOffline ? 'rgba(56, 139, 253, 0.08)' : 'rgba(46, 160, 67, 0.08)', border: isOffline ? '1px solid rgba(56, 139, 253, 0.25)' : '1px solid rgba(46, 160, 67, 0.25)' }}>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              Статус хранения
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              {isOffline ? (
                <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--github-blue-text)' }}>
                  💾 Только локально (Оффлайн)
                </span>
              ) : (
                <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--github-green-text)' }}>
                  🟢 В облаке (Синхронизировано)
                </span>
              )}
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.45 }}>
              {isOffline
                ? 'Доска и её задачи хранятся только в памяти вашего браузера (localStorage) и недоступны на сервере.'
                : 'Все изменения на доске мгновенно сохраняются на сервере и доступны с любых устройств.'}
            </p>
          </div>

          {/* Action Button */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.4rem' }}>
            {isOffline ? (
              <button
                className="btn btn-primary"
                style={{ background: 'var(--github-green)', borderColor: 'var(--github-green-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem', fontWeight: 700, fontSize: '0.9rem' }}
                onClick={() => {
                  onClose();
                  onToggleBoardMode(board);
                }}
              >
                <span className="material-symbols-outlined">cloud_upload</span>
                Опубликовать в облако
              </button>
            ) : (
              <button
                className="btn btn-secondary"
                style={{ background: 'rgba(248, 81, 73, 0.12)', color: '#f85149', borderColor: 'rgba(248, 81, 73, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem', fontWeight: 700, fontSize: '0.9rem' }}
                onClick={() => {
                  onClose();
                  onToggleBoardMode(board);
                }}
              >
                <span className="material-symbols-outlined">cloud_off</span>
                Убрать с сервера
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
