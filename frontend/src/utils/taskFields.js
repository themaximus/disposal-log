// Tasks come either from the API (parsed arrays) or from older/offline
// snapshots that only carry the raw *_json strings.

const parseArray = (raw) => {
  if (typeof raw !== 'string') return null;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch (e) {
    return null;
  }
};

export function getTaskMedia(task) {
  if (!task) return [];
  if (Array.isArray(task.images) && task.images.length > 0) return task.images;
  const parsed = parseArray(task.images_json);
  if (parsed && parsed.length > 0) return parsed;
  return task.image_url ? [task.image_url] : [];
}

export function getTaskSubtasks(task) {
  if (!task) return [];
  if (Array.isArray(task.subtasks)) return task.subtasks;
  return parseArray(task.subtasks_json) || [];
}

export const isVideoUrl = (url) => typeof url === 'string' && /\.(mp4|webm|mov|ogg)$/i.test(url);

/** Groups a column's tasks into single cards and stacks (shared group_id). */
export function groupColumnTasks(tasks, columnKey) {
  const colTasks = tasks.filter(t => t.status === columnKey && !t.deleted_at);
  const result = [];
  const seenGroups = new Set();

  for (const task of colTasks) {
    if (!task.group_id) {
      result.push({ isStack: false, task });
    } else if (!seenGroups.has(task.group_id)) {
      seenGroups.add(task.group_id);
      result.push({ isStack: true, groupId: task.group_id, tasks: colTasks.filter(t => t.group_id === task.group_id) });
    }
  }
  return result;
}
