// ==================== TAGS SYSTEM ====================
// Global tags for cross-cutting task organization
// Supports: #tag syntax, autocomplete, tag library management, filtering

const { useState: useTagState, useEffect: useTagEffect, useRef: useTagRef, useMemo } = React;

// ==================== TAG CONSTANTS ====================

const TAG_CONFIG = {
    MAX_TAGS_PER_TASK: 3,
    TAG_SYMBOL: '#',
    PROJECT_SYMBOL: '@',
    SUGGESTED_TAGS_COUNT: 3,
    DEFAULT_TAG_COLORS: [
        '#ef4444', // red
        '#f97316', // orange
        '#eab308', // yellow
        '#22c55e', // green
        '#3b82f6', // blue
        '#8b5cf6', // purple
        '#ec4899', // pink
        '#6b7280', // gray
    ]
};

// ==================== TAG UTILITIES ====================

/**
 * Generate a color for a new tag based on its name
 */
function generateTagColor(tagName) {
    let hash = 0;
    for (let i = 0; i < tagName.length; i++) {
        hash = tagName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % TAG_CONFIG.DEFAULT_TAG_COLORS.length;
    return TAG_CONFIG.DEFAULT_TAG_COLORS[index];
}

/**
 * Normalize tag name (lowercase, trim, remove special chars)
 */
function normalizeTagName(name) {
    return name.toLowerCase().trim().replace(/[^a-z0-9-_]/g, '');
}

/**
 * Build tag registry from tasks
 * Returns: { tagName: { color, taskCount } }
 */
function buildTagRegistry(tasks) {
    const registry = {};
    
    tasks.forEach(task => {
        const tags = task.tags || [];
        tags.forEach(tag => {
            const normalized = normalizeTagName(tag);
            if (!normalized) return;
            
            if (!registry[normalized]) {
                registry[normalized] = {
                    color: generateTagColor(normalized),
                    taskCount: 0
                };
            }
            registry[normalized].taskCount++;
        });
    });
    
    return registry;
}

/**
 * Get top N most used tags
 */
function getFrequentTags(tagRegistry, count = TAG_CONFIG.SUGGESTED_TAGS_COUNT) {
    return Object.entries(tagRegistry)
        .sort((a, b) => b[1].taskCount - a[1].taskCount)
        .slice(0, count)
        .map(([name, data]) => ({ name, ...data }));
}

/**
 * Search tags by prefix
 */
function searchTags(tagRegistry, query) {
    const normalized = normalizeTagName(query);
    if (!normalized) return [];
    
    return Object.entries(tagRegistry)
        .filter(([name]) => name.includes(normalized))
        .sort((a, b) => {
            // Prioritize starts-with matches
            const aStarts = a[0].startsWith(normalized);
            const bStarts = b[0].startsWith(normalized);
            if (aStarts && !bStarts) return -1;
            if (!aStarts && bStarts) return 1;
            return b[1].taskCount - a[1].taskCount;
        })
        .slice(0, 10)
        .map(([name, data]) => ({ name, ...data }));
}

/**
 * Count tasks that match active tag filters
 */
function countFilteredTasks(tasks, activeTagFilters) {
    if (!activeTagFilters || activeTagFilters.length === 0) {
        return tasks.length;
    }
    
    // OR logic: show tasks with ANY of the selected tags
    return tasks.filter(task => {
        const taskTags = (task.tags || []).map(normalizeTagName);
        return activeTagFilters.some(filter => taskTags.includes(normalizeTagName(filter)));
    }).length;
}

/**
 * Filter tasks by tags (OR logic)
 */
function filterTasksByTags(tasks, activeTagFilters) {
    if (!activeTagFilters || activeTagFilters.length === 0) {
        return tasks;
    }
    
    return tasks.filter(task => {
        const taskTags = (task.tags || []).map(normalizeTagName);
        return activeTagFilters.some(filter => taskTags.includes(normalizeTagName(filter)));
    });
}

/**
 * Rename a tag across all tasks
 * If newName already exists, merge (delete old tag, keep new)
 */
function renameTagInTasks(tasks, oldName, newName) {
    const normalizedOld = normalizeTagName(oldName);
    const normalizedNew = normalizeTagName(newName);
    
    if (!normalizedOld || !normalizedNew || normalizedOld === normalizedNew) {
        return tasks;
    }
    
    return tasks.map(task => {
        const tags = task.tags || [];
        if (!tags.map(normalizeTagName).includes(normalizedOld)) {
            return task;
        }
        
        // Remove old tag, add new if not already present
        const newTags = tags.filter(t => normalizeTagName(t) !== normalizedOld);
        if (!newTags.map(normalizeTagName).includes(normalizedNew)) {
            newTags.push(normalizedNew);
        }
        
        return { ...task, tags: newTags.slice(0, TAG_CONFIG.MAX_TAGS_PER_TASK) };
    });
}

/**
 * Delete a tag from all tasks
 */
function deleteTagFromTasks(tasks, tagName) {
    const normalized = normalizeTagName(tagName);
    
    return tasks.map(task => {
        const tags = task.tags || [];
        return {
            ...task,
            tags: tags.filter(t => normalizeTagName(t) !== normalized)
        };
    });
}

// ==================== TAG CHIP COMPONENT ====================

function TagChip({ tag, color, taskCount, onRemove, onClick, isActive, size = 'normal' }) {
    const sizeClasses = size === 'small' 
        ? 'text-xs px-2 py-0.5' 
        : 'text-sm px-3 py-1';
    
    return (
        <span
            onClick={onClick}
            className={`
                inline-flex items-center gap-1.5 rounded-full font-medium
                transition-all cursor-pointer
                ${sizeClasses}
                ${isActive 
                    ? 'bg-indigo-500 text-white' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }
            `}
            style={isActive ? {} : { borderLeft: `3px solid ${color}` }}
        >
            <span>#{tag}</span>
            {taskCount !== undefined && (
                <span className={`text-xs ${isActive ? 'text-indigo-200' : 'text-gray-500 dark:text-gray-400'}`}>
                    ({taskCount})
                </span>
            )}
            {onRemove && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove();
                    }}
                    className={`
                        ml-1 rounded-full w-4 h-4 flex items-center justify-center
                        hover:bg-black/20 transition-colors
                    `}
                >
                    ×
                </button>
            )}
        </span>
    );
}

