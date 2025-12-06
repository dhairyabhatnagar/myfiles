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
