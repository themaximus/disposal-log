import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';

export const EMOJI_CATEGORIES = [
  {
    id: 'gamedev',
    name: '🎮 Геймдев',
    emojis: [
      '🎮', '🕹️', '⚔️', '🛡️', '🏹', '🗡️', '💣', '🔫', '🪓', '🎒', '📦', '💎',
      '👑', '🪙', '🧪', '🗝️', '📜', '🗺️', '🥩', '🍖', '🍎', '🩹', '💊', '❤️',
      '💀', '☠️', '🧟', '👾', '👻', '🤖', '🐉', '🦇', '🕷️', '🐺', '🐗', '👁️',
      '🧠', '🩸', '🦴', '⚡', '❄️', '🔥', '💨', '💥', '💫', '🌟', '✨', '🔮',
      '🎯', '🎲', '🏆', '🥇', '🥈', '🥉', '🎖️', '🏅', '🎪', '🎭'
    ]
  },
  {
    id: 'systems',
    name: '⚙️ Системы',
    emojis: [
      '⚙️', '🔧', '🔨', '🛠️', '🔩', '🧰', '🔬', '📡', '💻', '🖥️', '💾', '💿',
      '🔌', '🔋', '🎛️', '🎚️', '🧭', '⏱️', '⏲️', '⏰', '⏳', '🔒', '🔓', '🔑',
      '🚨', '💡', '🧲', '📊', '📈', '📉', '📁', '📂', '📄', '📑', '🗂️', '📋',
      '📌', '🏷️', '🔍', '🔎', '🌐', '🛰️', '🧱', '🏗️', '📐', '📏', '🪚'
    ]
  },
  {
    id: 'ui',
    name: '📱 UI & Звук',
    emojis: [
      '📱', '📺', '📷', '📸', '📹', '🎥', '📽️', '🎬', '🎙️', '📻', '🔊', '🔉',
      '🔈', '🔇', '🔔', '🔕', '🎵', '🎶', '🎸', '🎹', '🥁', '🎧', '🎨', '🖌️',
      '🖍️', '✏️', '✒️', '🖋️', '📝', '✂️', '🖼️', '🎞️', '💬', '🗨️', '🗯️', '💭'
    ]
  },
  {
    id: 'status',
    name: '🟢 Статусы',
    emojis: [
      '🟢', '🔴', '🟡', '🔵', '🟣', '🟠', '⚪', '⚫', '🟩', '🟥', '🟨', '🟦',
      '🟪', '🟧', '⬜', '⬛', '🔶', '🔷', '🔸', '🔹', '🔺', '🔻', '💠', '🔘',
      '✔️', '✅', '❌', '❎', '❓', '❗', '⚠️', '⛔', '🚫', '🛑', '💯', '💢',
      '🔄', '🔃', '🔀', '🔁', '➡️', '⬅️', '⬆️', '⬇️', '↗️', '↘️', '↙️', '↖️',
      '▶️', '⏸️', '⏹️', '⏺️', '⏭️', '⏮️', '➕', '➖', '➗', '✖️', '✨', '⚡'
    ]
  },
  {
    id: 'characters',
    name: '👤 Персонажи',
    emojis: [
      '👤', '👥', '🧙', '🧝', '🧛', '🧟', '🧞', '🧜', '🧚', '👼', '🦸', '🦹',
      '🥷', '👨‍🚀', '👨‍✈️', '👮', '🕵️', '💂', '👷', '🤴', '👸', '🤠', '🥳', '😎',
      '🧐', '🤓', '🤖', '👽', '🤡', '👹', '👺', '💀', '🎃', '🐾', '👣'
    ]
  }
];

export const POPULAR_GAME_EMOJIS = [
  '⚙️', '🎮', '⚔️', '🛡️', '❤️', '🎒', '📦', '🎯', '📱', '⚡', '💀', '🔊', '💎', '👑', '🔥', '🔮'
];