// ==================== TAG INPUT WITH AUTOCOMPLETE ====================

function TagInput({ 
    value, 
    onChange, 
    tagRegistry, 
    existingTags = [],
    onAddTag,
    placeholder = "Add tag...",
    maxTags = TAG_CONFIG.MAX_TAGS_PER_TASK
}) {
    const [inputValue, setInputValue] = useTagState('');
    const [showSuggestions, setShowSuggestions] = useTagState(false);
    const [selectedIndex, setSelectedIndex] = useTagState(0);
    const inputRef = useTagRef(null);
    
    const canAddMore = existingTags.length < maxTags;
    
    const suggestions = useMemo(() => {
        if (!inputValue.trim()) return [];
        const results = searchTags(tagRegistry, inputValue);
        // Filter out already added tags
        return results.filter(t => !existingTags.map(normalizeTagName).includes(t.name));
    }, [inputValue, tagRegistry, existingTags]);
    
    const handleInputChange = (e) => {
        const val = e.target.value.replace(/^#/, ''); // Remove # if typed
        setInputValue(val);
        setShowSuggestions(true);
        setSelectedIndex(0);
    };
    
    const handleAddTag = (tagName) => {
        if (!canAddMore) return;
        
        const normalized = normalizeTagName(tagName);
        if (!normalized) return;
        if (existingTags.map(normalizeTagName).includes(normalized)) return;
        
        onAddTag(normalized);
        setInputValue('');
        setShowSuggestions(false);
        inputRef.current?.focus();
    };
    
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (suggestions.length > 0 && showSuggestions) {
                handleAddTag(suggestions[selectedIndex].name);
            } else if (inputValue.trim()) {
                handleAddTag(inputValue);
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => Math.max(prev - 1, 0));
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
        }
    };
    
    if (!canAddMore) {
        return (
            <span className="text-xs text-gray-500 dark:text-gray-400 italic">
                Max {maxTags} tags
            </span>
        );
    }
    
    return (
        <div className="relative">
            <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder={placeholder}
                className="w-full px-3 py-2 text-sm border rounded-lg
                         bg-white dark:bg-gray-800 
                         border-gray-300 dark:border-gray-600
                         focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            
            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 
                              bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 
                              rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                    {suggestions.map((tag, index) => (
                        <button
                            key={tag.name}
                            onClick={() => handleAddTag(tag.name)}
                            className={`
                                w-full px-3 py-2 text-left text-sm flex items-center justify-between
                                ${index === selectedIndex 
                                    ? 'bg-indigo-50 dark:bg-indigo-900/30' 
                                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                                }
                            `}
                        >
                            <span className="flex items-center gap-2">
                                <span 
                                    className="w-2 h-2 rounded-full" 
                                    style={{ backgroundColor: tag.color }}
                                />
                                #{tag.name}
                            </span>
                            <span className="text-xs text-gray-500">
                                {tag.taskCount} tasks
                            </span>
                        </button>
                    ))}
                </div>
            )}
            
            {showSuggestions && inputValue.trim() && suggestions.length === 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 
                              bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 
                              rounded-lg shadow-lg z-50 p-3">
                    <button
                        onClick={() => handleAddTag(inputValue)}
                        className="w-full text-left text-sm text-indigo-600 dark:text-indigo-400 
                                 hover:text-indigo-700 dark:hover:text-indigo-300"
                    >
                        + Create new tag "#{normalizeTagName(inputValue)}"
                    </button>
                </div>
            )}
        </div>
    );
}

