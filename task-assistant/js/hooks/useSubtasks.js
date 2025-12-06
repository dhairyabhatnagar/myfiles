import { useState, useCallback } from 'react';
import { createSubtask, calculateSubtaskProgress } from '../types/subtask.types.js';
import { syncSubtasksToGitHub } from '../services/sync/githubSubtaskSync.js';

/**
 * Custom hook for managing subtasks
 * Encapsulates all subtask-related logic and state management
 * 
 * @param {Object} params
 * @param {Object} params.task - The parent task object
 * @param {Function} params.onUpdateTask - Callback to update the parent task
 * @param {Object} params.githubConfig - GitHub sync configuration (optional)
 * @returns {Object} Subtask management functions and state
 */
export function useSubtasks({ task, onUpdateTask, githubConfig = null }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState(null);

  /**
   * Updates subtasks in the task and optionally syncs to GitHub
   */
  const updateSubtasks = useCallback(async (newSubtasks) => {
    // Update local task
    const updatedTask = {
      ...task,
      subtasks: newSubtasks
    };

    onUpdateTask(updatedTask);

    // Sync to GitHub if configured
    if (githubConfig && githubConfig.enabled) {
      try {
        setIsSyncing(true);
        setSyncError(null);

        await syncSubtasksToGitHub({
          owner: githubConfig.owner,
          repo: githubConfig.repo,
          issueNumber: task.githubIssueNumber,
          token: githubConfig.token,
          currentBody: task.description || '',
          subtasks: newSubtasks
        });

        setIsSyncing(false);
      } catch (error) {
        console.error('Failed to sync subtasks to GitHub:', error);
        setSyncError(error.message);
        setIsSyncing(false);
        // Don't throw - local update succeeded, sync can be retried
      }
    }
  }, [task, onUpdateTask, githubConfig]);

  /**
   * Opens the subtask modal
   */
  const openModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  /**
   * Closes the subtask modal
   */
  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  /**
   * Adds a new subtask
   */
  const addSubtask = useCallback(async (title) => {
    const currentSubtasks = task.subtasks || [];
    const newSubtask = createSubtask(title, currentSubtasks.length);
    await updateSubtasks([...currentSubtasks, newSubtask]);
  }, [task.subtasks, updateSubtasks]);

  /**
   * Toggles subtask completion status
   */
  const toggleSubtaskComplete = useCallback(async (subtaskId) => {
    const currentSubtasks = task.subtasks || [];
    const updatedSubtasks = currentSubtasks.map(st => {
      if (st.id === subtaskId) {
        return {
          ...st,
          completed: !st.completed,
          completedAt: !st.completed ? new Date().toISOString() : null
        };
      }
      return st;
    });
    await updateSubtasks(updatedSubtasks);
  }, [task.subtasks, updateSubtasks]);

  /**
   * Updates a subtask's title and/or notes
   */
  const updateSubtask = useCallback(async (subtaskId, updates) => {
    const currentSubtasks = task.subtasks || [];
    const updatedSubtasks = currentSubtasks.map(st => {
      if (st.id === subtaskId) {
        return { ...st, ...updates };
      }
      return st;
    });
    await updateSubtasks(updatedSubtasks);
  }, [task.subtasks, updateSubtasks]);

  /**
   * Deletes a subtask
   */
  const deleteSubtask = useCallback(async (subtaskId) => {
    const currentSubtasks = task.subtasks || [];
    const updatedSubtasks = currentSubtasks
      .filter(st => st.id !== subtaskId)
      .map((st, index) => ({ ...st, order: index }));
    await updateSubtasks(updatedSubtasks);
  }, [task.subtasks, updateSubtasks]);

  /**
   * Reorders subtasks
   */
  const reorderSubtasks = useCallback(async (dragIndex, dropIndex) => {
    const currentSubtasks = task.subtasks || [];
    const reordered = [...currentSubtasks];
    const [draggedItem] = reordered.splice(dragIndex, 1);
    reordered.splice(dropIndex, 0, draggedItem);
    
    const updatedSubtasks = reordered.map((st, index) => ({ ...st, order: index }));
    await updateSubtasks(updatedSubtasks);
  }, [task.subtasks, updateSubtasks]);

  /**
   * Gets subtask progress
   */
  const getProgress = useCallback(() => {
    return calculateSubtaskProgress(task.subtasks || []);
  }, [task.subtasks]);

  /**
   * Checks if all subtasks are complete
   */
  const areAllComplete = useCallback(() => {
    const subtasks = task.subtasks || [];
    if (subtasks.length === 0) return true;
    return subtasks.every(st => st.completed);
  }, [task.subtasks]);

  /**
   * Gets count of pending subtasks
   */
  const getPendingCount = useCallback(() => {
    const subtasks = task.subtasks || [];
    return subtasks.filter(st => !st.completed).length;
  }, [task.subtasks]);

  /**
   * Manually retry GitHub sync
   */
  const retrySyncToGitHub = useCallback(async () => {
    if (!githubConfig || !githubConfig.enabled) {
      throw new Error('GitHub sync is not configured');
    }

    try {
      setIsSyncing(true);
      setSyncError(null);

      await syncSubtasksToGitHub({
        owner: githubConfig.owner,
        repo: githubConfig.repo,
        issueNumber: task.githubIssueNumber,
        token: githubConfig.token,
        currentBody: task.description || '',
        subtasks: task.subtasks || []
      });

      setIsSyncing(false);
      return { success: true };
    } catch (error) {
      console.error('Failed to sync subtasks to GitHub:', error);
      setSyncError(error.message);
      setIsSyncing(false);
      throw error;
    }
  }, [task, githubConfig]);

  return {
    // State
    subtasks: task.subtasks || [],
    isModalOpen,
    isSyncing,
    syncError,
    
    // Modal controls
    openModal,
    closeModal,
    
    // Subtask operations
    updateSubtasks,
    addSubtask,
    toggleSubtaskComplete,
    updateSubtask,
    deleteSubtask,
    reorderSubtasks,
    
    // Progress helpers
    getProgress,
    areAllComplete,
    getPendingCount,
    
    // Sync
    retrySyncToGitHub
  };
}

