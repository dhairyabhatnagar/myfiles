// ==================== TASK OPERATIONS ====================

const TaskOperations = {

    createTask(title, projects, themes) {
        const parsed = parseNaturalLanguage(title, projects, themes);
        return {
            id: Date.now(),
            title: parsed.title,
            priority: parsed.priority,
            completed: false,
            completedAt: null,
            project: parsed.project,
            themes: parsed.themes,
            tags: parsed.tags || [],  // NEW: include tags
            dueDate: parsed.dueDate,
            created: new Date().toISOString()
        };
    },

    createRecurringTask(title) {
        return {
            id: Date.now(),
            title: title,
            project: null,
            frequency: 'daily',
            completions: [],
            created: new Date().toISOString()
        };
    },

    toggleTaskCompletion(tasks, taskId) {
        return tasks.map(t => {
            if (t.id === taskId) {
                return {
                    ...t,
                    completed: !t.completed,
                    completedAt: !t.completed ? new Date().toISOString() : null
                };
            }
            return t;
        });
    },

    toggleRecurringCompletion(recurringTasks, taskId) {
        const today = new Date().toISOString().split('T')[0];
        return recurringTasks.map(t => {
            if (t.id === taskId) {
                const completions = t.completions || [];
                if (completions.includes(today)) {
                    return {...t, completions: completions.filter(d => d !== today)};
                } else {
                    return {...t, completions: [...completions, today]};
                }
            }
            return t;
        });
    },

    updateTask(tasks, taskId, updates) {
        return tasks.map(t => t.id === taskId ? {...t, ...updates} : t);
    },

    updateRecurringTask(recurringTasks, taskId, updates) {
        return recurringTasks.map(t => t.id === taskId ? {...t, ...updates} : t);
    },

    deleteTask(tasks, taskId) {
        return tasks.filter(t => t.id !== taskId);
    },

    deleteRecurringTask(recurringTasks, taskId) {
        return recurringTasks.filter(t => t.id !== taskId);
    },

    filterTasks(tasks, view, showCompleted, priorityFilter, projectFilter) {
        let filtered = showCompleted ? tasks : tasks.filter(t => !t.completed);
        
        if (priorityFilter !== 'all') {
            filtered = filtered.filter(t => t.priority === priorityFilter);
        }
        
        if (projectFilter !== 'all') {
            filtered = filtered.filter(t => t.project === projectFilter);
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        switch(view) {
            case 'today':
                filtered = filtered.filter(t => {
                    if (!t.dueDate) return false;
                    const taskDate = new Date(t.dueDate);
                    taskDate.setHours(0, 0, 0, 0);
                    return taskDate.getTime() === today.getTime();
                });
                break;
            case 'update-eta':
                filtered = filtered.filter(t => {
                    if (!t.dueDate) return true;
                    const taskDate = new Date(t.dueDate);
                    taskDate.setHours(0, 0, 0, 0);
                    return taskDate.getTime() < today.getTime();
                });
                break;
            case 'unassigned':
                filtered = filtered.filter(t => !t.project || !t.themes || t.themes.length === 0);
                break;
            case 'summary':
                const dueToday = tasks.filter(t => {
                    if (!t.dueDate) return false;
                    const taskDate = new Date(t.dueDate);
                    taskDate.setHours(0, 0, 0, 0);
                    return taskDate.getTime() === today.getTime();
                });
                filtered = dueToday.filter(t => {
                    if (!t.completed || !t.completedAt) return false;
                    const completedDate = new Date(t.completedAt);
                    completedDate.setHours(0, 0, 0, 0);
                    return completedDate.getTime() === today.getTime();
                });
                break;
        }

        return filtered;
    },

    filterRecurringTasks(recurringTasks, projectFilter) {
        if (projectFilter === 'all') return recurringTasks;
        return recurringTasks.filter(t => t.project === projectFilter);
    }
};
