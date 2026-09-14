import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import DeletableEdge from './diagram/DeletableEdge';
import BlockInspectorModal from './diagram/BlockInspectorModal';
import BlockPrefabsModal from './diagram/BlockPrefabsModal';
import NewDiagramModal from './diagram/modals/NewDiagramModal';
import NodeEditModal from './diagram/modals/NodeEditModal';
import TagModal from './diagram/modals/TagModal';
import DiagramToolbar from './diagram/DiagramToolbar';
import DiagramFloatingSelectionBar from './diagram/DiagramFloatingSelectionBar';
import { DiagramActionsContext } from './DiagramActionsContext';
import { STARTER_PRESETS } from '../utils/diagramStorage';

import useDiagramData from '../hooks/useDiagramData';
import useDiagramGrouping from '../hooks/useDiagramGrouping';
import useDiagramNodeActions from '../hooks/useDiagramNodeActions';
import useDiagramHistory from '../hooks/useDiagramHistory';

// Static types registry for React Flow
const nodeTypes = {
  hierarchyNode: GameDevHierarchyNode,
  logicNode: LogicStepNode,
  sectionNode: SectionGroupNode
};

const edgeTypes = {
  deletable: DeletableEdge
};

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

  // Hook 1: Diagram Data, Sync & Autosave
  const {
    diagrams,
    currentDiagramId,
    saveStatus,
    triggerAutoSave,
    handleSelectDiagram,
    handleCreateDiagram,
    handleDeleteDiagram,
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

  // Flow change handlers with autosave triggers
  const handleNodesChange = useCallback((changes) => {
    onNodesChange(changes);
    const hasPositionOrRemove = changes.some(
      c => (c.type === 'position' && c.dragging === false) || c.type === 'remove' || c.type === 'dimensions'
    );
    if (hasPositionOrRemove) {
      triggerAutoSave();
    }
  }, [onNodesChange, triggerAutoSave]);

  const handleEdgesChange = useCallback((changes) => {
    onEdgesChange(changes);
    const hasRemove = changes.some(c => c.type === 'remove');
    if (hasRemove) triggerAutoSave();
  }, [onEdgesChange, triggerAutoSave]);

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
        onOpenNewModal={() => { setNewTitle(''); setIsNewModalOpen(true); }}
        onDeleteDiagram={handleDeleteDiagram}
        saveStatus={saveStatus}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        interactionMode={interactionMode}
        setInteractionMode={setInteractionMode}
        onAddHierarchyNode={nodeActions.handleAddHierarchyNode}
        onAddLogicNode={nodeActions.handleAddLogicNode}
        onAddEmptySection={handleAddEmptySection}
        selectedGroupableCount={selectedGroupableCount}
        onGroupSelected={handleGroupSelectedNodes}
        onOpenPrefabsModal={() => nodeActions.setIsPrefabsModalOpen(true)}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
      />

      {/* React Flow Canvas */}
      <div className="diagram-canvas-viewport">
        <DiagramActionsContext.Provider
          value={{
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
            onDeleteEdge: nodeActions.handleDeleteEdge,
            onUpdateEdgeLabel: nodeActions.handleUpdateEdgeLabel,
            onUngroup: handleUngroup,
            onUpdateSection: handleUpdateSection,
            onDeleteSection: handleDeleteSection,
            onScaleSection: handleScaleSection,
            onResizeSectionEnd: handleResizeSectionEnd,
            onScaleSelectedNodes: handleScaleSelectedNodes
          }}
        >
          <ReactFlow
            nodes={nodesWithAccurateChildCounts}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={nodeActions.onConnect}
            onNodeDragStart={() => takeSnapshot()}
            onSelectionDragStart={() => takeSnapshot()}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            colorMode="dark"
            connectionMode="loose"
            deleteKeyCode={['Backspace', 'Delete']}
            edgesFocusable={true}
            edgesReconnectable={true}
            selectionOnDrag={interactionMode === 'select'}
            panOnDrag={interactionMode === 'select' ? [1, 2] : true}
            selectionMode="partial"
            selectionKeyCode={['Shift', 'Control']}
            multiSelectionKeyCode={['Shift', 'Control', 'Meta']}
            onSelectionChange={handleSelectionChange}
            elevateNodesOnSelect={false}
            defaultEdgeOptions={{
              type: 'deletable',
              animated: true,
              style: { stroke: '#58a6ff', strokeWidth: 2 }
            }}
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
            onScaleSelected={(factor) => handleScaleSelectedNodes(selectedNodes.map(n => n.id), factor)}
            onDeleteSelected={() => {
              selectedNodes.forEach(n => nodeActions.handleDeleteNode(n.id));
              setSelectedNodes([]);
            }}
            onClearSelection={() => {
              setNodes(nds => nds.map(n => ({ ...n, selected: false })));
              setSelectedNodes([]);
            }}
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
    </div>
  );
}
