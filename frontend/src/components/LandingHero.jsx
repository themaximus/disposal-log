import React from 'react';

export default function LandingHero({ currentUser, onOpenAuth, onOpenWorkspace, onCreateBoard }) {
  return (
    <section className="hero-section-wrapper">
      <div className="hero-container-inner">
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

        {/* Primary Welcome Box */}
        <div className="hero-welcome-card">
          {!currentUser ? (
            <div className="welcome-card-content">
              <div className="welcome-card-header">
                <span className="material-symbols-outlined welcome-icon">login</span>
                <div>
                  <h3 className="welcome-title">Начните работу прямо сейчас</h3>
                  <p className="welcome-desc">Войдите в учётную запись для работы в онлайн-режиме или используйте локальные офлайн-доски.</p>
                </div>
              </div>
              <div className="hero-actions">
                <button className="btn-hero-primary" onClick={onOpenAuth}>
                  <span className="material-symbols-outlined" style={{ fontSize: '1.2rem', marginRight: '6px' }}>key</span>
                  Войти в Учётную Запись
                </button>
                <button className="btn-hero-secondary" onClick={onOpenAuth}>
                  <span className="material-symbols-outlined" style={{ fontSize: '1.2rem', marginRight: '6px', color: 'var(--github-yellow)' }}>bolt</span>
                  Продолжить без аккаунта
                </button>
              </div>
            </div>
          ) : (
            <div className="welcome-card-content">
              <div className="welcome-card-header">
                <span className="material-symbols-outlined welcome-icon" style={{ color: 'var(--github-green-text)' }}>waving_hand</span>
                <div>
                  <h3 className="welcome-title">С возвращением, {currentUser.name || currentUser.username || 'Разработчик'}! 👋</h3>
                  <p className="welcome-desc">Ваши рабочие пространства и задачи синхронизированы и готовы к работе.</p>
                </div>
              </div>
              <div className="hero-actions">
                <button className="btn-hero-primary" onClick={onOpenWorkspace}>
                  <span className="material-symbols-outlined" style={{ fontSize: '1.2rem', marginRight: '6px' }}>rocket_launch</span>
                  Перейти к Задачам
                </button>
                {typeof onCreateBoard === 'function' && (
                  <button className="btn-hero-secondary" onClick={onCreateBoard}>
                    <span className="material-symbols-outlined" style={{ fontSize: '1.2rem', marginRight: '6px' }}>add</span>
                    Создать Доску
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Feature Cards Grid */}
        <div className="hero-features-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: 'var(--github-blue-text)' }}>space_dashboard</span>
            </div>
            <div className="feature-title">Мульти-Доски</div>
            <div className="feature-desc">Создавайте отдельные пространства для разных фич и подсистем игры.</div>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: 'var(--github-green-text)' }}>cloud_sync</span>
            </div>
            <div className="feature-title">Онлайн & Офлайн</div>
            <div className="feature-desc">Переключайте доски между сервером и локальным хранилищем браузера в один клик.</div>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: 'var(--github-yellow)' }}>grade</span>
            </div>
            <div className="feature-title">Сложность Механик</div>
            <div className="feature-desc">Оценивайте трудоёмкость фич от 1 до 3 звёзд с индивидуальными акцентами.</div>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: 'var(--github-blue-text)' }}>layers</span>
            </div>
            <div className="feature-title">Умные Стопки</div>
            <div className="feature-desc">Удерживайте карточку 2 секунды при перетаскивании для удобного объединения в стопку.</div>
          </div>
        </div>
      </div>
    </section>
  );
}
