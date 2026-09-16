import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import GameDevHierarchyNode from './diagram/GameDevHierarchyNode';
import LogicStepNode from './diagram/LogicStepNode';
import SectionGroupNode from './diagram/SectionGroupNode';
import TextCardNode from './diagram/TextCardNode';
import DeletableEdge from './diagram/DeletableEdge';
import BlockInspectorModal from './diagram/BlockInspectorModal';
import BlockPrefabsModal from './diagram/BlockPrefabsModal';
import NewDiagramModal from './diagram/modals/NewDiagramModal';
import NodeEditModal from './diagram/modals/NodeEditModal';
import TagModal from './diagram/modals/TagModal';
import ExportDiagramModal from './diagram/modals/ExportDiagramModal';
import ImportDiagramModal from './diagram/modals/ImportDiagramModal';
import QuickConnectMenu from './diagram/QuickConnectMenu';
import DiagramToolbar from './diagram/DiagramToolbar';
import DiagramFloatingSelectionBar from './diagram/DiagramFloatingSelectionBar';
import { DiagramActionsContext } from './DiagramActionsContext';
import { STARTER_PRESETS } from '../utils/diagramStorage';

import useDiagramData from '../hooks/useDiagramData';
import useDiagramGrouping from '../hooks/useDiagramGrouping';
import useDiagramNodeActions from '../hooks/useDiagramNodeActions';
import useDiagramHistory from '../hooks/useDiagramHistory';
import useDiagramSmartGuides from '../hooks/useDiagramSmartGuides';

// Static types and props registry for React Flow performance
const nodeTypes = {
  hierarchyNode: GameDevHierarchyNode,
  logicNode: LogicStepNode,
  sectionNode: SectionGroupNode,
  textNode: TextCardNode
};

const edgeTypes = {
  deletable: DeletableEdge
};

const defaultEdgeOptions = {
  type: 'deletable',
  animated: true,
  style: { stroke: '#58a6ff', strokeWidth: 2 }
};

const deleteKeyCodes = ['Backspace', 'Delete'];
const selectionKeyCodes = ['Shift', 'Control'];
const multiSelectionKeyCodes = ['Shift', 'Control', 'Meta'];

