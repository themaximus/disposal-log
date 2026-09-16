// QuickConnectMenu.jsx - Всплывающее контекстное меню создания и соединения блока при отпускании связи в свободном месте
import React, { useEffect, useRef } from 'react';

export default function QuickConnectMenu({ menuData, onSelect, onClose }) {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handlePointerDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [onClose]);

  if (!menuData) return null;

  // Рассчитываем координаты, чтобы меню не вылезало за края экрана
  const menuWidth = 220;
  const menuHeight = 180;
  const clampedX = Math.min(Math.max(12, menuData.screenX), window.innerWidth - menuWidth - 16);
  const clampedY = Math.min(Math.max(12, menuData.screenY), window.innerHeight - menuHeight - 16);

  return (
    <div
      ref={menuRef}
      className="quick-connect-menu nodrag nopan"
      style={{
        position: 'fixed',
        left: `${clampedX}px`,
        top: `${clampedY}px`,
        zIndex: 99999
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="quick-connect-header">
        <div className="quick-connect-title">
          <span className="material-symbols-outlined quick-connect-icon">bolt</span>
          <span>Создать и связать</span>
        </div>
        <button
          type="button"
          className="quick-connect-close-btn"
          onClick={onClose}
          title="Закрыть (Esc)"
        >
          ✕
        </button>
      </div>

      <div className="quick-connect-options">
        <button
          type="button"
          className="quick-connect-item opt-prefab"
          onClick={() => onSelect('hierarchyNode')}
          title="Создать блок префаба / иерархии объектов"
        >
          <span className="quick-connect-item-icon">📁</span>
          <div className="quick-connect-item-content">
            <span className="quick-connect-item-name">Префаб</span>
            <span className="quick-connect-item-desc">Иерархия объектов</span>
          </div>
        </button>

        <button
          type="button"
          className="quick-connect-item opt-logic"
          onClick={() => onSelect('logicNode')}
          title="Создать блок шага логики / метода"
        >
          <span className="quick-connect-item-icon">⚙️</span>
          <div className="quick-connect-item-content">
            <span className="quick-connect-item-name">Логика</span>
            <span className="quick-connect-item-desc">Методы и условия</span>
          </div>
        </button>

        <button
          type="button"
          className="quick-connect-item opt-text"
          onClick={() => onSelect('textNode')}
          title="Создать текстовую надпись / заметку"
        >
          <span className="quick-connect-item-icon">📝</span>
          <div className="quick-connect-item-content">
            <span className="quick-connect-item-name">Текст</span>
            <span className="quick-connect-item-desc">Заметка / примечание</span>
          </div>
        </button>
      </div>
    </div>
  );
}
