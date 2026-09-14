// diagramStorage.js - Управление диаграммами, схемами и шаблонами (jgraph / diagrams.net)

const OFFLINE_DIAGRAMS_KEY = 'pulse_offline_diagrams_list';

// Стартовые готовые шаблоны для профессиональных диаграмм
export const DIAGRAM_TEMPLATES = [
  {
    id: 'flowchart_algorithm',
    title: 'Блок-схема алгоритма',
    description: 'Стандартная блок-схема логики и ветвления (Start, Decision, Loop, End)',
    icon: 'account_tree',
    xml: `<mxfile host="app.diagrams.net" modified="2026-09-14T12:00:00.000Z" agent="PULSE Dev" version="24.0.0">
  <diagram name="Algorithm Flowchart" id="algo-1">
    <mxGraphModel dx="1200" dy="800" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1169" pageHeight="827" background="#0d1117" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
        <mxCell id="start" value="Старт алгоритма" style="ellipse;whiteSpace=wrap;html=1;fillColor=#238636;strokeColor=#3fb950;fontColor=#ffffff;fontSize=14;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="480" y="40" width="160" height="50" as="geometry" />
        </mxCell>
        <mxCell id="step1" value="Инициализация параметров&#xa;и загрузка конфига" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#161b22;strokeColor=#30363d;fontColor=#f0f6fc;fontSize=12;" vertex="1" parent="1">
          <mxGeometry x="460" y="140" width="200" height="60" as="geometry" />
        </mxCell>
        <mxCell id="edge1" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#58a6ff;strokeWidth=2;" edge="1" parent="1" source="start" target="step1">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="decision1" value="Данные валидны?&#xa;(Check inputs)" style="rhombus;whiteSpace=wrap;html=1;fillColor=#d29922;strokeColor=#f0883e;fontColor=#ffffff;fontSize=13;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="470" y="250" width="180" height="100" as="geometry" />
        </mxCell>
        <mxCell id="edge2" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#58a6ff;strokeWidth=2;" edge="1" parent="1" source="step1" target="decision1">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="action_yes" value="Выполнение основной&#xa;бизнес-логики (Execute)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#1f6feb;strokeColor=#58a6ff;fontColor=#ffffff;fontSize=12;" vertex="1" parent="1">
          <mxGeometry x="460" y="400" width="200" height="60" as="geometry" />
        </mxCell>
        <mxCell id="edge_yes" value="Да (true)" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#3fb950;strokeWidth=2;fontColor=#3fb950;" edge="1" parent="1" source="decision1" target="action_yes">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="action_no" value="Логирование ошибки&#xa;и повтор (Retry)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#da3633;strokeColor=#f85149;fontColor=#ffffff;fontSize=12;" vertex="1" parent="1">
          <mxGeometry x="720" y="270" width="180" height="60" as="geometry" />
        </mxCell>
        <mxCell id="edge_no" value="Нет (false)" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#f85149;strokeWidth=2;fontColor=#f85149;" edge="1" parent="1" source="decision1" target="action_no">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="edge_retry" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;entryX=1;entryY=0.5;entryDx=0;entryDy=0;strokeColor=#8b949e;strokeWidth=2;dashed=1;" edge="1" parent="1" source="action_no" target="step1">
          <mxGeometry relative="1" as="geometry">
            <Array as="points">
              <mxPoint x="810" y="170" />
            </Array>
          </mxGeometry>
        </mxCell>
        <mxCell id="end" value="Успешное завершение" style="ellipse;whiteSpace=wrap;html=1;fillColor=#238636;strokeColor=#3fb950;fontColor=#ffffff;fontSize=14;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="480" y="510" width="160" height="50" as="geometry" />
        </mxCell>
        <mxCell id="edge3" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#58a6ff;strokeWidth=2;" edge="1" parent="1" source="action_yes" target="end">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`
  },
  {
    id: 'system_architecture',
    title: 'Архитектура системы',
    description: 'Многоуровневая архитектура приложения (Web Client, Backend, DB, Services)',
    icon: 'layers',
    xml: `<mxfile host="app.diagrams.net" modified="2026-09-14T12:00:00.000Z" agent="PULSE Dev" version="24.0.0">
  <diagram name="System Architecture" id="arch-1">
    <mxGraphModel dx="1200" dy="800" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1169" pageHeight="827" background="#0d1117" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
        <mxCell id="tier_client" value="Frontend Client Tier (Vite + React 18)" style="swimlane;whiteSpace=wrap;html=1;fillColor=#161b22;strokeColor=#388bfd;fontColor=#58a6ff;fontSize=14;startSize=30;" vertex="1" parent="1">
          <mxGeometry x="80" y="60" width="320" height="340" as="geometry" />
        </mxCell>
        <mxCell id="c_spa" value="SPA Dashboard UI&#xa;(Kanban &amp; Diagrams)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#21262d;strokeColor=#30363d;fontColor=#f0f6fc;" vertex="1" parent="tier_client">
          <mxGeometry x="30" y="50" width="260" height="60" as="geometry" />
        </mxCell>
        <mxCell id="c_jgraph" value="jgraph / diagrams.net Editor&#xa;(Interactive Canvas via iframe)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#1f6feb;strokeColor=#58a6ff;fontColor=#ffffff;fontStyle=1;" vertex="1" parent="tier_client">
          <mxGeometry x="30" y="140" width="260" height="60" as="geometry" />
        </mxCell>
        <mxCell id="c_local" value="Offline Storage (localStorage)&#xa;&amp; Auto-Sync Engine" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#21262d;strokeColor=#30363d;fontColor=#8b949e;" vertex="1" parent="tier_client">
          <mxGeometry x="30" y="230" width="260" height="60" as="geometry" />
        </mxCell>
        <mxCell id="tier_server" value="Backend Server Tier (Node.js 20 &amp; Express 5)" style="swimlane;whiteSpace=wrap;html=1;fillColor=#161b22;strokeColor=#3fb950;fontColor=#3fb950;fontSize=14;startSize=30;" vertex="1" parent="1">
          <mxGeometry x="500" y="60" width="340" height="340" as="geometry" />
        </mxCell>
        <mxCell id="s_api" value="REST API &amp; Session Auth&#xa;(/api/boards, /api/tasks, /api/diagrams)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#21262d;strokeColor=#30363d;fontColor=#f0f6fc;" vertex="1" parent="tier_server">
          <mxGeometry x="40" y="50" width="260" height="60" as="geometry" />
        </mxCell>
        <mxCell id="s_oauth" value="OAuth 2.0 Auth Gate&#xa;(GitHub &amp; Google Sign-In)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#21262d;strokeColor=#30363d;fontColor=#f0f6fc;" vertex="1" parent="tier_server">
          <mxGeometry x="40" y="140" width="260" height="60" as="geometry" />
        </mxCell>
        <mxCell id="s_tg" value="Telegraf Telegram Bot Engine&#xa;(Automated Notification Webhooks)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#21262d;strokeColor=#30363d;fontColor=#f0f6fc;" vertex="1" parent="tier_server">
          <mxGeometry x="40" y="230" width="260" height="60" as="geometry" />
        </mxCell>
        <mxCell id="tier_db" value="Persistence Tier" style="swimlane;whiteSpace=wrap;html=1;fillColor=#161b22;strokeColor=#f0883e;fontColor=#f0883e;fontSize=14;startSize=30;" vertex="1" parent="1">
          <mxGeometry x="930" y="60" width="220" height="340" as="geometry" />
        </mxCell>
        <mxCell id="db_sqlite" value="SQLite Database&#xa;(Persistent Volume Mount)&#xa;- Users &amp; Sessions&#xa;- Boards &amp; Columns&#xa;- Tasks &amp; Stacks&#xa;- Diagrams (XML)" style="shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=15;fillColor=#21262d;strokeColor=#f0883e;fontColor=#f0f6fc;" vertex="1" parent="tier_db">
          <mxGeometry x="30" y="50" width="160" height="240" as="geometry" />
        </mxCell>
        <mxCell id="conn_client_server" value="HTTPS / JSON API" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#58a6ff;strokeWidth=2;fontColor=#58a6ff;" edge="1" parent="1" source="tier_client" target="tier_server">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="conn_server_db" value="SQLite WAL" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#f0883e;strokeWidth=2;fontColor=#f0883e;" edge="1" parent="1" source="tier_server" target="tier_db">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`
  },
  {
    id: 'game_loop_fsm',
    title: 'Игровой цикл & FSM состояний',
    description: 'Game Loop (Input, Update, Physics, Render) и машина состояний персонажа',
    icon: 'sports_esports',
    xml: `<mxfile host="app.diagrams.net" modified="2026-09-14T12:00:00.000Z" agent="PULSE Dev" version="24.0.0">
  <diagram name="Game Loop and FSM" id="game-1">
    <mxGraphModel dx="1200" dy="800" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1169" pageHeight="827" background="#0d1117" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
        <mxCell id="loop_box" value="Core Game Engine Loop (60 FPS / Fixed Tick)" style="swimlane;whiteSpace=wrap;html=1;fillColor=#161b22;strokeColor=#388bfd;fontColor=#58a6ff;fontSize=14;startSize=30;" vertex="1" parent="1">
          <mxGeometry x="60" y="50" width="360" height="420" as="geometry" />
        </mxCell>
        <mxCell id="gl_input" value="Process Input Events&#xa;(Keyboard, Gamepad, Mouse)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#21262d;strokeColor=#30363d;fontColor=#f0f6fc;" vertex="1" parent="loop_box">
          <mxGeometry x="40" y="50" width="280" height="50" as="geometry" />
        </mxCell>
        <mxCell id="gl_physics" value="Fixed Update: Physics &amp; Collision&#xa;(Rigidbody, Triggers, Raycasts)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#21262d;strokeColor=#30363d;fontColor=#f0f6fc;" vertex="1" parent="loop_box">
          <mxGeometry x="40" y="130" width="280" height="50" as="geometry" />
        </mxCell>
        <mxCell id="gl_ai" value="AI &amp; Gameplay Logic Tick&#xa;(State Machine, Pathfinding)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#1f6feb;strokeColor=#58a6ff;fontColor=#ffffff;fontStyle=1;" vertex="1" parent="loop_box">
          <mxGeometry x="40" y="210" width="280" height="50" as="geometry" />
        </mxCell>
        <mxCell id="gl_render" value="Render Frame &amp; UI Post-Processing&#xa;(Draw Call Batching, Shaders)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#21262d;strokeColor=#30363d;fontColor=#f0f6fc;" vertex="1" parent="loop_box">
          <mxGeometry x="40" y="290" width="280" height="50" as="geometry" />
        </mxCell>
        <mxCell id="gl_sync" value="Wait for V-Sync / Next Tick" style="ellipse;whiteSpace=wrap;html=1;fillColor=#238636;strokeColor=#3fb950;fontColor=#ffffff;" vertex="1" parent="loop_box">
          <mxGeometry x="90" y="360" width="180" height="40" as="geometry" />
        </mxCell>
        <mxCell id="fsm_box" value="Entity Finite State Machine (AI Character FSM)" style="swimlane;whiteSpace=wrap;html=1;fillColor=#161b22;strokeColor=#f0883e;fontColor=#f0883e;fontSize=14;startSize=30;" vertex="1" parent="1">
          <mxGeometry x="480" y="50" width="600" height="420" as="geometry" />
        </mxCell>
        <mxCell id="state_idle" value="IDLE&#xa;(Ожидание / Патруль)" style="ellipse;whiteSpace=wrap;html=1;fillColor=#21262d;strokeColor=#3fb950;strokeWidth=2;fontColor=#3fb950;fontStyle=1;" vertex="1" parent="fsm_box">
          <mxGeometry x="50" y="70" width="140" height="80" as="geometry" />
        </mxCell>
        <mxCell id="state_chase" value="CHASE&#xa;(Преследование цели)" style="ellipse;whiteSpace=wrap;html=1;fillColor=#21262d;strokeColor=#f0883e;strokeWidth=2;fontColor=#f0883e;fontStyle=1;" vertex="1" parent="fsm_box">
          <mxGeometry x="380" y="70" width="140" height="80" as="geometry" />
        </mxCell>
        <mxCell id="state_attack" value="ATTACK&#xa;(Атака игрока)" style="ellipse;whiteSpace=wrap;html=1;fillColor=#da3633;strokeColor=#f85149;strokeWidth=2;fontColor=#ffffff;fontStyle=1;" vertex="1" parent="fsm_box">
          <mxGeometry x="380" y="270" width="140" height="80" as="geometry" />
        </mxCell>
        <mxCell id="state_flee" value="FLEE / RETREAT&#xa;(Отступление / HP &lt; 20%)" style="ellipse;whiteSpace=wrap;html=1;fillColor=#21262d;strokeColor=#58a6ff;strokeWidth=2;fontColor=#58a6ff;fontStyle=1;" vertex="1" parent="fsm_box">
          <mxGeometry x="50" y="270" width="140" height="80" as="geometry" />
        </mxCell>
        <mxCell id="trans1" value="Цель в зоне видимости" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#f0883e;fontColor=#f0883e;" edge="1" parent="fsm_box" source="state_idle" target="state_chase">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="trans2" value="Дистанция удара &lt; 2m" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#f85149;fontColor=#f85149;" edge="1" parent="fsm_box" source="state_chase" target="state_attack">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="trans3" value="Критический урон" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#58a6ff;fontColor=#58a6ff;" edge="1" parent="fsm_box" source="state_attack" target="state_flee">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="trans4" value="Восстановление" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#3fb950;fontColor=#3fb950;" edge="1" parent="fsm_box" source="state_flee" target="state_idle">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`
  },
  {
    id: 'database_erd',
    title: 'ER-диаграмма базы данных',
    description: 'Схема реляционных таблиц, первичных ключей и связей (Users, Boards, Tasks)',
    icon: 'table_chart',
    xml: `<mxfile host="app.diagrams.net" modified="2026-09-14T12:00:00.000Z" agent="PULSE Dev" version="24.0.0">
  <diagram name="Database ERD" id="erd-1">
    <mxGraphModel dx="1200" dy="800" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1169" pageHeight="827" background="#0d1117" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
        <mxCell id="tbl_users" value="users&#xa;----------------------------&#xa;+ id : INTEGER [PK]&#xa;  email : TEXT&#xa;  name : TEXT&#xa;  avatar_url : TEXT&#xa;  provider : TEXT&#xa;  share_mode : TEXT&#xa;  created_at : DATETIME" style="shape=table;startSize=0;container=1;collapsible=0;childLayout=tableLayout;fixedRows=1;rowLines=0;fontStyle=0;fillColor=#161b22;strokeColor=#388bfd;fontColor=#f0f6fc;align=left;spacingLeft=10;" vertex="1" parent="1">
          <mxGeometry x="80" y="80" width="220" height="150" as="geometry" />
        </mxCell>
        <mxCell id="tbl_boards" value="boards&#xa;----------------------------&#xa;+ id : INTEGER [PK]&#xa;# user_id : INTEGER [FK]&#xa;  name : TEXT&#xa;  description : TEXT&#xa;  icon : TEXT&#xa;  created_at : DATETIME" style="shape=table;startSize=0;container=1;collapsible=0;childLayout=tableLayout;fixedRows=1;rowLines=0;fontStyle=0;fillColor=#161b22;strokeColor=#3fb950;fontColor=#f0f6fc;align=left;spacingLeft=10;" vertex="1" parent="1">
          <mxGeometry x="420" y="80" width="220" height="150" as="geometry" />
        </mxCell>
        <mxCell id="tbl_tasks" value="tasks&#xa;----------------------------&#xa;+ id : INTEGER [PK]&#xa;# user_id : INTEGER [FK]&#xa;# board_id : INTEGER [FK]&#xa;  title : TEXT&#xa;  difficulty : INTEGER&#xa;  status : TEXT&#xa;  group_id : TEXT&#xa;  created_at : DATETIME" style="shape=table;startSize=0;container=1;collapsible=0;childLayout=tableLayout;fixedRows=1;rowLines=0;fontStyle=0;fillColor=#161b22;strokeColor=#f0883e;fontColor=#f0f6fc;align=left;spacingLeft=10;" vertex="1" parent="1">
          <mxGeometry x="760" y="80" width="240" height="170" as="geometry" />
        </mxCell>
        <mxCell id="tbl_diagrams" value="diagrams&#xa;----------------------------&#xa;+ id : INTEGER [PK]&#xa;# user_id : INTEGER [FK]&#xa;  title : TEXT&#xa;  xml : TEXT&#xa;  created_at : DATETIME&#xa;  updated_at : DATETIME" style="shape=table;startSize=0;container=1;collapsible=0;childLayout=tableLayout;fixedRows=1;rowLines=0;fontStyle=0;fillColor=#161b22;strokeColor=#58a6ff;fontColor=#f0f6fc;align=left;spacingLeft=10;" vertex="1" parent="1">
          <mxGeometry x="420" y="320" width="220" height="150" as="geometry" />
        </mxCell>
        <mxCell id="rel_users_boards" value="1 : N" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#3fb950;strokeWidth=2;fontColor=#3fb950;" edge="1" parent="1" source="tbl_users" target="tbl_boards">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="rel_boards_tasks" value="1 : N" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#f0883e;strokeWidth=2;fontColor=#f0883e;" edge="1" parent="1" source="tbl_boards" target="tbl_tasks">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="rel_users_diagrams" value="1 : N" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#58a6ff;strokeWidth=2;fontColor=#58a6ff;" edge="1" parent="1" source="tbl_users" target="tbl_diagrams">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`
  },
  {
    id: 'blank',
    title: 'Чистый холст',
    description: 'Пустая диаграмма для свободного проектирования любой структуры',
    icon: 'note_add',
    xml: `<mxfile host="app.diagrams.net" modified="2026-09-14T12:00:00.000Z" agent="PULSE Dev" version="24.0.0">
  <diagram name="Blank Diagram" id="blank-1">
    <mxGraphModel dx="1200" dy="800" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1169" pageHeight="827" background="#0d1117" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`
  }
];

