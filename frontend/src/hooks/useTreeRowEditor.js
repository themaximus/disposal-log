import { useState, useEffect, useRef } from 'react';
import { clampTreeLevel } from '../utils/diagramNodeUtils';

/**
 * Inline editing of nested rows inside a block node (hierarchy items, logic
 * lines): draft state, Tab/Shift+Tab indentation, adding children/siblings.
 *
 * @param {object} options
 * @param {string} options.nodeId
 * @param {Array}  options.rows            current rows (each has `level`)
 * @param {string} options.primaryField    field that must be non-empty to save
 * @param {(row) => object} options.toDraft            row -> editable draft
 * @param {(kind, level) => object} options.newDraft   draft for a new 'sub' | 'sibling' row
 * @param {boolean} [options.selectOnEdit]  also mark the row selected when editing starts
 * @param {object} options.actions  { update, remove, addSub, addSibling, quickAdd } diagram callbacks
 */
export function useTreeRowEditor({ nodeId, rows, primaryField, toDraft, newDraft, initialDraft, selectOnEdit = false, actions }) {
  const [editingRowIdx, setEditingRowIdx] = useState(null);
  const [selectedRowIdx, setSelectedRowIdx] = useState(null);
  const [draft, setDraft] = useState(initialDraft);
  const inputRef = useRef(null);

  useEffect(() => {
    if (editingRowIdx !== null && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingRowIdx]);

  const stopEditing = () => {
    setEditingRowIdx(null);
    setSelectedRowIdx(null);
  };

  const beginEditing = (idx, nextDraft) => {
    setEditingRowIdx(idx);
    setSelectedRowIdx(idx);
    setDraft(nextDraft);
  };

  const commitDraft = (idx) => {
    if (actions.update && String(draft[primaryField] || '').trim()) {
      actions.update(nodeId, idx, draft);
    }
  };

  const startEdit = (idx, row) => {
    if (selectOnEdit) setSelectedRowIdx(idx);
    setEditingRowIdx(idx);
    setDraft(toDraft(row));
  };

  const saveRow = (idx) => {
    commitDraft(idx);
    stopEditing();
  };

  const addSubRow = (e, idx) => {
    if (e) e.stopPropagation();
    const parentLevel = rows[idx] ? (rows[idx].level || 0) : 0;
    if (actions.addSub) actions.addSub(nodeId, idx);
    beginEditing(idx + 1, newDraft('sub', parentLevel + 1));
  };

  const addSiblingRow = (e, idx) => {
    if (e) e.stopPropagation();
    const level = rows[idx] ? (rows[idx].level || 0) : 0;
    // New sibling goes after the current row's whole subtree.
    let insertIdx = idx + 1;
    while (insertIdx < rows.length && (rows[insertIdx].level || 0) > level) insertIdx++;

    if (actions.addSibling) actions.addSibling(nodeId, idx);
    beginEditing(insertIdx, newDraft('sibling', level));
  };

  const saveAndAddSub = (idx) => {
    commitDraft(idx);
    addSubRow(null, idx);
  };

  const indentDraft = (e, delta) => {
    if (e) e.stopPropagation();
    setDraft(prev => ({ ...prev, level: clampTreeLevel((prev.level || 0) + delta) }));
  };

  const rowKeyDown = (e, idx) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      indentDraft(e, e.shiftKey ? -1 : 1);
    } else if (e.key === 'Enter') {
      e.stopPropagation();
      saveRow(idx);
    } else if (e.key === 'Escape') {
      e.stopPropagation();
      stopEditing();
    }
  };

  const deleteRow = (e, idx) => {
    e.stopPropagation();
    if (actions.remove) actions.remove(nodeId, idx);
    stopEditing();
  };

  // "+" in the header: add a sibling after the edited/selected/last row.
  const quickAdd = (e) => {
    e.stopPropagation();
    if (rows.length === 0) {
      if (actions.quickAdd) actions.quickAdd(nodeId);
      return;
    }
    let targetIdx = rows.length - 1;
    if (editingRowIdx !== null) targetIdx = editingRowIdx;
    else if (selectedRowIdx !== null && selectedRowIdx < rows.length) targetIdx = selectedRowIdx;

    if (editingRowIdx !== null) commitDraft(editingRowIdx);
    addSiblingRow(e, targetIdx);
  };

  return {
    editingRowIdx,
    setEditingRowIdx,
    selectedRowIdx,
    setSelectedRowIdx,
    draft,
    setDraft,
    inputRef,
    startEdit,
    saveRow,
    saveAndAddSub,
    addSubRow,
    addSiblingRow,
    indentDraft,
    rowKeyDown,
    deleteRow,
    quickAdd
  };
}
