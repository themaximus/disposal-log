// SmartAlignmentGuides.jsx - Отрисовка умных направляющих линий (Smart Alignment Guides)
import React from 'react';

export default function SmartAlignmentGuides({ guides = [] }) {
  if (!guides || guides.length === 0) return null;

  return (
    <svg
      className="smart-alignment-guides-overlay"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        overflow: 'visible',
        pointerEvents: 'none',
        zIndex: 9999
      }}
    >
      <defs>
        <filter id="guide-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#ff4455" floodOpacity="0.8" />
        </filter>
        <filter id="guide-glow-cyan" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#39c5cf" floodOpacity="0.8" />
        </filter>
      </defs>

      {guides.map((g, idx) => {
        const isX = g.type === 'x'; // Вертикальная линия по оси X
        const isCenter = g.label === 'Центр';
        const color = isCenter ? '#39c5cf' : '#ff4455';
        const filterId = isCenter ? 'url(#guide-glow-cyan)' : 'url(#guide-glow)';

        if (isX) {
          return (
            <g key={`guide_x_${idx}`} className="smart-guide-group">
              {/* Пунктирная направляющая линия */}
              <line
                x1={g.pos}
                y1={g.start}
                x2={g.pos}
                y2={g.end}
                stroke={color}
                strokeWidth={1.5}
                strokeDasharray="4 3"
                filter={filterId}
              />
              {/* Концевые засечки */}
              <line x1={g.pos - 4} y1={g.start} x2={g.pos + 4} y2={g.start} stroke={color} strokeWidth={2} />
              <line x1={g.pos - 4} y1={g.end} x2={g.pos + 4} y2={g.end} stroke={color} strokeWidth={2} />

              {/* Бейдж подсказки типа выравнивания */}
              <g transform={`translate(${g.pos + 6}, ${(g.start + g.end) / 2 - 9})`}>
                <rect
                  x="0"
                  y="0"
                  width={g.label.length * 6.5 + 14}
                  height="18"
                  rx="4"
                  fill="#0d1117"
                  stroke={color}
                  strokeWidth="1"
                  opacity="0.95"
                />
                <text
                  x="6"
                  y="12"
                  fill={color}
                  fontSize="9.5"
                  fontFamily="'JetBrains Mono', Consolas, monospace"
                  fontWeight="700"
                >
                  {g.label}
                </text>
              </g>
            </g>
          );
        }

        // Горизонтальная направляющая линия по оси Y
        return (
          <g key={`guide_y_${idx}`} className="smart-guide-group">
            {/* Пунктирная направляющая линия */}
            <line
              x1={g.start}
              y1={g.pos}
              x2={g.end}
              y2={g.pos}
              stroke={color}
              strokeWidth={1.5}
              strokeDasharray="4 3"
              filter={filterId}
            />
            {/* Концевые засечки */}
            <line x1={g.start} y1={g.pos - 4} x2={g.start} y2={g.pos + 4} stroke={color} strokeWidth={2} />
            <line x1={g.end} y1={g.pos - 4} x2={g.end} y2={g.pos + 4} stroke={color} strokeWidth={2} />

            {/* Бейдж подсказки типа выравнивания */}
            <g transform={`translate(${(g.start + g.end) / 2 - (g.label.length * 6.5 + 14) / 2}, ${g.pos + 6})`}>
              <rect
                x="0"
                y="0"
                width={g.label.length * 6.5 + 14}
                height="18"
                rx="4"
                fill="#0d1117"
                stroke={color}
                strokeWidth="1"
                opacity="0.95"
              />
              <text
                x="7"
                y="12"
                fill={color}
                fontSize="9.5"
                fontFamily="'JetBrains Mono', Consolas, monospace"
                fontWeight="700"
              >
                {g.label}
              </text>
            </g>
          </g>
        );
      })}
    </svg>
  );
}
