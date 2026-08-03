import React, { useState, useEffect } from 'react';

export default function SettingsModal({ onClose }) {
  const [activeTab, setActiveTab] = useState('tab-tg');
  const [botToken, setBotToken] = useState('');
  const [channelId, setChannelId] = useState('');
  const [template, setTemplate] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [saveStatus, setSaveStatus] = useState('');

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        setBotToken(data.botToken || '');
        setChannelId(data.channelId || '');
        setTemplate(data.telegramTemplate || '');
      })
      .catch(console.error);
  }, []);

  const handleSaveSettings = (e) => {
    e.preventDefault();
    setSaveStatus('Сохранение...');

    fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        botToken,
        channelId,
        telegramTemplate: template,
        adminPassword
      })
    })
      .then(res => res.json())
      .then(res => {
        if (res.success) {
          setSaveStatus('✅ Настройки сохранены!');
          setTimeout(() => setSaveStatus(''), 2000);
        }
      })
      .catch(() => setSaveStatus('❌ Ошибка сохранения'));
  };

  return (
    <div className="modal-overlay active">
      <div className="modal settings-modal" style={{ maxWidth: '580px' }}>
        <div className="modal-header" style={{ borderBottom: '1px solid var(--github-border)', paddingBottom: '0.85rem', justifyContent: 'space-between' }}>
          <h2>⚙️ Панель Настроек</h2>
          <button className="btn-close" onClick={onClose} title="Закрыть">
            <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>close</span>
          </button>
        </div>

        <div className="settings-tabs-nav" style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--github-border)', padding: '0.75rem 0', marginBottom: '1rem' }}>
          <button
            type="button"
            className={`settings-tab-btn ${activeTab === 'tab-tg' ? 'active' : ''}`}
            onClick={() => setActiveTab('tab-tg')}
          >
            🤖 Telegram Бот
          </button>
          <button
            type="button"
            className={`settings-tab-btn ${activeTab === 'tab-sec' ? 'active' : ''}`}
            onClick={() => setActiveTab('tab-sec')}
          >
            🛡️ Безопасность
          </button>
          <button
            type="button"
            className={`settings-tab-btn ${activeTab === 'tab-backup' ? 'active' : ''}`}
            onClick={() => setActiveTab('tab-backup')}
          >
            💾 Бэкапы
          </button>
        </div>

        <form onSubmit={handleSaveSettings}>
          {activeTab === 'tab-tg' && (
            <div className="settings-tab-content active">
              <div className="form-group">
                <label>Токен бота (BOT_TOKEN)</label>
                <input
                  type="text"
                  value={botToken}
                  onChange={e => setBotToken(e.target.value)}
                  placeholder="123456789:ABCdefGHIjklmno..."
                />
              </div>
              <div className="form-group">
                <label>ID Канала (CHANNEL_ID)</label>
                <input
                  type="text"
                  value={channelId}
                  onChange={e => setChannelId(e.target.value)}
                  placeholder="-1001234567890"
                />
              </div>
              <div className="form-group">
                <label>Шаблон отчета (HTML)</label>
                <textarea
                  rows={4}
                  value={template}
                  onChange={e => setTemplate(e.target.value)}
                  placeholder="Шаблон отчета..."
                  style={{ width: '100%', padding: '0.6rem', background: 'var(--github-canvas)', border: '1px solid var(--github-border)', borderRadius: '6px', color: '#fff', fontFamily: 'monospace', fontSize: '0.82rem' }}
                />
              </div>
            </div>
          )}

          {activeTab === 'tab-sec' && (
            <div className="settings-tab-content active">
              <div className="form-group">
                <label>Новый пароль администратора</label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={e => setAdminPassword(e.target.value)}
                  placeholder="Оставьте пустым, если не меняется"
                />
              </div>
            </div>
          )}

          {activeTab === 'tab-backup' && (
            <div className="settings-tab-content active">
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Экспорт текущей базы данных SQLite для создания бэкапа.
              </p>
              <a href="/api/backup/download" className="btn btn-secondary" style={{ display: 'inline-flex', textDecoration: 'none' }}>
                📥 Скачать бэкап (database.sqlite)
              </a>
            </div>
          )}

          {saveStatus && (
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--github-green-text)', margin: '0.5rem 0' }}>
              {saveStatus}
            </div>
          )}

          <div className="modal-actions" style={{ marginTop: '1.25rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Отмена</button>
            <button type="submit" className="btn btn-primary">Сохранить настройки</button>
          </div>
        </form>
      </div>
    </div>
  );
}