const KEYWORDS_MAP = {
  'меч': ['⚔️', '🗡️'],
  'sword': ['⚔️', '🗡️'],
  'щит': ['🛡️'],
  'shield': ['🛡️'],
  'лук': ['🏹'],
  'bow': ['🏹'],
  'пуля': ['🔫', '💣'],
  'gun': ['🔫'],
  'бомба': ['💣', '💥'],
  'bomb': ['💣'],
  'топор': ['🪓'],
  'axe': ['🪓'],
  'хп': ['❤️', '🩹', '💊'],
  'жизнь': ['❤️', '🩹'],
  'здоровье': ['❤️', '🩹', '💊'],
  'health': ['❤️', '🩹', '💊'],
  'hp': ['❤️', '🩹', '💊'],
  'сердце': ['❤️'],
  'heart': ['❤️'],
  'инвентарь': ['🎒', '📦'],
  'рюкзак': ['🎒'],
  'сундук': ['📦'],
  'ящик': ['📦'],
  'лут': ['🎒', '📦', '💎', '🪙', '👑'],
  'loot': ['🎒', '📦', '💎', '🪙', '👑'],
  'алмаз': ['💎'],
  'кристалл': ['💎'],
  'diamond': ['💎'],
  'золото': ['🪙', '👑', '🏆'],
  'монета': ['🪙'],
  'gold': ['🪙', '👑'],
  'зелье': ['🧪'],
  'колба': ['🧪'],
  'potion': ['🧪'],
  'ключ': ['🗝️', '🔑'],
  'key': ['🗝️', '🔑'],
  'карта': ['🗺️', '📜'],
  'map': ['🗺️'],
  'свиток': ['📜'],
  'scroll': ['📜'],
  'еда': ['🥩', '🍖', '🍎'],
  'мясо': ['🥩', '🍖'],
  'food': ['🥩', '🍖', '🍎'],
  'череп': ['💀', '☠️'],
  'смерть': ['💀', '☠️'],
  'skull': ['💀', '☠️'],
  'враг': ['👾', '🧟', '👹', '👺', '💀'],
  'зомби': ['🧟'],
  'zombie': ['🧟'],
  'монстр': ['👾', '🧟', '👹', '🐉'],
  'monster': ['👾', '🧟', '👹'],
  'призрак': ['👻'],
  'ghost': ['👻'],
  'робот': ['🤖'],
  'robot': ['🤖'],
  'дракон': ['🐉'],
  'dragon': ['🐉'],
  'паук': ['🕷️'],
  'spider': ['🕷️'],
  'глаз': ['👁️'],
  'eye': ['👁️'],
  'мозг': ['🧠'],
  'brain': ['🧠'],
  'кровь': ['🩸'],
  'blood': ['🩸'],
  'кость': ['🦴'],
  'bone': ['🦴'],
  'молния': ['⚡'],
  'ток': ['⚡'],
  'lightning': ['⚡'],
  'огонь': ['🔥'],
  'пламя': ['🔥'],
  'fire': ['🔥'],
  'лед': ['❄️'],
  'мороз': ['❄️'],
  'ice': ['❄️'],
  'ветер': ['💨'],
  'взрыв': ['💥'],
  'explosion': ['💥'],
  'звезда': ['🌟', '⭐', '✨'],
  'star': ['🌟', '⭐'],
  'магия': ['🔮', '✨', '🧙'],
  'magic': ['🔮', '✨'],
  'прицел': ['🎯'],
  'мишень': ['🎯'],
  'target': ['🎯'],
  'кубик': ['🎲'],
  'dice': ['🎲'],
  'кубок': ['🏆', '🥇'],
  'трофей': ['🏆'],
  'шестеренка': ['⚙️'],
  'настройки': ['⚙️', '🔧'],
  'settings': ['⚙️'],
  'gear': ['⚙️'],
  'инструмент': ['🛠️', '🧰'],
  'компьютер': ['💻', '🖥️'],
  'код': ['💻', '⚙️', '⚡'],
  'code': ['💻', '⚙️'],
  'скрипт': ['📄', '💻'],
  'script': ['📄', '💻'],
  'диск': ['💾', '💿'],
  'сеть': ['📡', '🌐', '🛰️'],
  'network': ['📡', '🌐'],
  'интернет': ['🌐'],
  'батарея': ['🔋'],
  'battery': ['🔋'],
  'таймер': ['⏱️', '⏲️', '⏰', '⏳'],
  'время': ['⏱️', '⏳'],
  'time': ['⏱️', '⏳'],
  'замок': ['🔒', '🔓'],
  'lock': ['🔒'],
  'свет': ['💡'],
  'лампа': ['💡'],
  'идея': ['💡'],
  'папка': ['📁', '📂'],
  'folder': ['📁', '📂'],
  'файл': ['📄', '📑'],
  'file': ['📄'],
  'поиск': ['🔍', '🔎'],
  'search': ['🔍'],
  'камера': ['📷', '📸', '📹', '🎥'],
  'camera': ['📷', '🎥'],
  'звук': ['🔊', '🔉', '🔈', '🔇', '🎵', '🎶', '🎧'],
  'audio': ['🔊', '🎵', '🎧'],
  'sound': ['🔊', '🎵'],
  'музыка': ['🎵', '🎶'],
  'колокольчик': ['🔔'],
  'bell': ['🔔'],
  'уведомление': ['🔔', '🚨'],
  'интерфейс': ['📱', '🖥️', '🎨'],
  'ui': ['📱', '🖥️', '🎨'],
  'холст': ['🎨', '🖼️'],
  'canvas': ['🎨', '🖼️'],
  'кисть': ['🖌️', '🎨'],
  'текст': ['📝', '✏️'],
  'чат': ['💬', '🗨️'],
  'chat': ['💬'],
  'персонаж': ['👤', '🧙', '🥷', '🤠'],
  'игрок': ['👤', '🎮', '🤠'],
  'player': ['👤', '🎮'],
  'человек': ['👤', '👥'],
  'зеленый': ['🟢', '🟩', '✅'],
  'красный': ['🔴', '🟥', '❌'],
  'желтый': ['🟡', '🟨'],
  'синий': ['🔵', '🟦'],
  'стрелка': ['➡️', '⬅️', '⬆️', '⬇️', '🔄'],
  'arrow': ['➡️', '⬅️', '⬆️', '⬇️']
};

