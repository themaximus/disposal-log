import React from 'react';

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Подтвердить',
  cancelText = 'Отмена',
  confirmStyle = 'danger', // 'danger' | 'primary'
  onConfirm,
  onCancel
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay active" onClick={onCancel}>
      <div className="modal" style={{ maxWidth: '400px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
        <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: confirmStyle === 'danger' ? 'rgba(248, 81, 73, 0.12)' : 'rgba(56, 139, 253, 0.12)',
            border: confirmStyle === 'danger' ? '1px solid rgba(248, 81, 73, 0.3)' : '1px solid rgba(56, 139, 253, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.6rem', color: confirmStyle === 'danger' ? '#f85149' : 'var(--github-blue-text)' }}>
              {confirmStyle === 'danger' ? 'warning' : 'help_outline'}
            </span>
          </div>
        </div>

        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: 'var(--text-main)' }}>
          {title || 'Подтвердите действие'}
        </h3>

        <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', margin: '0 0 1.5rem 0', lineHeight: 1.45 }}>
          {message}
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button
            className="btn btn-secondary"
            style={{ flex: 1, padding: '0.65rem', fontWeight: 600 }}
            onClick={onCancel}
          >
            {cancelText}
          </button>

          <button
            className="btn btn-primary"
            style={{
              flex: 1,
              padding: '0.65rem',
              fontWeight: 700,
              background: confirmStyle === 'danger' ? 'var(--github-red, #da3633)' : 'var(--github-green)',
              borderColor: confirmStyle === 'danger' ? '#f85149' : 'var(--github-green-hover)'
            }}
            onClick={() => {
              onConfirm();
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