// ==================== TAG FILTER POPOVER ====================

function TagFilterPopover({ 
    isOpen, 
    onClose, 
    tagRegistry, 
    activeFilters, 
    onToggleFilter, 
    onClearFilters,
    totalTaskCount,
    filteredTaskCount 
}) {
    const [searchQuery, setSearchQuery] = useTagState('');
    const inputRef = useTagRef(null);
    
    useTagEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);
    
    useTagEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen, onClose]);
    
    if (!isOpen) return null;
    
    const frequentTags = getFrequentTags(tagRegistry);
    const searchResults = searchQuery.trim() 
        ? searchTags(tagRegistry, searchQuery)
        : [];
    
    const displayTags = searchQuery.trim() ? searchResults : frequentTags;
    
    return (
        <>
            {/* Backdrop */}
            <div 
                className="fixed inset-0 z-40" 
                onClick={onClose}
            />
            
            {/* Popover */}
            <div className="absolute top-full right-0 mt-2 w-72 
                          bg-white dark:bg-gray-800 
                          border border-gray-200 dark:border-gray-700 
                          rounded-xl shadow-xl z-50">
                {/* Header */}
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900 dark:text-white">
                            Filter by tags
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 
                                       bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                            Press F
                        </span>
                    </div>
                    
                    {/* Search input */}
                    <input
                        ref={inputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search tags..."
                        className="w-full px-3 py-2 text-sm border rounded-lg
                                 bg-gray-50 dark:bg-gray-900 
                                 border-gray-200 dark:border-gray-600
                                 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>
                
                {/* Active filters */}
                {activeFilters.length > 0 && (
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                Active filters:
                            </span>
                            <button
                                onClick={onClearFilters}
                                className="text-xs text-indigo-600 dark:text-indigo-400 
                                         hover:text-indigo-700 dark:hover:text-indigo-300"
                            >
                                Clear all
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-1">
                            {activeFilters.map(tag => (
                                <TagChip
                                    key={tag}
                                    tag={tag}
                                    color={tagRegistry[tag]?.color || '#6b7280'}
                                    isActive={true}
                                    size="small"
                                    onRemove={() => onToggleFilter(tag)}
                                />
                            ))}
                        </div>
                    </div>
                )}
                
                {/* Tag list */}
                <div className="px-4 py-3 max-h-48 overflow-y-auto">
                    {!searchQuery.trim() && (
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                            {frequentTags.length > 0 ? 'Frequently used:' : 'No tags yet'}
                        </div>
                    )}
                    
                    {displayTags.length > 0 ? (
                        <div className="space-y-1">
                            {displayTags.map(tag => {
                                const isActive = activeFilters.includes(tag.name);
                                return (
                                    <button
                                        key={tag.name}
                                        onClick={() => onToggleFilter(tag.name)}
                                        className={`
                                            w-full px-3 py-2 rounded-lg text-left text-sm
                                            flex items-center justify-between
                                            transition-colors
                                            ${isActive 
                                                ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' 
                                                : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                                            }
                                        `}
                                    >
                                        <span className="flex items-center gap-2">
                                            <span 
                                                className="w-2 h-2 rounded-full" 
                                                style={{ backgroundColor: tag.color }}
                                            />
                                            #{tag.name}
                                        </span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            {tag.taskCount} tasks
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    ) : searchQuery.trim() ? (
                        <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                            No tags found matching "{searchQuery}"
                        </div>
                    ) : null}
                </div>
                
                {/* Footer with result count */}
                <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 
                              text-xs text-gray-500 dark:text-gray-400">
                    Showing {filteredTaskCount} of {totalTaskCount} tasks
                </div>
            </div>
        </>
    );
}

// ==================== TAG FILTER BUTTON ====================

function TagFilterButton({ 
    tagRegistry, 
    activeFilters, 
    onToggleFilter, 
    onClearFilters,
    totalTaskCount,
    filteredTaskCount 
}) {
    const [isOpen, setIsOpen] = useTagState(false);
    
    // Keyboard shortcut: F to open filter
    useTagEffect(() => {
        const handleKeyDown = (e) => {
            // Don't trigger if typing in an input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            
            if (e.key === 'f' || e.key === 'F') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
        };
        
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);
    
    const hasActiveFilters = activeFilters.length > 0;
    
    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    px-3 py-2 rounded-lg text-sm font-medium
                    flex items-center gap-2 transition-colors
                    ${hasActiveFilters 
                        ? 'bg-indigo-500 text-white' 
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }
                `}
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                {hasActiveFilters && (
                    <span className="bg-white/20 px-1.5 py-0.5 rounded text-xs">
                        {activeFilters.length}
                    </span>
                )}
            </button>
            
            <TagFilterPopover
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                tagRegistry={tagRegistry}
                activeFilters={activeFilters}
                onToggleFilter={onToggleFilter}
                onClearFilters={onClearFilters}
                totalTaskCount={totalTaskCount}
                filteredTaskCount={filteredTaskCount}
            />
        </div>
    );
}

// ==================== TAG LIBRARY MODAL ====================

function TagLibraryModal({ 
    isOpen, 
    onClose, 
    tagRegistry, 
    onRenameTag, 
    onDeleteTag 
}) {
    const [editingTag, setEditingTag] = useTagState(null);
    const [newName, setNewName] = useTagState('');
    const [deleteConfirm, setDeleteConfirm] = useTagState(null);
    
    if (!isOpen) return null;
    
    const sortedTags = Object.entries(tagRegistry)
        .sort((a, b) => b[1].taskCount - a[1].taskCount);
    
    const handleStartRename = (tagName) => {
        setEditingTag(tagName);
        setNewName(tagName);
    };
    
    const handleSaveRename = () => {
        if (editingTag && newName.trim()) {
            const normalized = normalizeTagName(newName);
            if (normalized && normalized !== editingTag) {
                const willMerge = tagRegistry[normalized] !== undefined;
                if (willMerge) {
                    if (confirm(`Tag "#${normalized}" already exists. Merge "${editingTag}" into "${normalized}"?`)) {
                        onRenameTag(editingTag, normalized);
                    }
                } else {
                    onRenameTag(editingTag, normalized);
                }
            }
        }
        setEditingTag(null);
        setNewName('');
    };
    
    const handleDelete = (tagName) => {
        setDeleteConfirm(tagName);
    };
    
    const confirmDelete = () => {
        if (deleteConfirm) {
            onDeleteTag(deleteConfirm);
            setDeleteConfirm(null);
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        🏷️ Tag Library
                    </h2>
                    <button 
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-2xl"
                    >
                        ×
                    </button>
                </div>
                
                {/* Tag list */}
                <div className="flex-1 overflow-y-auto p-4">
                    {sortedTags.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            <p className="text-4xl mb-2">🏷️</p>
                            <p>No tags created yet</p>
                            <p className="text-sm mt-1">Tags are auto-created when you add them to tasks</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {sortedTags.map(([tagName, data]) => (
                                <div 
                                    key={tagName}
                                    className="flex items-center justify-between p-3 
                                             bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                                >
                                    {editingTag === tagName ? (
                                        <div className="flex-1 flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={newName}
                                                onChange={(e) => setNewName(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleSaveRename();
                                                    if (e.key === 'Escape') {
                                                        setEditingTag(null);
                                                        setNewName('');
                                                    }
                                                }}
                                                className="flex-1 px-2 py-1 text-sm border rounded
                                                         bg-white dark:bg-gray-800"
                                                autoFocus
                                            />
                                            <button
                                                onClick={handleSaveRename}
                                                className="px-2 py-1 text-xs bg-indigo-500 text-white rounded"
                                            >
                                                Save
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setEditingTag(null);
                                                    setNewName('');
                                                }}
                                                className="px-2 py-1 text-xs bg-gray-300 dark:bg-gray-600 rounded"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-center gap-3">
                                                <span 
                                                    className="w-3 h-3 rounded-full" 
                                                    style={{ backgroundColor: data.color }}
                                                />
                                                <span className="font-medium text-gray-900 dark:text-white">
                                                    #{tagName}
                                                </span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    {data.taskCount} tasks
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => handleStartRename(tagName)}
                                                    className="p-1.5 text-gray-500 hover:text-gray-700 
                                                             dark:hover:text-gray-300 hover:bg-gray-200 
                                                             dark:hover:bg-gray-600 rounded"
                                                    title="Rename tag"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(tagName)}
                                                    className="p-1.5 text-red-500 hover:text-red-700 
                                                             hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                                    title="Delete tag"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                
                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        💡 Tip: Rename a tag to an existing tag name to merge them
                    </p>
                </div>
            </div>
            
            {/* Delete confirmation */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-sm w-full shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full 
                                          flex items-center justify-center text-xl">
                                ⚠️
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                Delete tag?
                            </h3>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            Remove <strong>#{deleteConfirm}</strong> from all tasks? 
                            This cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg font-medium"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ==================== TASK TAG EDITOR ====================

function TaskTagEditor({ 
    task, 
    tagRegistry, 
    onUpdateTags,
    isEditing,
    onStartEdit,
    onStopEdit
}) {
    const tags = task.tags || [];
    
    const handleAddTag = (tagName) => {
        const newTags = [...tags, tagName].slice(0, TAG_CONFIG.MAX_TAGS_PER_TASK);
        onUpdateTags(newTags);
    };
    
    const handleRemoveTag = (tagName) => {
        const newTags = tags.filter(t => normalizeTagName(t) !== normalizeTagName(tagName));
        onUpdateTags(newTags);
    };
    
    if (isEditing) {
        return (
            <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="text-xs font-semibold mb-2 text-gray-600 dark:text-gray-400">
                    Tags ({tags.length}/{TAG_CONFIG.MAX_TAGS_PER_TASK}):
                </div>
                
                {/* Existing tags */}
                <div className="flex flex-wrap gap-1 mb-2">
                    {tags.map(tag => (
                        <TagChip
                            key={tag}
                            tag={tag}
                            color={tagRegistry[tag]?.color || generateTagColor(tag)}
                            size="small"
                            onRemove={() => handleRemoveTag(tag)}
                        />
                    ))}
                </div>
                
                {/* Add new tag input */}
                <TagInput
                    tagRegistry={tagRegistry}
                    existingTags={tags}
                    onAddTag={handleAddTag}
                    placeholder="Type to add tag..."
                />
                
                <button
                    onClick={onStopEdit}
                    className="mt-2 text-xs px-3 py-1 bg-gray-200 dark:bg-gray-600 rounded"
                >
                    Done
                </button>
            </div>
        );
    }
    
    return (
        <div className="flex flex-wrap items-center gap-1 mt-1">
            {tags.map(tag => (
                <TagChip
                    key={tag}
                    tag={tag}
                    color={tagRegistry[tag]?.color || generateTagColor(tag)}
                    size="small"
                />
            ))}
            <button
                onClick={onStartEdit}
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-indigo-600 
                         dark:hover:text-indigo-400"
            >
                {tags.length === 0 ? '+ tags' : 'edit'}
            </button>
        </div>
    );
}

// ==================== EXPORTS ====================
// All functions and components are available globally
