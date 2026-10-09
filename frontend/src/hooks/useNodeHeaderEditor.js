import { useState, useEffect, useRef } from 'react';

/**
 * Editing of a block node's header (text + emoji icon + colour), both in the
 * inline edit form and via the quick pickers shown in view mode.
 *
 * `fields` maps the generic text/icon/color onto the node's data keys, e.g.
 * { text: 'title', icon: 'titleIcon', color: 'titleColor' }.
 */
export function useNodeHeaderEditor({ nodeId, values, fields, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [textDraft, setTextDraft] = useState(values.text);
  const [iconDraft, setIconDraft] = useState(values.icon);
  const [colorDraft, setColorDraft] = useState(values.color);
  const [showEditEmojiPicker, setShowEditEmojiPicker] = useState(false);
  const [showEditColorPicker, setShowEditColorPicker] = useState(false);
  const [showViewEmojiPicker, setShowViewEmojiPicker] = useState(false);
  const [showViewColorPicker, setShowViewColorPicker] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    setTextDraft(values.text);
    setIconDraft(values.icon);
    setColorDraft(values.color);
  }, [values.text, values.icon, values.color]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const closeEditPickers = () => {
    setShowEditEmojiPicker(false);
    setShowEditColorPicker(false);
  };

  const save = () => {
    if (onUpdate && textDraft.trim()) {
      onUpdate(nodeId, { [fields.text]: textDraft.trim(), [fields.icon]: iconDraft, [fields.color]: colorDraft });
    }
    setEditing(false);
    closeEditPickers();
  };

  const cancel = () => {
    setTextDraft(values.text);
    setIconDraft(values.icon);
    setColorDraft(values.color);
    closeEditPickers();
    setEditing(false);
  };

  const keyDown = (e) => {
    if (e.key === 'Enter') {
      e.stopPropagation();
      save();
    } else if (e.key === 'Escape') {
      e.stopPropagation();
      cancel();
    }
  };

  const selectViewEmoji = (emoji) => {
    if (onUpdate) onUpdate(nodeId, { [fields.icon]: emoji });
    setShowViewEmojiPicker(false);
  };

  const selectViewColor = (color) => {
    if (onUpdate) onUpdate(nodeId, { [fields.color]: color });
    setShowViewColorPicker(false);
  };

  return {
    editing,
    setEditing,
    textDraft,
    setTextDraft,
    iconDraft,
    setIconDraft,
    colorDraft,
    setColorDraft,
    showEditEmojiPicker,
    setShowEditEmojiPicker,
    showEditColorPicker,
    setShowEditColorPicker,
    showViewEmojiPicker,
    setShowViewEmojiPicker,
    showViewColorPicker,
    setShowViewColorPicker,
    inputRef,
    save,
    keyDown,
    selectViewEmoji,
    selectViewColor
  };
}
