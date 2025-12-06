// ==================== COMPLETE SUBTASKS FUNCTIONALITY ====================
// Minimal, distraction-free page view for deep focus

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

// SubtaskItem Component - MINIMAL VERSION
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
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border-2 border-blue-500">
        <input
          type="text"
          value={editingTitle}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Subtask title"
          className="w-full px-4 py-3 mb-3 border-0 rounded-lg
                   bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-lg
                   focus:ring-2 focus:ring-blue-500"
          autoFocus
        />
        <textarea
          value={editingNotes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Optional notes..."
          className="w-full px-4 py-3 mb-3 border-0 rounded-lg
                   bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none
                   focus:ring-2 focus:ring-blue-500"
          rows={2}
        />
        <div className="flex gap-2">
          <button
            onClick={onSaveEdit}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium"
          >
            Save
          </button>
          <button
            onClick={onCancelEdit}
            className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500"
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
        group p-5 rounded-xl border-2 transition-all cursor-move
        ${subtask.completed 
          ? 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 opacity-60' 
          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md'}
        ${dragOver ? 'border-blue-500 scale-105' : ''}
      `}
    >
      <div className="flex items-start gap-4">
        <button
          onClick={() => onToggleComplete(subtask.id)}
          className="mt-1 flex-shrink-0"
        >
          {subtask.completed ? (
            <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-6 h-6 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 20 20">
              <circle cx="10" cy="10" r="8" strokeWidth="2" />
            </svg>
          )}
        </button>

        <div className="flex-1 min-w-0">
          <p className={`text-lg text-gray-900 dark:text-white ${subtask.completed ? 'line-through' : ''}`}>
            {subtask.title}
          </p>
          {subtask.notes && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 italic">
              {subtask.notes}
            </p>
          )}
        </div>

        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onStartEdit(subtask)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Edit"
          >
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(subtask.id)}
            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg transition-colors"
            title="Delete"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// SubtaskPageView Component - MINIMAL DISTRACTION-FREE VERSION
function SubtaskPageView({ task, onClose, onUpdateSubtasks }) {
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
    if (inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, []);

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

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddSubtask();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  // ========== SWIPE GESTURE FOR CLOSING ==========
  const [touchStart, setTouchStart] = useSubtaskState(null);
  const [touchEnd, setTouchEnd] = useSubtaskState(null);

  const minSwipeDistance = 50;

  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    
    if (isLeftSwipe) {
      onClose();
    }
    
    setTouchStart(null);
    setTouchEnd(null);
  };

  const visibleSubtasks = showCompleted 
    ? subtasks 
    : subtasks.filter(st => !st.completed);

  // MINIMAL DISTRACTION-FREE PAGE
  return (
    <div 
      className="fixed inset-0 bg-white dark:bg-gray-900 overflow-hidden z-50"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="h-full flex flex-col max-w-4xl mx-auto">
        {/* MINIMAL HEADER */}
        <div className="flex-shrink-0 px-6 py-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              title="Back to tasks"
            >
              <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {task?.title}
              </h1>
            </div>
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {progress.completed}/{progress.total}
            </div>
          </div>
        </div>

        {/* SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {/* ADD NEW SUBTASK */}
          <div className="mb-8">
            <div className="flex gap-3">
              <input
                ref={inputRef}
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Add a new subtask..."
                className="flex-1 px-5 py-4 text-lg border-2 border-gray-300 dark:border-gray-700 rounded-xl 
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
              <button
                onClick={handleAddSubtask}
                disabled={!newSubtaskTitle.trim()}
                className="px-8 py-4 bg-blue-500 text-white text-lg rounded-xl hover:bg-blue-600 
                         disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium
                         shadow-sm hover:shadow-md"
              >
                Add
              </button>
            </div>
          </div>

          {/* SUBTASKS LIST */}
          <div className="space-y-3">
            {visibleSubtasks.length === 0 ? (
              <div className="py-20 text-center text-gray-400 dark:text-gray-600">
                <p className="text-6xl mb-4">📝</p>
                <p className="text-lg">No subtasks yet</p>
                <p className="text-sm mt-2">Add your first subtask above to get started</p>
              </div>
            ) : (
              visibleSubtasks.map((subtask, index) => (
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
              ))
            )}
          </div>
        </div>

        {/* MINIMAL FOOTER */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200 dark:border-gray-800">
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
            <input
              type="checkbox"
              checked={showCompleted}
              onChange={(e) => setShowCompleted(e.target.checked)}
              className="rounded"
            />
            Show completed subtasks
          </label>
        </div>
      </div>
    </div>
  );
}

// ==================== CUSTOM HOOK ====================

function useSubtasks({ task, onUpdateTask, githubConfig = null }) {
  const [isPageOpen, setIsPageOpen] = useSubtaskState(false);
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
    isPageOpen,
    isSyncing,
    syncError,
    openPage: () => setIsPageOpen(true),
    closePage: () => setIsPageOpen(false),
    updateSubtasks
  };
}