export default function EmojiPickerPopover({
  currentEmoji,
  onSelect,
  onClose,
  title = 'Выбор эмодзи'
}) {
  const [activeCategory, setActiveCategory] = useState('gamedev');
  const [search, setSearch] = useState('');
  const [customInput, setCustomInput] = useState('');
  const popoverRef = useRef(null);
  const searchInputRef = useRef(null);
  const anchorRef = useRef(null);
  const [coords, setCoords] = useState(null);

  useEffect(() => {
    const updatePosition = () => {
      if (!anchorRef.current) return;
      const parentEl = anchorRef.current.parentElement || anchorRef.current;
      const rect = parentEl.getBoundingClientRect();
      const popoverWidth = 320;
      const popoverHeight = 440;

      let left = rect.left;
      let top = rect.bottom + 6;

      if (left + popoverWidth > window.innerWidth - 16) {
        left = Math.max(16, window.innerWidth - popoverWidth - 16);
      }
      if (left < 16) left = 16;

      if (top + popoverHeight > window.innerHeight - 16) {
        if (rect.top - popoverHeight - 6 > 16) {
          top = rect.top - popoverHeight - 6;
        } else {
          top = Math.max(16, window.innerHeight - popoverHeight - 16);
        }
      }

      setCoords({ left: Math.round(left), top: Math.round(top) });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, []);

  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [coords]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Close on Esc
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Compute displayed emojis based on search or active category
  const displayedEmojis = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      if (activeCategory === 'all') {
        const set = new Set();
        EMOJI_CATEGORIES.forEach(c => c.emojis.forEach(em => set.add(em)));
        return Array.from(set);
      }
      const cat = EMOJI_CATEGORIES.find(c => c.id === activeCategory);
      return cat ? cat.emojis : EMOJI_CATEGORIES[0].emojis;
    }

    const matched = new Set();

    // Check keyword map
    Object.keys(KEYWORDS_MAP).forEach(kw => {
      if (kw.includes(query) || query.includes(kw)) {
        KEYWORDS_MAP[kw].forEach(em => matched.add(em));
      }
    });

    // Check category names
    EMOJI_CATEGORIES.forEach(cat => {
      if (cat.name.toLowerCase().includes(query)) {
        cat.emojis.forEach(em => matched.add(em));
      }
    });

    // Direct match (if user typed emoji itself)
    EMOJI_CATEGORIES.forEach(cat => {
      cat.emojis.forEach(em => {
        if (em.includes(query)) matched.add(em);
      });
    });

    if (matched.size === 0) {
      return POPULAR_GAME_EMOJIS;
    }

    return Array.from(matched);
  }, [search, activeCategory]);

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (customInput.trim()) {
      onSelect(customInput.trim());
      onClose();
    }
  };

  return (
    <>
      <span ref={anchorRef} style={{ display: 'none' }} />
      {coords && createPortal(
        <div
          ref={popoverRef}
          className="emoji-picker-popover nodrag nopan"
          style={{
            position: 'fixed',
            left: `${coords.left}px`,
            top: `${coords.top}px`,
            zIndex: 15000
          }}
          onClick={(e) => e.stopPropagation()}
        >
      {/* Header */}
      <div className="emoji-picker-header">
        <div className="emoji-picker-title">
          <span className="material-symbols-outlined" style={{ fontSize: '1.05rem', color: 'var(--github-blue-text)' }}>
            add_reaction
          </span>
          <span>{title}</span>
        </div>
        <button
          type="button"
          className="emoji-picker-close-btn"
          onClick={onClose}
          title="Закрыть (Esc)"
        >
          ✕
        </button>
      </div>

      {/* Search Input */}
      <div className="emoji-picker-search-bar">
        <span className="search-icon">🔍</span>
        <input
          ref={searchInputRef}
          type="text"
          className="emoji-search-input"
          placeholder="Поиск: меч, щит, код, хп, лут..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button
            type="button"
            className="emoji-search-clear"
            onClick={() => setSearch('')}
          >
            ✕
          </button>
        )}
      </div>

      {/* Popular Quick Bar */}
      {!search && (
        <div className="emoji-quick-strip">
          <span className="quick-label">Быстрые:</span>
          <div className="quick-emojis-row">
            {POPULAR_GAME_EMOJIS.map((em, idx) => (
              <button
                key={idx}
                type="button"
                className={`quick-emoji-btn ${currentEmoji === em ? 'active' : ''}`}
                onClick={() => { onSelect(em); onClose(); }}
                title={`Выбрать ${em}`}
              >
                {em}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Category Tabs */}
      {!search && (
        <div className="emoji-category-tabs">
          <button
            type="button"
            className={`cat-tab-btn ${activeCategory === 'all' ? 'active' : ''}`}
            onClick={() => setActiveCategory('all')}
          >
            ⭐ Все
          </button>
          {EMOJI_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              type="button"
              className={`cat-tab-btn ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Emojis Grid */}
      <div className="emoji-grid-container">
        {displayedEmojis.map((em, idx) => {
          const isSelected = currentEmoji === em;
          return (
            <button
              key={idx}
              type="button"
              className={`emoji-tile-btn ${isSelected ? 'selected' : ''}`}
              onClick={() => {
                onSelect(em);
                onClose();
              }}
              title={`Выбрать ${em}`}
            >
              {em}
            </button>
          );
        })}
      </div>

      {/* Custom Emoji / Unicode character input */}
      <form className="emoji-custom-form" onSubmit={handleCustomSubmit}>
        <input
          type="text"
          className="emoji-custom-input"
          placeholder="Свой символ / иконка..."
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
        />
        <button
          type="submit"
          className="btn-apply-custom-emoji"
          disabled={!customInput.trim()}
        >
          Применить
        </button>
      </form>
        </div>,
        document.body
      )}
    </>
  );
}