export default function DiagramWorkspace({ currentUser, onOpenAuth }) {
  // Canvas DOM container & Fullscreen state
  const workspaceContainerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Canvas interaction mode: 'pan' (hand drag) | 'select' (marquee drag)
  const [interactionMode, setInteractionMode] = useState('pan');
  const [selectedNodes, setSelectedNodes] = useState([]);

  // React Flow core state
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Modal: New Diagram
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [selectedPresetId, setSelectedPresetId] = useState(STARTER_PRESETS[0].id);

  // Modals: Export and Import
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  // Snap-to-Grid & Smart Alignment Guides state
  const [snapToGrid, setSnapToGrid] = useState(true);

  // Hook 1: Diagram Data, Sync & Autosave
  const {
    diagrams,
    currentDiagramId,
    activeDiagram,
    saveStatus,
    triggerAutoSave,
    handleSelectDiagram,
    handleCreateDiagram,
    handleDeleteDiagram,
    handleImportProjectAsNew,
    handleReplaceCurrentWithProject,
    handleMergeProjectIntoCurrent,
    nodesRef
  } = useDiagramData({
    currentUser,
    nodes,
    setNodes,
    edges,
    setEdges
  });

  const triggerAutoSaveRef = useRef(triggerAutoSave);
  triggerAutoSaveRef.current = triggerAutoSave;

  // Hook: Smart Alignment Guides & Grid Snapping
  const {
    handleNodesChangeWithSnapping,
    clearGuides
  } = useDiagramSmartGuides({
    nodesRef,
    snapToGrid,
    gridSize: 18,
    snapThreshold: 8,
    enabled: true
  });

  // Hook 0: Diagram Undo/Redo History (Ctrl+Z, Ctrl+Shift+Z, Ctrl+Y)
  const {
    takeSnapshot,
    undo,
    redo,
    clearHistory,
    canUndo,
    canRedo
  } = useDiagramHistory({
    nodes,
    setNodes,
    edges,
    setEdges,
    triggerAutoSave: () => {
      if (triggerAutoSaveRef.current) triggerAutoSaveRef.current();
    }
  });

  const handleSelectDiagramWithHistory = useCallback(async (id) => {
    clearHistory();
    await handleSelectDiagram(id);
  }, [handleSelectDiagram, clearHistory]);

  // Hook 2: Grouping & Sections
  const {
    handleGroupSelectedNodes,
    handleUngroup,
    handleUpdateSection,
    handleDeleteSection,
    handleAddEmptySection,
    handleScaleSection,
    handleResizeSectionEnd,
    handleScaleSelectedNodes,
    nodesWithAccurateChildCounts
  } = useDiagramGrouping({
    nodes,
    setNodes,
    setEdges,
    nodesRef,
    triggerAutoSave,
    setSelectedNodes,
    takeSnapshot
  });

  // Hook 3: Node Actions, Edges & Modals
  const nodeActions = useDiagramNodeActions({
    nodes,
    setNodes,
    edges,
    setEdges,
    nodesRef,
    triggerAutoSave,
    takeSnapshot
  });

  // Selection change handler
  const handleSelectionChange = useCallback(({ nodes: selNodes }) => {
    setSelectedNodes(selNodes || []);
  }, []);

  // Flow change handlers with smart snapping and autosave triggers
  const handleNodesChange = useCallback((changes) => {
    handleNodesChangeWithSnapping(changes, onNodesChange, triggerAutoSave);
  }, [handleNodesChangeWithSnapping, onNodesChange, triggerAutoSave]);

  const handleEdgesChange = useCallback((changes) => {
    const hasRemove = changes.some(c => c.type === 'remove');
    if (hasRemove) takeSnapshot();
    onEdgesChange(changes);
    if (hasRemove) triggerAutoSave();
  }, [onEdgesChange, triggerAutoSave, takeSnapshot]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      workspaceContainerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Create diagram modal submit
  const handleConfirmCreateDiagram = async () => {
    await handleCreateDiagram(newTitle, selectedPresetId);
    setIsNewModalOpen(false);
    setNewTitle('');
  };

  // Quick Connect Menu state (Drop edge in empty canvas to spawn node)
  const connectingSourceRef = useRef(null);
  const hasConnectedRef = useRef(false);
  const [quickConnectMenu, setQuickConnectMenu] = useState(null);

  // Helper: Get center flow position of the current visible screen area (viewport)
  const getViewportCenterFlowPosition = useCallback(() => {
    if (!reactFlowInstance) {
      return { x: 250, y: 150 };
    }
    const container = workspaceContainerRef.current;
    if (container && reactFlowInstance.screenToFlowPosition) {
      const rect = container.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      return reactFlowInstance.screenToFlowPosition({ x: centerX, y: centerY });
    }
    const { x, y, zoom } = reactFlowInstance.getViewport();
    return {
      x: (-x + window.innerWidth / 2) / zoom,
      y: (-y + window.innerHeight / 2) / zoom
    };
  }, [reactFlowInstance]);

  // Toolbar node spawn handlers centered in current viewport
  const handleAddHierarchyNodeCenter = useCallback(() => {
    nodeActions.handleAddHierarchyNode(getViewportCenterFlowPosition());
  }, [nodeActions, getViewportCenterFlowPosition]);

  const handleAddLogicNodeCenter = useCallback(() => {
    nodeActions.handleAddLogicNode(getViewportCenterFlowPosition());
  }, [nodeActions, getViewportCenterFlowPosition]);

  const handleAddTextNodeCenter = useCallback(() => {
    nodeActions.handleAddTextNode(getViewportCenterFlowPosition());
  }, [nodeActions, getViewportCenterFlowPosition]);

  const handleAddEmptySectionCenter = useCallback(() => {
    handleAddEmptySection(getViewportCenterFlowPosition());
  }, [handleAddEmptySection, getViewportCenterFlowPosition]);

  // Connect handlers with QuickConnect popup on drop in empty canvas
  const handleConnectStart = useCallback((event, params) => {
    connectingSourceRef.current = params;
    hasConnectedRef.current = false;
  }, []);

  const handleConnect = useCallback((params) => {
    hasConnectedRef.current = true;
    connectingSourceRef.current = null;
    nodeActions.onConnect(params);
  }, [nodeActions]);

  const handleConnectEnd = useCallback((event) => {
    if (hasConnectedRef.current) {
      connectingSourceRef.current = null;
      return;
    }

    if (!connectingSourceRef.current || !reactFlowInstance) {
      connectingSourceRef.current = null;
      return;
    }

    // Determine client position of mouseup / touchend
    const clientX = 'clientX' in event ? event.clientX : event.changedTouches?.[0]?.clientX;
    const clientY = 'clientY' in event ? event.clientY : event.changedTouches?.[0]?.clientY;

    if (clientX === undefined || clientY === undefined) {
      connectingSourceRef.current = null;
      return;
    }

    // Ignore if drop happened directly on controls, minimap, top bar or modal
    const targetElement = event.target;
    if (targetElement && targetElement.closest && targetElement.closest('.react-flow__controls, .react-flow__minimap, .diagram-top-bar, .modal')) {
      connectingSourceRef.current = null;
      return;
    }

    const flowPos = reactFlowInstance.screenToFlowPosition({ x: clientX, y: clientY });

    setQuickConnectMenu({
      screenX: clientX,
      screenY: clientY,
      flowX: flowPos.x,
      flowY: flowPos.y,
      sourceNodeId: connectingSourceRef.current.nodeId,
      sourceHandleId: connectingSourceRef.current.handleId,
      handleType: connectingSourceRef.current.handleType
    });

    connectingSourceRef.current = null;
  }, [reactFlowInstance]);

  const handleQuickConnectSelect = useCallback((type) => {
    if (quickConnectMenu) {
      nodeActions.handleSpawnNodeConnected({
        type,
        flowPosition: { x: quickConnectMenu.flowX, y: quickConnectMenu.flowY },
        sourceNodeId: quickConnectMenu.sourceNodeId,
        sourceHandleId: quickConnectMenu.sourceHandleId,
        handleType: quickConnectMenu.handleType
      });
      setQuickConnectMenu(null);
    }
  }, [quickConnectMenu, nodeActions]);

  // Memoized handlers for toolbar, selection bar and canvas drag to prevent re-renders
  const handleOpenNewModal = useCallback(() => {
    setNewTitle('');
    setIsNewModalOpen(true);
  }, []);

  const handleOpenPrefabsModal = useCallback(() => {
    nodeActions.setIsPrefabsModalOpen(true);
  }, [nodeActions]);

  const handleScaleSelectedFromBar = useCallback((factor) => {
    handleScaleSelectedNodes(selectedNodes.map(n => n.id), factor);
  }, [handleScaleSelectedNodes, selectedNodes]);

  const handleDeleteSelectedFromBar = useCallback(() => {
    selectedNodes.forEach(n => nodeActions.handleDeleteNode(n.id));
    setSelectedNodes([]);
  }, [nodeActions, selectedNodes]);

  const handleClearSelectionFromBar = useCallback(() => {
    setNodes(nds => nds.map(n => n.selected ? { ...n, selected: false } : n));
    setSelectedNodes([]);
  }, [setNodes]);

  const handleNodeDragStart = useCallback(() => {
    takeSnapshot();
  }, [takeSnapshot]);

  const handleSelectionDragStart = useCallback(() => {
    takeSnapshot();
  }, [takeSnapshot]);

  // Memoized context value: stays completely referentially stable across re-renders
  const actionsContextValue = useMemo(() => ({
    takeSnapshot,
    triggerAutoSave,
    setNodes,
    nodesRef,
    onOpenInspector: nodeActions.handleOpenInspector,
    onEditNode: nodeActions.handleEditNode,
    onDeleteNode: nodeActions.handleDeleteNode,
    onQuickAdd: nodeActions.handleQuickAdd,
    onOpenTagModal: nodeActions.handleOpenTagModal,
    onScaleNode: nodeActions.handleScaleNode,
    onUpdateHierarchyItem: nodeActions.handleUpdateHierarchyItem,
    onDeleteHierarchyItem: nodeActions.handleDeleteHierarchyItem,
    onAddHierarchySubItem: nodeActions.handleAddHierarchySubItem,
    onAddHierarchySiblingItem: nodeActions.handleAddHierarchySiblingItem,
    onIndentHierarchyItem: nodeActions.handleIndentHierarchyItem,
    onUpdateHierarchyRoot: nodeActions.handleUpdateHierarchyRoot,
    onUpdateLogicLine: nodeActions.handleUpdateLogicLine,
    onDeleteLogicLine: nodeActions.handleDeleteLogicLine,
    onAddLogicSubLine: nodeActions.handleAddLogicSubLine,
    onAddLogicSiblingLine: nodeActions.handleAddLogicSiblingLine,
    onIndentLogicLine: nodeActions.handleIndentLogicLine,
    onUpdateLogicTitle: nodeActions.handleUpdateLogicTitle,
    onUpdateTextNode: nodeActions.handleUpdateTextNode,
    onDeleteEdge: nodeActions.handleDeleteEdge,
    onUpdateEdgeLabel: nodeActions.handleUpdateEdgeLabel,
    onUngroup: handleUngroup,
    onUpdateSection: handleUpdateSection,
    onDeleteSection: handleDeleteSection,
    onScaleSection: handleScaleSection,
    onResizeSectionEnd: handleResizeSectionEnd,
    onScaleSelectedNodes: handleScaleSelectedNodes
  }), [
    takeSnapshot,
    triggerAutoSave,
    setNodes,
    nodesRef,
    nodeActions.handleOpenInspector,
    nodeActions.handleEditNode,
    nodeActions.handleDeleteNode,
    nodeActions.handleQuickAdd,
    nodeActions.handleOpenTagModal,
    nodeActions.handleScaleNode,
    nodeActions.handleUpdateHierarchyItem,
    nodeActions.handleDeleteHierarchyItem,
    nodeActions.handleAddHierarchySubItem,
    nodeActions.handleAddHierarchySiblingItem,
    nodeActions.handleIndentHierarchyItem,
    nodeActions.handleUpdateHierarchyRoot,
    nodeActions.handleUpdateLogicLine,
    nodeActions.handleDeleteLogicLine,
    nodeActions.handleAddLogicSubLine,
    nodeActions.handleAddLogicSiblingLine,
    nodeActions.handleIndentLogicLine,
    nodeActions.handleUpdateLogicTitle,
    nodeActions.handleUpdateTextNode,
    nodeActions.handleDeleteEdge,
    nodeActions.handleUpdateEdgeLabel,
    handleUngroup,
    handleUpdateSection,
    handleDeleteSection,
    handleScaleSection,
    handleResizeSectionEnd,
    handleScaleSelectedNodes
  ]);

  const selectedGroupableCount = selectedNodes.filter(n => n.type !== 'sectionNode').length;

  return (
    <div
      ref={workspaceContainerRef}
      className={`diagram-workspace-container ${isFullscreen ? 'diagram-fullscreen' : ''}`}
    >
      {/* Top Header Bar */}
      <DiagramToolbar
        diagrams={diagrams}
        currentDiagramId={currentDiagramId}
        onSelectDiagram={handleSelectDiagramWithHistory}
        onOpenNewModal={handleOpenNewModal}
        onDeleteDiagram={handleDeleteDiagram}
        saveStatus={saveStatus}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        interactionMode={interactionMode}
        setInteractionMode={setInteractionMode}
        onAddHierarchyNode={handleAddHierarchyNodeCenter}
        onAddLogicNode={handleAddLogicNodeCenter}
        onAddTextNode={handleAddTextNodeCenter}
        onAddEmptySection={handleAddEmptySectionCenter}
        selectedGroupableCount={selectedGroupableCount}
        onGroupSelected={handleGroupSelectedNodes}
        onOpenPrefabsModal={handleOpenPrefabsModal}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        snapToGrid={snapToGrid}
        onToggleSnapToGrid={() => setSnapToGrid(prev => !prev)}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
      />

      {/* React Flow Canvas */}
      <div className="diagram-canvas-viewport">
        <DiagramActionsContext.Provider value={actionsContextValue}>
          <ReactFlow
            nodes={nodesWithAccurateChildCounts}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={handleConnect}
            onConnectStart={handleConnectStart}
            onConnectEnd={handleConnectEnd}
            onInit={setReactFlowInstance}
            onNodeDragStart={handleNodeDragStart}
            onNodeDragStop={clearGuides}
            onSelectionDragStart={handleSelectionDragStart}
            onSelectionDragStop={clearGuides}
            snapToGrid={snapToGrid}
            snapGrid={[18, 18]}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            colorMode="dark"
            connectionMode="loose"
            deleteKeyCode={deleteKeyCodes}
            edgesFocusable={true}
            edgesReconnectable={true}
            selectionOnDrag={interactionMode === 'select'}
            panOnDrag={interactionMode === 'select' ? [1, 2] : true}
            selectionMode="partial"
            selectionKeyCode={selectionKeyCodes}
            multiSelectionKeyCode={multiSelectionKeyCodes}
            onSelectionChange={handleSelectionChange}
            elevateNodesOnSelect={false}
            onlyRenderVisibleElements={true}
            defaultEdgeOptions={defaultEdgeOptions}
          >
            <Background variant="dots" gap={18} size={1.2} color="#30363d" />
            <Controls className="react-flow-custom-controls" />
            <MiniMap
              className="react-flow-custom-minimap"
              nodeColor={() => '#1f242c'}
              maskColor="rgba(13, 17, 23, 0.75)"
            />
          </ReactFlow>

          {/* Floating selection bar when multiple nodes are selected */}
          <DiagramFloatingSelectionBar
            selectedNodes={selectedNodes}
            onGroup={handleGroupSelectedNodes}
            onUngroup={handleUngroup}
            onScaleSelected={handleScaleSelectedFromBar}
            onDeleteSelected={handleDeleteSelectedFromBar}
            onExportSelected={() => setIsExportModalOpen(true)}
            onClearSelection={handleClearSelectionFromBar}
          />
        </DiagramActionsContext.Provider>
      </div>

      {/* Modal: New Diagram with Presets */}
      <NewDiagramModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        newTitle={newTitle}
        setNewTitle={setNewTitle}
        selectedPresetId={selectedPresetId}
        setSelectedPresetId={setSelectedPresetId}
        onCreateDiagram={handleConfirmCreateDiagram}
      />

      {/* Modal: Detailed Node Editor */}
      <NodeEditModal
        isOpen={nodeActions.isNodeEditModalOpen}
        onClose={() => nodeActions.setIsNodeEditModalOpen(false)}
        node={nodeActions.editingNode}
        editModeTab={nodeActions.editModeTab}
        setEditModeTab={nodeActions.setEditModeTab}
        editHierarchyData={nodeActions.editHierarchyData}
        setEditHierarchyData={nodeActions.setEditHierarchyData}
        editLogicData={nodeActions.editLogicData}
        setEditLogicData={nodeActions.setEditLogicData}
        addHierarchyItemRow={nodeActions.addHierarchyItemRow}
        removeHierarchyItemRow={nodeActions.removeHierarchyItemRow}
        updateHierarchyItemRow={nodeActions.updateHierarchyItemRow}
        addLogicLineRow={nodeActions.addLogicLineRow}
        removeLogicLineRow={nodeActions.removeLogicLineRow}
        updateLogicLineRow={nodeActions.updateLogicLineRow}
        onSave={nodeActions.handleSaveNodeEdit}
      />

      {/* Modal: '@' Tag / Mention Modal */}
      <TagModal
        isOpen={nodeActions.isTagModalOpen}
        onClose={() => nodeActions.setIsTagModalOpen(false)}
        tagInputValue={nodeActions.tagInputValue}
        setTagInputValue={nodeActions.setTagInputValue}
        onSaveTag={nodeActions.handleSaveTag}
      />

      {/* Block Inspector Modal (Properties & Style) */}
      <BlockInspectorModal
        isOpen={nodeActions.isInspectorOpen}
        onClose={() => nodeActions.setIsInspectorOpen(false)}
        node={nodeActions.inspectorNode}
        onUpdateNodeData={nodeActions.handleUpdateNodeData}
        onSavePrefab={nodeActions.handleSavePrefab}
      />

      {/* Block Prefabs Catalog Modal */}
      <BlockPrefabsModal
        isOpen={nodeActions.isPrefabsModalOpen}
        onClose={() => nodeActions.setIsPrefabsModalOpen(false)}
        onSpawnPrefab={nodeActions.handleSpawnPrefab}
      />

      {/* Export Modal (PNG / SVG / PDF / .diagram) */}
      <ExportDiagramModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        nodes={nodes}
        edges={edges}
        selectedNodes={selectedNodes}
        currentDiagramTitle={activeDiagram?.title || 'Схема'}
        viewport={reactFlowInstance?.getViewport() || { x: 0, y: 0, zoom: 1 }}
      />

      {/* Import Modal (.diagram / JSON) */}
      <ImportDiagramModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportNewDiagram={handleImportProjectAsNew}
        onReplaceCurrentDiagram={handleReplaceCurrentWithProject}
        onMergeIntoCurrentDiagram={handleMergeProjectIntoCurrent}
        currentDiagramTitle={activeDiagram?.title || 'Схема'}
      />

      {/* Quick Connect Popover Menu */}
      <QuickConnectMenu
        menuData={quickConnectMenu}
        onSelect={handleQuickConnectSelect}
        onClose={() => setQuickConnectMenu(null)}
      />
    </div>
  );
}