// Получить список сохраненных диаграмм из localStorage
export function getOfflineDiagrams() {
  try {
    const raw = localStorage.getItem(OFFLINE_DIAGRAMS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading offline diagrams:', e);
  }

  // Дефолтные диаграммы при первом запуске
  const defaultList = [
    {
      id: 'default-flowchart',
      title: 'Блок-схема алгоритма',
      xml: DIAGRAM_TEMPLATES[0].xml,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'default-architecture',
      title: 'Архитектура системы',
      xml: DIAGRAM_TEMPLATES[1].xml,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];
  saveOfflineDiagrams(defaultList);
  return defaultList;
}

// Сохранить полный список диаграмм в localStorage
export function saveOfflineDiagrams(diagrams) {
  try {
    localStorage.setItem(OFFLINE_DIAGRAMS_KEY, JSON.stringify(diagrams));
  } catch (e) {
    console.error('Error saving offline diagrams:', e);
  }
}

// Сохранить или обновить одну диаграмму в localStorage
export function saveOfflineDiagram(diagram) {
  const list = getOfflineDiagrams();
  const index = list.findIndex(d => String(d.id) === String(diagram.id));
  const now = new Date().toISOString();

  let updatedList;
  if (index >= 0) {
    updatedList = [...list];
    updatedList[index] = {
      ...updatedList[index],
      ...diagram,
      updated_at: now
    };
  } else {
    const newDiagram = {
      ...diagram,
      id: diagram.id || 'diag_' + Date.now(),
      created_at: diagram.created_at || now,
      updated_at: now
    };
    updatedList = [newDiagram, ...list];
  }

  saveOfflineDiagrams(updatedList);
  return updatedList;
}

// Удалить диаграмму из localStorage
export function deleteOfflineDiagram(diagramId) {
  const list = getOfflineDiagrams();
  const updatedList = list.filter(d => String(d.id) !== String(diagramId));
  saveOfflineDiagrams(updatedList);
  return updatedList;
}

// Скачать файл диаграммы (.drawio / XML)
export function downloadDiagramFile(title, content, format = 'drawio') {
  const safeTitle = (title || 'diagram').replace(/[^a-z0-9а-яё_-]/gi, '_');
  const filename = `${safeTitle}.${format}`;
  const blob = new Blob([content], { type: 'application/xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
