
/**
 * Subtask Type Definitions
 * 
 * This file defines the structure and types for subtasks
 */

/**
 * @typedef {Object} Subtask
 * @property {string} id - Unique identifier for the subtask
 * @property {string} title - Title/description of the subtask
 * @property {boolean} completed - Whether the subtask is completed
 * @property {string} notes - Optional notes/context for the subtask
 * @property {number} order - Order position in the subtask list
 * @property {string} createdAt - ISO timestamp when subtask was created
 * @property {string|null} completedAt - ISO timestamp when subtask was completed, null if not completed
 */

/**
 * Creates a new subtask object
 * @param {string} title - The title of the subtask
 * @param {number} order - The order position
 * @returns {Subtask}
 */
export function createSubtask(title, order = 0) {
  return {
    id: `subtask_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title: title.trim(),
    completed: false,
    notes: '',
    order,
    createdAt: new Date().toISOString(),
    completedAt: null
  };
}

/**
 * Validates a subtask object
 * @param {Subtask} subtask
 * @returns {boolean}
 */
export function isValidSubtask(subtask) {
  return (
    subtask &&
    typeof subtask.id === 'string' &&
    typeof subtask.title === 'string' &&
    subtask.title.trim().length > 0 &&
    typeof subtask.completed === 'boolean' &&
    typeof subtask.order === 'number'
  );
}

/**
 * Calculates progress for a list of subtasks
 * @param {Subtask[]} subtasks
 * @returns {{completed: number, total: number, percentage: number}}
 */
export function calculateSubtaskProgress(subtasks) {
  if (!subtasks || subtasks.length === 0) {
    return { completed: 0, total: 0, percentage: 0 };
  }

  const completed = subtasks.filter(st => st.completed).length;
  const total = subtasks.length;
  const percentage = Math.round((completed / total) * 100);

  return { completed, total, percentage };
}
