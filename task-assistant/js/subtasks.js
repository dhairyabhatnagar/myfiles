// ==================== COMPLETE SUBTASKS FUNCTIONALITY ====================
// All subtask code in one file - no imports/exports needed

// ==================== SUBTASK TYPES ====================

function createSubtask(title, order = 0) {
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

function calculateSubtaskProgress(subtasks) {
  if (!subtasks || subtasks.length === 0) {
    return { completed: 0, total: 0, percentage: 0 };
  }

  const completed = subtasks.filter(st => st.completed).length;
  const total = subtasks.length;
  const percentage = Math.round((completed / total) * 100);

  return { completed, total, percentage };
}

// ==================== GITHUB SYNC ====================

function formatSubtasksForGitHub(subtasks) {
  if (!subtasks || subtasks.length === 0) {
    return '';
  }

  const sorted = [...subtasks].sort((a, b) => a.order - b.order);
  let markdown = '\n\n---\n\n## Subtasks\n\n';

  sorted.forEach(subtask => {
    const checkbox = subtask.completed ? '[x]' : '[ ]';
    markdown += `- ${checkbox} ${subtask.title}\n`;
    
    if (subtask.notes && subtask.notes.trim()) {
      markdown += `  - *${subtask.notes.trim()}*\n`;
    }
  });

  const completed = subtasks.filter(st => st.completed).length;
  const total = subtasks.length;
  const percentage = Math.round((completed / total) * 100);

  markdown += `\n**Progress: ${completed}/${total} complete (${percentage}%)**\n`;
  return markdown;
}

function extractMainDescription(issueBody) {
  if (!issueBody) return '';
  const subtaskMarker = '\n---\n\n## Subtasks';
  const markerIndex = issueBody.indexOf(subtaskMarker);
  
  if (markerIndex !== -1) {
    return issueBody.substring(0, markerIndex);
  }
  return issueBody;
}

function buildIssueBodyWithSubtasks(mainDescription, subtasks) {
  const cleanDescription = extractMainDescription(mainDescription || '');
  const subtaskSection = formatSubtasksForGitHub(subtasks);
  return cleanDescription + subtaskSection;
}

async function syncSubtasksToGitHub({ owner, repo, issueNumber, token, currentBody, subtasks }) {
  const newBody = buildIssueBodyWithSubtasks(currentBody, subtasks);

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}`,
    {
      method: 'PATCH',
      headers: {
        'Authorization': `token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ body: newBody })
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to sync subtasks to GitHub: ${error.message}`);
  }

  return await response.json();
}

// ==================== REACT COMPONENTS ====================

const { useState: useSubtaskState, useEffect: useSubtaskEffect, useRef } = React;

// SubtaskIndicator Component
function SubtaskIndicator({ subtasks, onClick, className = '' }) {
  if (!subtasks || subtasks.length === 0) return null;

  const progress = calculateSubtaskProgress(subtasks);
  
  const getProgressColor = () => {
    if (progress.percentage === 0) {
      return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400';
    } else if (progress.percentage === 100) {
      return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
    } else {
      return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400';
    }
  };

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`
        inline-flex items-center gap-2 px-2.5 py-1 rounded-lg text-sm font-medium
        hover:opacity-80 transition-opacity cursor-pointer
        ${getProgressColor()}
        ${className}
      `}
      title={`${progress.completed} of ${progress.total} subtasks complete (${progress.percentage}%)`}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" 
        />
      </svg>
      <span>{progress.completed}/{progress.total}</span>
      {progress.percentage > 0 && (
        <span className="text-xs">({progress.percentage}%)</span>
      )}
    </button>
  );
}

// SubtaskItem Component
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
  const [dragOver, setDragOver] = useSubtaskState(false);

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
        <div className="mt-1 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
          </svg>
        </div>

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

// SubtaskModal Component
function SubtaskModal({ isOpen, onClose, task, onUpdateSubtasks, onCompleteMainTask }) {
  const [subtasks, setSubtasks] = useSubtaskState(task?.subtasks || []);
  const [newSubtaskTitle, setNewSubtaskTitle] = useSubtaskState('');
  const [editingId, setEditingId] = useSubtaskState(null);
  const [editingTitle, setEditingTitle] = useSubtaskState('');
  const [editingNotes, setEditingNotes] = useSubtaskState('');
  const [showCompleted, setShowCompleted] = useSubtaskState(true);
  const inputRef = useRef(null);

  useSubtaskEffect(() => {
    if (task?.subtasks) {
      setSubtasks([...task.subtasks].sort((a, b) => a.order - b.order));
    }
  }, [task]);

  useSubtaskEffect(() => {
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

        {/* Footer */}
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

// ==================== CUSTOM HOOK ====================

function useSubtasks({ task, onUpdateTask, githubConfig = null }) {
  const [isModalOpen, setIsModalOpen] = useSubtaskState(false);
  const [isSyncing, setIsSyncing] = useSubtaskState(false);
  const [syncError, setSyncError] = useSubtaskState(null);

  const updateSubtasks = async (newSubtasks) => {
    const updatedTask = {
      ...task,
      subtasks: newSubtasks
    };

    onUpdateTask(updatedTask);

    if (githubConfig && githubConfig.enabled && task.githubIssueNumber) {
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
      }
    }
  };

  return {
    subtasks: task.subtasks || [],
    isModalOpen,
    isSyncing,
    syncError,
    openModal: () => setIsModalOpen(true),
    closeModal: () => setIsModalOpen(false),
    updateSubtasks
  };
}
