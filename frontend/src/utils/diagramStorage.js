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
              { prefix: '├── ', icon: '🎮', code: 'HandleMovement(WASD, Sprint)', comment: 'Физический сдвиг' },
              { prefix: '├── ', icon: '👁️', code: 'RotateCameraWithMouse(pitch, yaw)', comment: 'Вращение взгляда' },
              { prefix: '├── ', icon: '🎯', code: 'DropCurrentHeldItem(PointDrop)', comment: 'Вызов спавна' },
              { prefix: '└── ', icon: '🔊', code: 'AudioSource.PlayOneShot(stepSound)', comment: 'Звук шага' }
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
              { prefix: '├── ', icon: '🟢', code: 'State: PATROL', comment: 'Случайные путевые точки' },
              { prefix: '├── ', icon: '🟠', code: 'State: CHASE (Distance < 15m)', comment: 'Преследование игрока' },
              { prefix: '├── ', icon: '🔴', code: 'State: ATTACK (Distance < 1.8m)', comment: 'Нанесение урона' },
              { prefix: '└── ', icon: '💀', code: 'State: DEAD (HP <= 0)', comment: 'Включение рэгдолла' }
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
