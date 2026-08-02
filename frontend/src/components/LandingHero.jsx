import React from 'react';

export default function LandingHero({ onOpenAuth, onOpenWorkspace }) {
  return (
    <section className="hero-section">
      <div className="hero-container">
        <div className="hero-badge">
          <span className="hero-pulse-dot"></span>
          <span>DEV STUDIO KANBAN ENGINE 2.0</span>
        </div>

        <h1 className="hero-headline">
          Центр Управления Механиками и Лором <span className="hero-gradient-text">Вашей Игры</span>
        </h1>

        <p className="hero-subheadline">
          Организуйте бэклог геймдева, отслеживайте сложность задач, распределяйте процессы по колонкам и делитесь досками в один клик.
        </p>

        <div className="hero-actions">
          <button className="btn-hero-primary" onClick={onOpenWorkspace}>
            🚀 Открыть Доску Задач
          </button>
          <button className="btn-hero-secondary" onClick={onOpenAuth}>
            🔑 Войти в Учётную Запись
          </button>
        </div>

        <div className="hero-features-grid">
          <div className="feature-card">
            <div className="feature-icon">📋</div>
            <div className="feature-title">Мульти-Доски</div>
            <div className="feature-desc">Создавайте отдельные пространства для разных фич и подсистем игры.</div>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔑</div>
            <div className="feature-title">Гибкие Права</div>
            <div className="feature-desc">Настраивайте доступ по приватной ссылке, e-mail или создавайте публичные доски.</div>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⭐</div>
            <div className="feature-title">Сложность Механик</div>
            <div className="feature-desc">Оценивайте трудоёмкость фич от 1 до 3 звёзд с цветом акцента.</div>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📲</div>
            <div className="feature-title">Telegram Уведомления</div>
            <div className="feature-desc">Автоматическая синхронизация апдейтов в игровой Telegram-канал.</div>
          </div>
        </div>
      </div>
    </section>
  );
}
