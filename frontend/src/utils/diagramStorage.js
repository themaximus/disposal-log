// diagramStorage.js - Хранение и стартовые пресеты для нативного React Flow холста

const OFFLINE_DIAGRAMS_KEY = 'pulse_offline_reactflow_diagrams_v2';

export const STARTER_PRESETS = [
  {
    id: 'player_prefab_architecture',
    title: 'Архитектура игрока & Префабы (Player Prefab)',
    description: 'Древовидная структура Player.prefab, компонентов и систем сброса лута',
    data: {
      nodes: [
        {
          id: 'node-player-prefab',
          type: 'hierarchyNode',
          position: { x: 50, y: 80 },
          data: {
            tag: 'PREFAB',
            rootPath: 'Assets/Prefabs/Player/Player.prefab',
            items: [
              {
                level: 0,
                isLast: true,
                icon: '🟢',
                name: 'Player',
                details: 'CharacterController, PlayerController, AudioSource, GrassInteractor'
              },
              {
                level: 1,
                isLast: false,
                icon: '👁️',
                name: 'Visual',
                details: '3D-моделька или капсула БЕЗ лишнего CapsuleCollider'
              },
              {
                level: 1,
                isLast: true,
                icon: '📷',
                name: 'Main Camera',
                details: 'Камера, AudioListener'
              },
              {
                level: 2,
                isLast: false,
                icon: '🎯',
                name: 'PointDrop',
                details: 'Точка сброса предметов'
              },
              {
                level: 2,
                isLast: true,
                icon: '📱',
                name: 'Hands_Rig / HandContainer',
                details: 'Руки с анимацией покачивания и телефон'
              }
            ]
          }
        },
        {
          id: 'node-player-logic',
          type: 'logicNode',
          position: { x: 740, y: 50 },
          data: {
            nodeType: 'GAMEPLAY SCRIPT',
            title: 'PlayerController.cs',
            lines: [
              { level: 0, prefix: '├── ', icon: '🎮', code: 'HandleMovement(WASD, Sprint)', comment: 'Физический сдвиг' },
              { level: 0, prefix: '├── ', icon: '👁️', code: 'RotateCameraWithMouse(pitch, yaw)', comment: 'Вращение взгляда' },
              { level: 0, prefix: '├── ', icon: '🎯', code: 'DropCurrentHeldItem(PointDrop)', comment: 'Вызов спавна' },
              { level: 0, prefix: '└── ', icon: '🔊', code: 'AudioSource.PlayOneShot(stepSound)', comment: 'Звук шага' }
            ]
          }
        },
        {
          id: 'node-item-prefab',
          type: 'hierarchyNode',
          position: { x: 740, y: 310 },
          data: {
            tag: 'LOOT',
            rootPath: 'Assets/Prefabs/Items/LootItem.prefab',
            items: [
              {
                level: 0,
                isLast: true,
                icon: '📦',
                name: 'LootItem',
                details: 'Rigidbody, MeshCollider, InteractiveItem'
              },
              {
                level: 1,
                isLast: false,
                icon: '✨',
                name: 'FX_Glow',
                details: 'ParticleSystem, Light'
              },
              {
                level: 1,
                isLast: true,
                icon: '🏷️',
                name: 'UI_Prompt',
                details: 'WorldSpaceCanvas, Billboard'
              }
            ]
          }
        }
      ],
      edges: [
        {
          id: 'edge-1',
          source: 'node-player-prefab',
          target: 'node-player-logic',
          sourceHandle: 'source-right',
          targetHandle: 'target-left',
          label: 'Управляет скриптом',
          animated: true,
          style: { stroke: '#58a6ff', strokeWidth: 2 }
        },
        {
          id: 'edge-2',
          source: 'node-player-prefab',
          target: 'node-item-prefab',
          sourceHandle: 'source-right',
          targetHandle: 'target-left',
          label: 'Спавн из PointDrop',
          animated: true,
          style: { stroke: '#3fb950', strokeWidth: 2 }
        }
      ]
    }
  },
  {
    id: 'fsm_state_machine',
    title: 'FSM Машина состояний врага (Enemy AI)',
    description: 'Иерархия префаба врага и алгоритм переходов AI',
    data: {
      nodes: [
        {
          id: 'node-enemy-prefab',
          type: 'hierarchyNode',
          position: { x: 50, y: 60 },
          data: {
            tag: 'ENEMY',
            rootPath: 'Assets/Prefabs/Enemies/ZombieStalker.prefab',
            items: [
              { level: 0, isLast: true, icon: '🧟', name: 'ZombieStalker', details: 'NavMeshAgent, EnemyController, Health' },
              { level: 1, isLast: false, icon: '🦴', name: 'Armature / Rig', details: 'Animator, RagdollColliders' },
              { level: 1, isLast: true, icon: '👁️', name: 'DetectionEye', details: 'SphereCollider (Trigger), LineOfSight' }
            ]
          }
        },
        {
          id: 'node-fsm-states',
          type: 'logicNode',
          position: { x: 680, y: 60 },
          data: {
            nodeType: 'FSM LOGIC',
            title: 'EnemyStateMachine.Tick()',
            lines: [
              { level: 0, prefix: '├── ', icon: '🟢', code: 'State: PATROL', comment: 'Случайные путевые точки' },
              { level: 0, prefix: '├── ', icon: '🟠', code: 'State: CHASE (Distance < 15m)', comment: 'Преследование игрока' },
              { level: 0, prefix: '├── ', icon: '🔴', code: 'State: ATTACK (Distance < 1.8m)', comment: 'Нанесение урона' },
              { level: 0, prefix: '└── ', icon: '💀', code: 'State: DEAD (HP <= 0)', comment: 'Включение рэгдолла' }
            ]
          }
        }
      ],
      edges: [
        {
          id: 'edge-fsm',
          source: 'node-enemy-prefab',
          target: 'node-fsm-states',
          sourceHandle: 'source-right',
          targetHandle: 'target-left',
          label: 'AI Controller',
          animated: true,
          style: { stroke: '#f0883e', strokeWidth: 2 }
        }
      ]
    }
  }
];

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
    console.error('Failed to load offline diagrams:', e);
  }

  const defaultList = [
    {
      id: 'default-player-prefab',
      title: STARTER_PRESETS[0].title,
      nodes: STARTER_PRESETS[0].data.nodes,
      edges: STARTER_PRESETS[0].data.edges,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'default-fsm',
      title: STARTER_PRESETS[1].title,
      nodes: STARTER_PRESETS[1].data.nodes,
      edges: STARTER_PRESETS[1].data.edges,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  saveOfflineDiagrams(defaultList);
  return defaultList;
}

export function saveOfflineDiagrams(diagrams) {
  try {
    localStorage.setItem(OFFLINE_DIAGRAMS_KEY, JSON.stringify(diagrams));
  } catch (e) {
    console.error('Failed to save offline diagrams:', e);
  }
}

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

export function deleteOfflineDiagram(diagramId) {
  const list = getOfflineDiagrams();
  const updatedList = list.filter(d => String(d.id) !== String(diagramId));
  saveOfflineDiagrams(updatedList);
  return updatedList;
}

// Block Themes / Color Palettes
export const BLOCK_THEMES = [
  {
    id: 'default',
    name: 'GameDev Slate',
    description: 'Графит и синий акцент',
    bg: '#111419',
    border: '#2d333b',
    accent: '#58a6ff',
    badgeBg: 'rgba(56, 139, 253, 0.15)',
    badgeText: '#58a6ff',
    glowColor: 'rgba(88, 166, 255, 0.3)'
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    description: 'Неоновый циан и кибер-стиль',
    bg: '#0a101f',
    border: '#00f0ff',
    accent: '#00f0ff',
    badgeBg: 'rgba(0, 240, 255, 0.18)',
    badgeText: '#00f0ff',
    glowColor: 'rgba(0, 240, 255, 0.45)'
  },
  {
    id: 'emerald',
    name: 'Emerald Engine',
    description: 'Изумрудный терминал',
    bg: '#071710',
    border: '#238636',
    accent: '#3fb950',
    badgeBg: 'rgba(63, 185, 80, 0.18)',
    badgeText: '#3fb950',
    glowColor: 'rgba(63, 185, 80, 0.4)'
  },
  {
    id: 'crimson',
    name: 'Crimson Danger',
    description: 'Боевой рубин и опасность',
    bg: '#1a090d',
    border: '#da3633',
    accent: '#f85149',
    badgeBg: 'rgba(248, 81, 73, 0.18)',
    badgeText: '#f85149',
    glowColor: 'rgba(248, 81, 73, 0.45)'
  },
  {
    id: 'amethyst',
    name: 'Amethyst Void',
    description: 'Фиолетовая магия и шейдеры',
    bg: '#130922',
    border: '#8957e5',
    accent: '#bc8cff',
    badgeBg: 'rgba(188, 140, 255, 0.18)',
    badgeText: '#bc8cff',
    glowColor: 'rgba(188, 140, 255, 0.45)'
  },
  {
    id: 'amber',
    name: 'Amber Flame',
    description: 'Золото, лут и крафтинг',
    bg: '#1c1505',
    border: '#9e6a03',
    accent: '#d29922',
    badgeBg: 'rgba(210, 153, 34, 0.18)',
    badgeText: '#d29922',
    glowColor: 'rgba(210, 153, 34, 0.4)'
  }
];

// Built-in Block Prefab Templates
export const DEFAULT_BLOCK_PREFABS = [
  {
    id: 'prefab-player',
    title: 'Игрок / Персонаж (Player)',
    description: 'Готовая иерархия с контроллером, визуалом, камерой и руками',
    type: 'hierarchyNode',
    theme: 'default',
    glow: false,
    tag: 'PLAYER',
    data: {
      tag: 'PLAYER',
      rootPath: 'Assets/Prefabs/Characters/Player.prefab',
      theme: 'default',
      items: [
        { level: 0, isLast: true, icon: '🟢', name: 'Player_Root', details: 'CharacterController, AudioSource' },
        { level: 1, isLast: false, icon: '👁️', name: 'VisualModel', details: 'MeshFilter, Animator' },
        { level: 1, isLast: false, icon: '📷', name: 'CameraHolder', details: 'Camera, AudioListener' },
        { level: 2, isLast: true, icon: '🎯', name: 'PointDrop', details: 'RaycastOrigin, SpawnAnchor' }
      ]
    }
  },
  {
    id: 'prefab-weapon',
    title: 'Оружие / Инструмент (Weapon)',
    description: 'Модуль стрельбы, дуло, анимации и партиклы выстрела',
    type: 'hierarchyNode',
    theme: 'amber',
    glow: true,
    tag: 'WEAPON',
    data: {
      tag: 'WEAPON',
      rootPath: 'Assets/Prefabs/Weapons/Rifle_AK47.prefab',
      theme: 'amber',
      items: [
        { level: 0, isLast: true, icon: '⚔️', name: 'Rifle_AK47', details: 'WeaponController, AudioSource' },
        { level: 1, isLast: false, icon: '🔥', name: 'MuzzleFlash', details: 'ParticleSystem, Light' },
        { level: 1, isLast: false, icon: '🎯', name: 'AimSocket', details: 'Transform, ScopeAnchor' },
        { level: 1, isLast: true, icon: '📦', name: 'Magazine_Rig', details: 'ReloadAnim, Rigidbody' }
      ]
    }
  },
  {
    id: 'prefab-loot',
    title: 'Интерактивный предмет / Лут',
    description: 'Подбираемый лут с физикой, подсветкой и всплывающим UI',
    type: 'hierarchyNode',
    theme: 'emerald',
    glow: true,
    tag: 'LOOT',
    data: {
      tag: 'LOOT',
      rootPath: 'Assets/Prefabs/Items/HealthPotion.prefab',
      theme: 'emerald',
      items: [
        { level: 0, isLast: true, icon: '📦', name: 'LootItem', details: 'Rigidbody, MeshCollider, Interactable' },
        { level: 1, isLast: false, icon: '✨', name: 'GlowEffect', details: 'ParticleSystem, PointLight' },
        { level: 1, isLast: true, icon: '🏷️', name: 'HoverPrompt', details: 'BillboardCanvas, TextMeshPro' }
      ]
    }
  },
  {
    id: 'prefab-fsm-ai',
    title: 'FSM Машина состояний врага',
    description: 'Алгоритм переходов состояний: патруль, погоня, атака',
    type: 'logicNode',
    theme: 'crimson',
    glow: true,
    tag: 'AI FSM',
    data: {
      nodeType: 'AI FSM',
      title: 'EnemyStateMachine.Tick()',
      theme: 'crimson',
      lines: [
        { level: 0, prefix: '├── ', icon: '👁️', code: 'if (CanSeeTarget(player))', comment: 'Проверка видимости' },
        { level: 1, prefix: '├── ', icon: '🏃', code: 'SetState(AIState.ChaseTarget);', comment: 'Преследование' },
        { level: 0, prefix: '├── ', icon: '⚔️', code: 'if (InAttackRange())', comment: 'Удар в радиусе' },
        { level: 1, prefix: '├── ', icon: '💥', code: 'Attack();', comment: 'Нанесение урона' },
        { level: 0, prefix: '└── ', icon: '🔄', code: 'else PatrolWaypoints();', comment: 'Патрулирование точек' }
      ]
    }
  },
  {
    id: 'prefab-network-rpc',
    title: 'Сетевой RPC / Синхронизация',
    description: 'Обработка сетевых пакетов, ServerRpc и ClientRpc',
    type: 'logicNode',
    theme: 'cyberpunk',
    glow: true,
    tag: 'NETWORK',
    data: {
      nodeType: 'NETWORK',
      title: 'NetworkSyncManager.Update()',
      theme: 'cyberpunk',
      lines: [
        { level: 0, prefix: '├── ', icon: '📡', code: '[ServerRpc] SendPlayerInput(inputState)', comment: 'Клиент -> Сервер' },
        { level: 1, prefix: '├── ', icon: '⚡', code: 'ValidateAndApplyMovement(deltaTime)', comment: 'Авторитетная физика' },
        { level: 0, prefix: '└── ', icon: '🌐', code: '[ClientRpc] BroadcastPosition(serverPos)', comment: 'Сервер -> Клиенты' }
      ]
    }
  },
  {
    id: 'prefab-ui-canvas',
    title: 'UI Интерфейс / HUD',
    description: 'Экранный интерфейс: полоска здоровья, прицел, инвентарь',
    type: 'hierarchyNode',
    theme: 'amethyst',
    glow: false,
    tag: 'UI CANVAS',
    data: {
      tag: 'UI CANVAS',
      rootPath: 'Assets/UI/Prefabs/HUD_Canvas.prefab',
      theme: 'amethyst',
      items: [
        { level: 0, isLast: true, icon: '📱', name: 'HUD_Canvas', details: 'Canvas, CanvasScaler, GraphicRaycaster' },
        { level: 1, isLast: false, icon: '❤️', name: 'HealthBar_Widget', details: 'Slider, ImageFill, StatusText' },
        { level: 1, isLast: false, icon: '🎯', name: 'Crosshair_Overlay', details: 'Image, DynamicSpread' },
        { level: 1, isLast: true, icon: '🎒', name: 'QuickSlots_Bar', details: 'HorizontalLayoutGroup, SlotPool' }
      ]
    }
  }
];

// User-saved block prefabs storage
const SAVED_PREFABS_KEY = 'pulse_user_custom_block_prefabs_v1';

export function getSavedBlockPrefabs() {
  try {
    const raw = localStorage.getItem(SAVED_PREFABS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to get saved block prefabs:', e);
    return [];
  }
}

export function saveBlockPrefab(prefab) {
  const current = getSavedBlockPrefabs();
  const newPrefab = {
    ...prefab,
    id: prefab.id || 'custom_prefab_' + Date.now(),
    isCustom: true,
    created_at: new Date().toISOString()
  };
  const updated = [newPrefab, ...current.filter(p => p.id !== newPrefab.id)];
  try {
    localStorage.setItem(SAVED_PREFABS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save block prefab:', e);
  }
  return updated;
}

export function deleteBlockPrefab(prefabId) {
  const current = getSavedBlockPrefabs();
  const updated = current.filter(p => p.id !== prefabId);
  try {
    localStorage.setItem(SAVED_PREFABS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to delete block prefab:', e);
  }
  return updated;
}

