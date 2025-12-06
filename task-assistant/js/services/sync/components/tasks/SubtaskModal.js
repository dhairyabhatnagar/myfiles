import React, { useState, useEffect, useRef } from 'react';
import { createSubtask, calculateSubtaskProgress } from '../../types/subtask.types.js';

/**
 * SubtaskModal - Modal component for managing subtasks
 * Opens when user clicks subtask indicator or double-clicks task card
 */
export function SubtaskModal({ 
  isOpen, 
  onClose, 
  task, 
  onUpdateSubtasks,
  onCompleteMainTask 
}) {
  const [subtasks, setSubtasks] = useState(task?.subtasks || []);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingNotes, setEditingNotes] = useState('');
  const [showCompleted, setShowCompleted] = useState(true);
  const inputRef = useRef(null);

  useEffect(() => {
    if (task?.subtasks) {
      setSubtasks([...task.subtasks].sort((a, b) => a.order - b.order));
    }
  }, [task]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const progress = calculateSubtaskProgress(subtasks);

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;

    const newSubtask = createSubtask(newSubtaskTitle, subtasks.length);
    const updatedSubtasks = [...subtasks, newSubtask];
    
    setSubtasks(updatedSubtasks);
    onUpdateSubtasks(updatedSubtasks);
    setNewSubtaskTitle('');
    inputRef.current?.focus();
  };

  const handleToggleComplete = (subtaskId) => {
    const updatedSubtasks = subtasks.map(st => {
      if (st.id === subtaskId) {
        return {
          ...st,
          completed: !st.completed,
          completedAt: !st.completed ? new Date().toISOString() : null
        };
      }
      return st;
    });
    
    setSubtasks(updatedSubtasks);
    onUpdateSubtasks(updatedSubtasks);
  };

  const handleDelete = (subtaskId) => {
    const updatedSubtasks = subtasks
      .filter(st => st.id !== subtaskId)
      .map((st, index) => ({ ...st, order: index }));
    
    setSubtasks(updatedSubtasks);
    onUpdateSubtasks(updatedSubtasks);
  };

  const handleStartEdit = (subtask) => {
    setEditingId(subtask.id);
    setEditingTitle(subtask.title);
    setEditingNotes(subtask.notes || '');
  };

  const handleSaveEdit = () => {
    if (!editingTitle.trim()) return;

    const updatedSubtasks = subtasks.map(st => {
      if (st.id === editingId) {
        return {
          ...st,
          title: editingTitle.trim(),
          notes: editingNotes.trim()
        };
      }
      return st;
    });
    
    setSubtasks(updatedSubtasks);
    onUpdateSubtasks(updatedSubtasks);
    setEditingId(null);
    setEditingTitle('');
    setEditingNotes('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingTitle('');
    setEditingNotes('');
  };

  const handleReorder = (dragIndex, dropIndex) => {
    const reordered = [...subtasks];
    const [draggedItem] = reordered.splice(dragIndex, 1);
    reordered.splice(dropIndex, 0, draggedItem);
    
    const updatedSubtasks = reordered.map((st, index) => ({ ...st, order: index }));
    setSubtasks(updatedSubtasks);
    onUpdateSubtasks(updatedSubtasks);
  };

  const handleCompleteMainTask = () => {
    const pendingCount = subtasks.filter(st => !st.completed).length;
    
    if (pendingCount > 0) {
      const confirmed = window.confirm(
        `You have ${pendingCount} incomplete subtask${pendingCount > 1 ? 's' : ''}. Mark main task as complete anyway?`
      );
      if (!confirmed) return;
    }
    
    onCompleteMainTask();
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddSubtask();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const visibleSubtasks = showCompleted 
    ? subtasks 
    : subtasks.filter(st => !st.completed);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div 
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {task?.title}
              </h2>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">
                  {progress.completed}/{progress.total} complete
                </span>
                <span>•</span>
                <span>{progress.percentage}%</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Close (Esc)"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
            <div 
              className="bg-green-500 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>

        {/* Subtasks List */}
        <div className="flex-1 overflow-y-auto p-6">
          {visibleSubtasks.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <p className="text-4xl mb-2">📝</p>
              <p>{showCompleted ? 'No subtasks yet' : 'No pending subtasks'}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {visibleSubtasks.map((subtask, index) => (
                <SubtaskItem
                  key={subtask.id}
                  subtask={subtask}
                  isEditing={editingId === subtask.id}
                  editingTitle={editingTitle}
                  editingNotes={editingNotes}
                  onToggleComplete={handleToggleComplete}
                  onDelete={handleDelete}
                  onStartEdit={handleStartEdit}
                  onSaveEdit={handleSaveEdit}
                  onCancelEdit={handleCancelEdit}
                  onTitleChange={setEditingTitle}
                  onNotesChange={setEditingNotes}
                  onReorder={(dropIndex) => handleReorder(index, dropIndex)}
                  index={index}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer - Add New Subtask */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 space-y-3">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add a subtask... (Press Enter)"
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleAddSubtask}
              disabled={!newSubtaskTitle.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 
                       disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Add
            </button>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                checked={showCompleted}
                onChange={(e) => setShowCompleted(e.target.checked)}
                className="rounded"
              />
              Show completed
            </label>

            <button
              onClick={handleCompleteMainTask}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              Mark Main Task Complete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/*
================================================================================
FILE: src/components/tasks/SubtaskModal.js  
PART 2 OF 2 (SubtaskItem component)
================================================================================
*/

/**
 * SubtaskItem - Individual subtask row component
 */
function SubtaskItem({
  subtask,
  isEditing,
  editingTitle,
  editingNotes,
  onToggleComplete,
  onDelete,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onTitleChange,
  onNotesChange,
  onReorder,
  index
}) {
  const [dragOver, setDragOver] = useState(false);

  if (isEditing) {
    return (
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-500">
        <input
          type="text"
          value={editingTitle}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Subtask title"
          className="w-full px-3 py-2 mb-2 border border-gray-300 dark:border-gray-600 rounded-lg
                   bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          autoFocus
        />
        <textarea
          value={editingNotes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Optional notes..."
          className="w-full px-3 py-2 mb-2 border border-gray-300 dark:border-gray-600 rounded-lg
                   bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
          rows={2}
        />
        <div className="flex gap-2">
          <button
            onClick={onSaveEdit}
            className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
          >
            Save
          </button>
          <button
            onClick={onCancelEdit}
            className="px-3 py-1 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white text-sm rounded hover:bg-gray-400 dark:hover:bg-gray-500"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', index.toString());
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
        if (dragIndex !== index) {
          onReorder(index);
        }
      }}
      className={`
        group p-4 rounded-lg border transition-all cursor-move
        ${subtask.completed 
          ? 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 opacity-60' 
          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}
        ${dragOver ? 'border-blue-500 border-2' : ''}
      `}
    >
      <div className="flex items-start gap-3">
        {/* Drag Handle */}
        <div className="mt-1 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
          </svg>
        </div>

        {/* Checkbox */}
        <button
          onClick={() => onToggleComplete(subtask.id)}
          className="mt-1 flex-shrink-0"
        >
          {subtask.completed ? (
            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 20 20">
              <circle cx="10" cy="10" r="8" strokeWidth="2" />
            </svg>
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={`text-gray-900 dark:text-white ${subtask.completed ? 'line-through' : ''}`}>
            {subtask.title}
          </p>
          {subtask.notes && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 italic">
              {subtask.notes}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onStartEdit(subtask)}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
            title="Edit"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(subtask.id)}
            className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded transition-colors"
            title="Delete"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
