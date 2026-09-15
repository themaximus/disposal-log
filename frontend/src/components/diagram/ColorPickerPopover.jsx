import React, { useState, useEffect, useRef } from 'react';
import { ROOT_COLOR_PALETTE } from '../../utils/diagramStorage';

export default function ColorPickerPopover({
  currentColor = '#e3b341',
  defaultColor = '#e3b341',
  onSelect,
  onClose,
  title = 'Цвет строки'
}) {
  const [customHex, setCustomHex] = useState(currentColor || defaultColor);
  const popoverRef = useRef(null);

  useEffect(() => {
    setCustomHex(currentColor || defaultColor);
  }, [currentColor, defaultColor]);

  // Click outside listener
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        onClose();
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handleApplyColor = (color) => {
    if (onSelect) {
      onSelect(color);
    }
    onClose();
  };

  const handleCustomChange = (e) => {
    const val = e.target.value;
    setCustomHex(val);
    if (/^#[0-9A-Fa-f]{6}$/.test(val) || /^#[0-9A-Fa-f]{3}$/.test(val)) {
      if (onSelect) onSelect(val);
    }
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    let val = customHex.trim();
    if (!val.startsWith('#')) val = '#' + val;
    handleApplyColor(val);
  };

  return (
    <div
      ref={popoverRef}
      className="root-color-palette-popover nodrag nowheel"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="color-popover-header">
        <span className="color-popover-title">🎨 {title}</span>
        {defaultColor && currentColor !== defaultColor && (
          <button
            type="button"
            className="color-popover-reset-btn"
            onClick={() => handleApplyColor(defaultColor)}
            title="Сбросить к исходному цвету"
          >
            Сброс
          </button>
        )}
      </div>

      {/* Preset Chips Grid */}
      <div className="color-palette-grid">
        {ROOT_COLOR_PALETTE.map((item, idx) => {
          const isSelected = (currentColor || '').toLowerCase() === item.color.toLowerCase();
          return (
            <button
              key={idx}
              type="button"
              className={`color-palette-chip ${isSelected ? 'active' : ''}`}
              style={{ backgroundColor: item.color }}
              onClick={() => handleApplyColor(item.color)}
              title={`${item.label} (${item.color})`}
            >
              {isSelected && <span className="color-chip-check">✓</span>}
            </button>
          );
        })}
      </div>

      {/* Custom Color Input */}
      <form className="color-custom-row" onSubmit={handleCustomSubmit}>
        <input
          type="color"
          className="color-native-input"
          value={customHex.startsWith('#') && customHex.length === 7 ? customHex : '#58a6ff'}
          onChange={(e) => {
            setCustomHex(e.target.value);
            if (onSelect) onSelect(e.target.value);
          }}
          title="Выбрать любой оттенок из спектра"
        />
        <input
          type="text"
          className="color-hex-input"
          value={customHex}
          onChange={handleCustomChange}
          placeholder="#e3b341"
          maxLength={9}
        />
        <button
          type="submit"
          className="btn-apply-color"
          title="Применить цвет"
        >
          ОК
        </button>
      </form>
    </div>
  );
}
