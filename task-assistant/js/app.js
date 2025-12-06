// ==================== MAIN APP - NO POINTS IN TASKS ====================
// Gamification only for Recurring Tasks


const { useState, useEffect } = React;

function App() {
    // ========== STATE ==========
    const [tasks, setTasks] = useState([]);
    const [recurringTasks, setRecurringTasks] = useState([]);
    const [projects, setProjects] = useState(CONFIG.DEFAULT_PROJECTS);
    const [themes, setThemes] = useState(CONFIG.DEFAULT_THEMES);
    const [input, setInput] = useState('');
    const [view, setView] = useState('all');
    const [mainView, setMainView] = useState('tasks');
    const [showCompleted, setShowCompleted] = useState(false);
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [projectFilter, setProjectFilter] = useState('all');
    const [recurringProjectFilter, setRecurringProjectFilter] = useState('all');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [expandedProjects, setExpandedProjects] = useState({});
    const [editingProject, setEditingProject] = useState(null);
    const [editingThemes, setEditingThemes] = useState(null);
    const [editingPriority, setEditingPriority] = useState(null);
    const [editingDate, setEditingDate] = useState(null);
    const [newTheme, setNewTheme] = useState('');
    const [addingThemeTo, setAddingThemeTo] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [githubToken, setGithubToken] = useState('');
    const [showTokenInput, setShowTokenInput] = useState(false);
    const [syncStatus, setSyncStatus] = useState('');
    const [fileSha, setFileSha] = useState('');
    const [darkMode, setDarkMode] = useState(false);
    const [celebrateTask, setCelebrateTask] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // ========== INITIALIZATION ==========
    useEffect(() => {
        try {
            const savedToken = GitHubSync.getToken();
            const savedDarkMode = localStorage.getItem('darkMode') === 'true';
        
            setDarkMode(savedDarkMode);
            if (savedDarkMode) document.documentElement.classList.add('dark');
        
            if (savedToken) {
                setGithubToken(savedToken);
                loadData(savedToken);
            } else {
                setShowTokenInput(true);
                setIsLoading(false);
            }
        } catch (error) {
            console.error('Initialization error:', error);
            setShowTokenInput(true);
            setIsLoading(false);
        }
    }, []);

    // ========== DARK MODE ==========
    const toggleDarkMode = () => {
        const newMode = !darkMode;
        setDarkMode(newMode);
        localStorage.setItem('darkMode', newMode);
        if (newMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    // ========== GITHUB SYNC ==========
    const loadData = (token) => {
        setSyncStatus('syncing');
        GitHubSync.load(
            token,
            (data) => {
                setTasks(data.tasks);
                setRecurringTasks(data.recurringTasks);
                setProjects(data.projects);
                setThemes(data.themes);
                setFileSha(data.sha);
                setSyncStatus('success');
                setIsLoading(false);
                setTimeout(() => setSyncStatus(''), 2000);
            },
            (error) => {
                setSyncStatus('error');
                setIsLoading(false);
                setTimeout(() => setSyncStatus(''), 3000);
            }
        );
    };

    const saveData = (newTasks, newRecurring, newProjects, newThemes) => {
        if (!githubToken) return;
        
        setSyncStatus('syncing');
        GitHubSync.save(
            githubToken,
            fileSha,
            newTasks || tasks,
            newRecurring || recurringTasks,
            newProjects || projects,
            newThemes || themes,
            (newSha) => {
                setFileSha(newSha);
                setSyncStatus('success');
                setTimeout(() => setSyncStatus(''), 2000);
            },
            (error) => {
                setSyncStatus('error');
                setTimeout(() => setSyncStatus(''), 3000);
            }
        );
    };

    const saveToken = (token) => {
        GitHubSync.saveToken(token);
        setGithubToken(token);
        setShowTokenInput(false);
        loadData(token);
    };

    // ========== TASK OPERATIONS ==========
    const addTask = () => {
        if (!input.trim()) return;
        const task = TaskOperations.createTask(input, projects, themes);
        // Add subtasks field to new tasks
        task.subtasks = [];
        const newTasks = [...tasks, task];
        setTasks(newTasks);
        saveData(newTasks, null, null, null);
        setInput('');
    };

    const addRecurringTask = () => {
        if (!input.trim()) return;
        const task = TaskOperations.createRecurringTask(input);
        const newRecurring = [...recurringTasks, task];
        setRecurringTasks(newRecurring);
        saveData(null, newRecurring, null, null);
        setInput('');
    };

    const toggleComplete = (id) => {
        const task = tasks.find(t => t.id === id);
        if (task && !task.completed) {
            setCelebrateTask(id);
            setTimeout(() => setCelebrateTask(null), 300);
        }
        const newTasks = TaskOperations.toggleTaskCompletion(tasks, id);
        setTasks(newTasks);
        saveData(newTasks, null, null, null);
    };

    const toggleRecurringComplete = (id) => {
        const newRecurring = TaskOperations.toggleRecurringCompletion(recurringTasks, id);
        setRecurringTasks(newRecurring);
        saveData(null, newRecurring, null, null);
    };

    const deleteTask = (id) => {
        if (!confirm('Delete this task?')) return;
        const newTasks = TaskOperations.deleteTask(tasks, id);
        setTasks(newTasks);
        saveData(newTasks, null, null, null);
    };

    const deleteRecurringTask = (id) => {
        if (!confirm('Delete this recurring task?')) return;
        const newRecurring = TaskOperations.deleteRecurringTask(recurringTasks, id);
        setRecurringTasks(newRecurring);
        saveData(null, newRecurring, null, null);
    };

    const updateTask = (id, updates) => {
        const newTasks = TaskOperations.updateTask(tasks, id, updates);
        setTasks(newTasks);
        saveData(newTasks, null, null, null);
    };

    const updateRecurringTask = (id, updates) => {
        const newRecurring = TaskOperations.updateRecurringTask(recurringTasks, id, updates);
        setRecurringTasks(newRecurring);
        saveData(null, newRecurring, null, null);
    };

    // ========== SUBTASK OPERATIONS ==========
    const handleUpdateTaskWithSubtasks = (updatedTask) => {
        const newTasks = tasks.map(t => t.id === updatedTask.id ? updatedTask : t);
        setTasks(newTasks);
        saveData(newTasks, null, null, null);
    };

    // GitHub config for subtask sync
    const githubConfig = {
        enabled: true,
        owner: CONFIG.GITHUB_USERNAME,
        repo: CONFIG.GITHUB_REPO,
        token: githubToken
    };

    // ========== PROJECT/THEME OPERATIONS ==========
    const addProject = (name) => {
        if (!name || projects.includes(name)) return;
        const newProjects = [...projects, name];
        const newThemes = {...themes, [name]: []};
        setProjects(newProjects);
        setThemes(newThemes);
        saveData(null, null, newProjects, newThemes);
    };

    const deleteProject = (proj) => {
        setDeleteConfirm({
            type: 'project',
            name: proj,
            action: () => {
                const newProjects = projects.filter(p => p !== proj);
                const newThemes = {...themes};
                delete newThemes[proj];
                const newTasks = tasks.map(t => t.project === proj ? {...t, project: null, themes: []} : t);
                const newRecurring = recurringTasks.map(t => t.project === proj ? {...t, project: null} : t);
                
                setProjects(newProjects);
                setThemes(newThemes);
                setTasks(newTasks);
                setRecurringTasks(newRecurring);
                saveData(newTasks, newRecurring, newProjects, newThemes);
                setDeleteConfirm(null);
            }
        });
    };

    const deleteTheme = (proj, theme) => {
        setDeleteConfirm({
            type: 'theme',
            name: theme,
            action: () => {
                const newThemes = {...themes};
                newThemes[proj] = newThemes[proj].filter(t => t !== theme);
                const newTasks = tasks.map(t => ({...t, themes: (t.themes || []).filter(th => th !== theme)}));
                
                setThemes(newThemes);
                setTasks(newTasks);
                saveData(newTasks, null, null, newThemes);
                setDeleteConfirm(null);
            }
        });
    };

    const addThemeToProject = (proj, theme) => {
        if (!theme.trim()) return;
        const newThemes = {...themes};
        if (!newThemes[proj]) newThemes[proj] = [];
        if (!newThemes[proj].includes(theme)) {
            newThemes[proj] = [...newThemes[proj], theme];
            setThemes(newThemes);
            saveData(null, null, null, newThemes);
        }
        setNewTheme('');
        setAddingThemeTo(null);
    };

    // ========== VOICE INPUT ==========
    const startVoice = () => {
        try {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognition) {
                alert('Voice input not supported. Use Chrome, Edge, or Safari.');
                return;
            }
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = 'en-US';
            
            recognition.onstart = () => setIsRecording(true);
            recognition.onresult = (e) => {
                setInput(e.results[0][0].transcript);
                setIsRecording(false);
            };
            recognition.onerror = () => setIsRecording(false);
            recognition.onend = () => setIsRecording(false);
            recognition.start();
        } catch (err) {
            alert('Voice input failed: ' + err.message);
            setIsRecording(false);
        }
    };

    // ========== COMPUTED VALUES ==========
    const recurringStats = calculateRecurringStats(recurringTasks);
    const filtered = TaskOperations.filterTasks(tasks, view, showCompleted, priorityFilter, projectFilter);
    const recurringFiltered = TaskOperations.filterRecurringTasks(recurringTasks, recurringProjectFilter);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    // ========== LOADING SCREEN ==========
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4">⏳</div>
                    <div className="text-xl font-semibold text-gray-700">Loading...</div>
                </div>
            </div>
        );
    }

    // ========== TOKEN INPUT SCREEN ==========
    if (showTokenInput) {
        return (
            <div className={`min-h-screen ${darkMode ? 'dark bg-gradient' : 'bg-gradient-to-br from-blue-50 to-indigo-100'} flex items-center justify-center p-4`}>
                <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
                    <h1 className="text-2xl font-bold mb-4">🔐 GitHub Setup</h1>
                    <p className="text-gray-600 mb-4">
                        Enter your GitHub Personal Access Token to enable cross-device syncing.
                    </p>
                    <input
                        type="password"
                        placeholder="ghp_xxxxxxxxxxxx"
                        className="w-full px-4 py-3 border rounded-lg mb-4"
                        onKeyPress={(e) => {
                            if (e.key === 'Enter' && e.target.value.trim()) {
                                saveToken(e.target.value.trim());
                            }
                        }}
                    />
                    <button
                        onClick={(e) => {
                            const input = e.target.previousElementSibling;
                            if (input.value.trim()) saveToken(input.value.trim());
                        }}
                        className="w-full px-4 py-3 bg-indigo-500 text-white rounded-lg font-medium">
                        Connect to GitHub
                    </button>
                    <div className="mt-4 p-3 bg-yellow-50 rounded-lg text-sm">
                        <p className="font-semibold mb-1">⚠️ First time setup:</p>
                        <p className="text-gray-600">Make sure you've:</p>
                        <ol className="list-decimal ml-4 mt-2 space-y-1 text-gray-600">
                            <li>Updated GITHUB_USERNAME in config.js</li>
                            <li>Created task-data.json in your repo</li>
                            <li>Generated a GitHub token with 'repo' access</li>
                        </ol>
                    </div>
                </div>
            </div>
        );
    }

    // ========== MAIN APP UI ==========
    return (
        <div className={`min-h-screen ${darkMode ? 'dark bg-gradient' : 'bg-gradient-to-br from-blue-50 to-indigo-100'}`}>
            {/* Sync Status */}
            {syncStatus && (
                <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg ${
                    syncStatus === 'syncing' ? 'bg-blue-500 text-white' :
                    syncStatus === 'success' ? 'bg-green-500 text-white' :
                    'bg-red-500 text-white'
                }`}>
                    {syncStatus === 'syncing' && '🔄 Syncing...'}
                    {syncStatus === 'success' && '✓ Synced!'}
                    {syncStatus === 'error' && '✗ Sync failed'}
                </div>
            )}

            {/* Recurring Tasks Gamification Score Bar - Only show when on recurring tab */}
            {mainView === 'recurring' && recurringTasks.length > 0 && (
                <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-40 bg-white rounded-full px-6 py-3 shadow-lg flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">🏆</span>
                        <div>
                            <div className="text-xs text-gray-600">Habits Score</div>
                            <div className="font-bold">{recurringStats.totalScore} / {recurringStats.maxScore}</div>
                        </div>
                    </div>
                    <div className="w-32 h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                            className={`h-full transition-all duration-500 ${
                                recurringStats.percentage >= 100 ? 'bg-green-500' :
                                recurringStats.percentage >= 60 ? 'bg-yellow-500' :
                                'bg-red-500'
                            }`}
                            style={{width: `${Math.min(recurringStats.percentage, 100)}%`}}
                        ></div>
                    </div>
                    <span className={`font-bold text-lg ${
                        recurringStats.percentage >= 100 ? 'text-green-600' :
                        recurringStats.percentage >= 60 ? 'text-yellow-600' :
                        'text-red-600'
                    }`}>
                        {recurringStats.percentage}%
                    </span>
                </div>
            )}

            {/* Delete Confirm Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-2xl">⚠️</div>
                            <h2 className="text-xl font-bold">Delete {deleteConfirm.type}?</h2>
                        </div>
                        <p className="text-gray-600 mb-4">
                            Are you sure you want to delete <strong>"{deleteConfirm.name}"</strong>?
                            {deleteConfirm.type === 'project' && ' All tasks in this project will be unassigned.'}
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-3 bg-gray-200 rounded-lg font-medium">
                                Cancel
                            </button>
                            <button onClick={deleteConfirm.action} className="flex-1 px-4 py-3 bg-red-500 text-white rounded-lg font-medium">
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-2xl transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} overflow-y-auto`}>
                <div className="p-4">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold">Settings</h2>
                        <button onClick={() => setSidebarOpen(false)} className="text-2xl">×</button>
                    </div>

                    <div className="mb-4 p-3 bg-green-50 rounded-lg">
                        <div className="text-sm font-semibold text-green-700 mb-1">☁️ GitHub Sync Active</div>
                        <div className="text-xs text-green-600">Tasks sync across devices</div>
                        <button 
                            onClick={() => {
                                if (confirm('Remove GitHub token?')) {
                                    GitHubSync.removeToken();
                                    setGithubToken('');
                                    setShowTokenInput(true);
                                }
                            }}
                            className="mt-2 text-xs text-red-600">
                            Disconnect
                        </button>
                    </div>

                    <div className="mb-4 p-3 bg-indigo-50 rounded-lg flex items-center justify-between">
                        <div>
                            <div className="text-sm font-semibold text-indigo-700">🌙 Dark Mode</div>
                            <div className="text-xs text-indigo-600">Toggle theme</div>
                        </div>
                        <button 
                            onClick={toggleDarkMode}
                            className={`w-12 h-6 rounded-full transition-colors ${darkMode ? 'bg-indigo-500' : 'bg-gray-300'} relative`}>
                            <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${darkMode ? 'translate-x-6' : 'translate-x-0.5'}`}></div>
                        </button>
                    </div>

                    <button 
                        onClick={() => loadData(githubToken)} 
                        className="w-full px-4 py-2 mb-4 bg-indigo-500 text-white rounded-lg">
                        🔄 Refresh from GitHub
                    </button>

                    <h3 className="font-bold mb-2">Projects & Themes</h3>

                    <div className="space-y-2">
                        {projects.map(proj => (
                            <div key={proj} className="border rounded-lg">
                                <div className="flex items-center p-3 gap-2">
                                    <button onClick={() => setExpandedProjects({...expandedProjects, [proj]: !expandedProjects[proj]})}>
                                        {expandedProjects[proj] ? '▼' : '▶'}
                                    </button>
                                    <span className="flex-1 font-medium">📁 {proj}</span>
                                    <button onClick={() => deleteProject(proj)} className="text-red-500 text-sm">🗑️</button>
                                </div>
                                {expandedProjects[proj] && (
                                    <div className="px-3 pb-3">
                                        <div className="text-xs font-semibold mb-1">Themes:</div>
                                        {(themes[proj] || []).map(t => (
                                            <div key={t} className="flex items-center justify-between pl-4 text-sm py-1">
                                                <span>🏷️ {t}</span>
                                                <button onClick={() => deleteTheme(proj, t)} className="text-red-500 text-xs">🗑️</button>
                                            </div>
                                        ))}
                                        {addingThemeTo === proj ? (
                                            <div className="flex gap-1 mt-2 pl-4">
                                                <input
                                                    value={newTheme}
                                                    onChange={(e) => setNewTheme(e.target.value)}
                                                    onKeyPress={(e) => e.key === 'Enter' && addThemeToProject(proj, newTheme)}
                                                    placeholder="Theme..."
                                                    className="flex-1 px-2 py-1 text-xs border rounded"
                                                />
                                                <button onClick={() => addThemeToProject(proj, newTheme)} className="px-2 py-1 bg-indigo-500 text-white rounded text-xs">
                                                    Add
                                                </button>
                                            </div>
                                        ) : (
                                            <button onClick={() => setAddingThemeTo(proj)} className="pl-4 mt-1 text-xs text-indigo-600">
                                                + Add theme
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 pt-4 border-t">
                        <input
                            placeholder="New project..."
                            className="w-full px-3 py-2 border rounded-lg text-sm"
                            onKeyPress={(e) => {
                                if (e.key === 'Enter' && e.target.value.trim()) {
                                    addProject(e.target.value.trim());
                                    e.target.value = '';
                                }
                            }}
                        />
                        <p className="text-xs text-gray-500 mt-1">Press Enter to add</p>
                    </div>

                    <div className="mt-4 pt-4 border-t">
                        <h3 className="font-bold mb-2">💡 Quick Tips</h3>
                        <div className="text-xs text-gray-600 space-y-2">
                            <p><strong>Natural Language:</strong></p>
                            <p>• "Buy milk tomorrow #Personal"</p>
                            <p>• "Meeting p0 12/25 #Work"</p>
                            <p>• "Exercise today @Fitness"</p>
                            <p className="mt-2"><strong>Subtasks:</strong> Double-click task</p>
                            <p><strong>Project:</strong> Use #ProjectName</p>
                            <p><strong>Theme:</strong> Use @ThemeName</p>
                        </div>
                    </div>
                </div>
            </div>

            {sidebarOpen && <div className="fixed inset-0 bg-black bg-opacity-30 z-40" onClick={() => setSidebarOpen(false)} />}

            {/* Main Content */}
            <div className={`p-4 max-w-4xl mx-auto ${mainView === 'recurring' && recurringTasks.length > 0 ? 'pt-24' : 'pt-8'}`}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setSidebarOpen(true)} className="px-3 py-2 bg-white rounded-lg shadow">☰</button>
                        <h1 className="text-2xl font-bold text-gray-800">Tasks</h1>
                    </div>
                </div>

                <div className="flex gap-2 mb-4">
                    <button
                        onClick={() => setMainView('tasks')}
                        className={`flex-1 px-4 py-3 rounded-lg font-medium ${mainView === 'tasks' ? 'bg-indigo-500 text-white' : 'bg-white'}`}>
                        📋 Tasks
                    </button>
                    <button
                        onClick={() => setMainView('recurring')}
                        className={`flex-1 px-4 py-3 rounded-lg font-medium ${mainView === 'recurring' ? 'bg-indigo-500 text-white' : 'bg-white'}`}>
                        🔄 Recurring
                    </button>
                </div>

                {mainView === 'tasks' ? (
                    <>
                        <div className="flex gap-2 mb-4">
                            <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} 
                                className="px-3 py-2 bg-white rounded-lg border text-sm">
                                <option value="all">All Projects</option>
                                {projects.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                            <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} 
                                className="px-3 py-2 bg-white rounded-lg border text-sm">
                                <option value="all">All Priority</option>
                                <option value="P0">P0</option>
                                <option value="P1">P1</option>
                            </select>
                            <button onClick={() => setShowCompleted(!showCompleted)}
                                className={`px-3 py-2 rounded-lg text-sm font-medium ${showCompleted ? 'bg-indigo-500 text-white' : 'bg-white'}`}>
                                {showCompleted ? '👁️ All' : '📋 Open'}
                            </button>
                        </div>

                        <div className="bg-white rounded-xl shadow-lg p-4 mb-4">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && addTask()}
                                    placeholder="Add task: 'Buy milk tomorrow #Personal'"
                                    className="flex-1 px-4 py-3 border rounded-lg"
                                />
                                <button onClick={startVoice} className={`px-4 py-3 rounded-lg text-white ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-indigo-500'}`}>
                                    🎤
                                </button>
                                <button onClick={addTask} className="px-6 py-3 bg-green-500 text-white rounded-lg font-medium">
                                    +
                                </button>
                            </div>
                        </div>

                        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                            {[
                                ['all', '📋 All'],
                                ['today', '📅 Today'],
                                ['update-eta', '⏰ Update ETA'],
                                ['unassigned', '📥 Unassigned'],
                                ['summary', '📊 Summary']
                            ].map(([v, label]) => (
                                <button
                                    key={v}
                                    onClick={() => setView(v)}
                                    className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${view === v ? 'bg-indigo-500 text-white' : 'bg-white'}`}>
                                    {label}
                                </button>
                            ))}
                        </div>

                        <div className="space-y-2">
                            {filtered.length === 0 ? (
                                <div className="bg-white rounded-xl p-8 text-center text-gray-500">
                                    <p className="text-4xl mb-2">📭</p>
                                    <p>No tasks</p>
                                </div>
                            ) : (
                                filtered.map(task => <TaskItemWithSubtasks 
                                    key={task.id} 
                                    task={task}
                                    onToggleComplete={toggleComplete}
                                    onDelete={deleteTask}
                                    onUpdate={updateTask}
                                    onUpdateWithSubtasks={handleUpdateTaskWithSubtasks}
                                    projects={projects}
                                    themes={themes}
                                    githubConfig={githubConfig}
                                    editingPriority={editingPriority}
                                    setEditingPriority={setEditingPriority}
                                    editingProject={editingProject}
                                    setEditingProject={setEditingProject}
                                    editingDate={editingDate}
                                    setEditingDate={setEditingDate}
                                    editingThemes={editingThemes}
                                    setEditingThemes={setEditingThemes}
                                    celebrateTask={celebrateTask}
                                />)
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        <div className="flex gap-2 mb-4">
                            <select value={recurringProjectFilter} onChange={(e) => setRecurringProjectFilter(e.target.value)} 
                                className="flex-1 px-3 py-2 bg-white rounded-lg border text-sm">
                                <option value="all">All Projects</option>
                                {projects.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>

                        <div className="bg-white rounded-xl shadow-lg p-4 mb-4">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && addRecurringTask()}
                                    placeholder="Add a recurring task..."
                                    className="flex-1 px-4 py-3 border rounded-lg"
                                />
                                <button onClick={startVoice} className={`px-4 py-3 rounded-lg text-white ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-indigo-500'}`}>
                                    🎤
                                </button>
                                <button onClick={addRecurringTask} className="px-6 py-3 bg-green-500 text-white rounded-lg font-medium">
                                    +
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {recurringFiltered.length === 0 ? (
                                <div className="bg-white rounded-xl p-8 text-center text-gray-500">
                                    <p className="text-4xl mb-2">🔄</p>
                                    <p>No recurring tasks</p>
                                </div>
                            ) : (
                                recurringFiltered.map(task => {
                                    const last7Days = getLast7Days();
                                    const completions = task.completions || [];
                                    const frequency = task.frequency || 'daily';
                                    const score = getCompletionScore(completions, frequency);
                                    const todayCompleted = completions.includes(todayStr);
                                    const maxScore = frequency === 'daily' ? 7 : 4;
                                    
                                    return (
                                        <div key={task.id} className="bg-white rounded-lg p-4 shadow">
                                            <div className="flex items-start gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={todayCompleted}
                                                    onChange={() => toggleRecurringComplete(task.id)}
                                                    className="mt-1 w-5 h-5"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium mb-2">{task.title}</div>
                                                    
                                                    <div className="flex flex-wrap gap-1 mb-2">
                                                        {editingProject === task.id ? (
                                                            <div className="flex gap-1 flex-wrap">
                                                                <select value={task.project || ''} onChange={(e) => {
                                                                    updateRecurringTask(task.id, {project: e.target.value || null});
                                                                }}
                                                                    className="text-xs px-2 py-1 border rounded">
                                                                    <option value="">None</option>
                                                                    {projects.map(p => <option key={p} value={p}>{p}</option>)}
                                                                </select>
                                                                <select value={frequency} onChange={(e) => {
                                                                    updateRecurringTask(task.id, {frequency: e.target.value});
                                                                }}
                                                                    className="text-xs px-2 py-1 border rounded">
                                                                    <option value="daily">Daily</option>
                                                                    <option value="weekly">Weekly</option>
                                                                </select>
                                                                <button onClick={() => setEditingProject(null)} className="text-xs px-2 py-1 bg-gray-200 rounded">
                                                                    Done
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <button onClick={() => setEditingProject(task.id)}
                                                                    className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">
                                                                    📁 {task.project || 'Set project'}
                                                                </button>
                                                                <button onClick={() => setEditingProject(task.id)}
                                                                    className={`text-xs px-2 py-1 rounded ${frequency === 'daily' ? 'bg-purple-100 text-purple-700' : 'bg-teal-100 text-teal-700'}`}>
                                                                    {frequency === 'daily' ? '📅 Daily' : '📆 Weekly'}
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="text-xs font-semibold">
                                                            {frequency === 'daily' ? '7-Day Score:' : '4-Week Score:'}
                                                        </span>
                                                        <span className={`text-sm font-bold px-2 py-1 rounded ${
                                                            score >= maxScore * 0.7 ? 'bg-green-100 text-green-700' :
                                                            score >= maxScore * 0.4 ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-red-100 text-red-700'
                                                        }`}>
                                                            {score}/{maxScore}
                                                        </span>
                                                    </div>

                                                    {frequency === 'daily' ? (
                                                        <div className="flex gap-1">
                                                            {last7Days.map(day => {
                                                                const isCompleted = completions.includes(day);
                                                                const dayName = new Date(day).toLocaleDateString('en-US', {weekday: 'short'});
                                                                const isToday = day === todayStr;
                                                                
                                                                return (
                                                                    <div key={day} className="flex flex-col items-center">
                                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${
                                                                            isCompleted ? 'bg-green-500 text-white' : 'bg-gray-200'
                                                                        } ${isToday ? 'ring-2 ring-indigo-500' : ''}`}>
                                                                            {isCompleted ? '✓' : '·'}
                                                                        </div>
                                                                        <span className="text-xs mt-1">{dayName}</span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    ) : (
                                                        <div className="flex gap-1">
                                                            {[0, 1, 2, 3].map(weekIndex => {
                                                                const startOfWeek = new Date();
                                                                startOfWeek.setDate(startOfWeek.getDate() - (7 * weekIndex) - startOfWeek.getDay());
                                                                startOfWeek.setHours(0, 0, 0, 0);
                                                                
                                                                const endOfWeek = new Date(startOfWeek);
                                                                endOfWeek.setDate(endOfWeek.getDate() + 6);
                                                                
                                                                const weekCompleted = completions.some(date => {
                                                                    const d = new Date(date);
                                                                    return d >= startOfWeek && d <= endOfWeek;
                                                                });
                                                                
                                                                const isCurrentWeek = weekIndex === 0;
                                                                const weekLabel = `W${4 - weekIndex}`;
                                                                
                                                                return (
                                                                    <div key={weekIndex} className="flex flex-col items-center flex-1">
                                                                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-xs font-bold ${
                                                                            weekCompleted ? 'bg-green-500 text-white' : 'bg-gray-200'
                                                                        } ${isCurrentWeek ? 'ring-2 ring-indigo-500' : ''}`}>
                                                                            {weekCompleted ? '✓' : '·'}
                                                                        </div>
                                                                        <span className="text-xs mt-1">{weekLabel}</span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                                <button onClick={() => deleteRecurringTask(task.id)} className="text-red-500 text-sm">
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// ========== TASK ITEM WITH SUBTASKS COMPONENT ==========
function TaskItemWithSubtasks({ 
    task, 
    onToggleComplete, 
    onDelete, 
    onUpdate,
    onUpdateWithSubtasks,
    projects, 
    themes,
    githubConfig,
    editingPriority,
    setEditingPriority,
    editingProject,
    setEditingProject,
    editingDate,
    setEditingDate,
    editingThemes,
    setEditingThemes,
    celebrateTask
}) {
    // Initialize subtasks if not present
    if (!task.subtasks) {
        task.subtasks = [];
    }

    // Use subtask hook
    const {
        subtasks,
        isPageOpen,        // ← CHANGED from isModalOpen
        openPage,          // ← CHANGED from openModal
        closePage,         // ← CHANGED from closeModal
        updateSubtasks
    } = useSubtasks({
        task,
        onUpdateTask: onUpdateWithSubtasks,
        githubConfig
    });

    // ========== SWIPE GESTURE HANDLING ==========
    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);

    // Minimum swipe distance (in px)
    const minSwipeDistance = 50;

    const onTouchStart = (e) => {
        setTouchEnd(null); // Reset
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;
        
        // Right swipe opens subtasks
        if (isRightSwipe) {
            openPage();
        }
        
        // Reset
        setTouchStart(null);
        setTouchEnd(null);
    };

    // ← NEW: If subtask page is open, show ONLY that page
    if (isPageOpen) {
        return (
            <SubtaskPageView    // ← CHANGED from SubtaskModal
                task={task}
                onClose={closePage}
                onUpdateSubtasks={updateSubtasks}
                onCompleteMainTask={() => {
                    onToggleComplete(task.id);
                    closePage();
                }}
            />
        );
    }

    // Otherwise show the normal task card
    return (
        <div 
            key={task.id} 
            className={`bg-white rounded-lg p-4 shadow ${task.completed ? 'opacity-60' : ''} ${celebrateTask === task.id ? 'celebrate' : ''}`}
            onDoubleClick={openPage}           // Desktop: double-click
            onTouchStart={onTouchStart}        // Mobile: swipe right
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
        >
            <div className="flex items-start gap-3">
                <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => onToggleComplete(task.id)}
                    className="mt-1 w-5 h-5"
                />
                <div className="flex-1 min-w-0">
                    <div className={`font-medium ${task.completed ? 'line-through text-gray-500' : ''}`}>
                        {task.title}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                        {editingPriority === task.id ? (
                            <div className="flex gap-1">
                                <select value={task.priority} onChange={(e) => {
                                    onUpdate(task.id, {priority: e.target.value});
                                    setEditingPriority(null);
                                }}
                                    className="text-xs px-2 py-1 border rounded">
                                    <option value="P0">P0</option>
                                    <option value="P1">P1</option>
                                </select>
                            </div>
                        ) : (
                            <button onClick={() => setEditingPriority(task.id)}
                                className={`text-xs px-2 py-1 rounded font-bold ${task.priority === 'P0' ? 'bg-red-500 text-white' : 'bg-yellow-500 text-white'}`}>
                                {task.priority}
                            </button>
                        )}

                        {editingProject === task.id ? (
                            <div className="flex gap-1">
                                <select value={task.project || ''} onChange={(e) => {
                                    onUpdate(task.id, {project: e.target.value || null, themes: []});
                                    setEditingProject(null);
                                }}
                                    className="text-xs px-2 py-1 border rounded">
                                    <option value="">None</option>
                                    {projects.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>
                        ) : (
                            <button onClick={() => setEditingProject(task.id)}
                                className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">
                                📁 {task.project || 'Set project'}
                            </button>
                        )}

                        {editingDate === task.id ? (
                            <div className="flex gap-1">
                                <input
                                    type="date"
                                    value={task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''}
                                    onChange={(e) => {
                                        onUpdate(task.id, {dueDate: e.target.value ? new Date(e.target.value).toISOString() : null});
                                        setEditingDate(null);
                                    }}
                                    className="text-xs px-2 py-1 border rounded"
                                />
                            </div>
                        ) : (
                            <button onClick={() => setEditingDate(task.id)}
                                className="text-xs px-2 py-1 rounded bg-indigo-100 text-indigo-700">
                                📅 {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Set date'}
                            </button>
                        )}

                        {/* SUBTASK INDICATOR */}
                        {subtasks.length > 0 && (
                            <SubtaskIndicator 
                                subtasks={subtasks} 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    openPage();    // ← CHANGED from openModal
                                }}
                            />
                        )}
                    </div>

                    {editingThemes === task.id ? (
                        <div className="mt-2 p-2 bg-gray-50 rounded">
                            <div className="text-xs font-semibold mb-1">Themes:</div>
                            <div className="flex flex-wrap gap-1">
                                {task.project && (themes[task.project] || []).map(t => {
                                    const selected = (task.themes || []).includes(t);
                                    return (
                                        <button key={t} onClick={() => {
                                            const curr = task.themes || [];
                                            const newThemes = selected ? curr.filter(x => x !== t) : [...curr, t];
                                            onUpdate(task.id, {themes: newThemes});
                                        }}
                                            className={`text-xs px-2 py-1 rounded-full ${selected ? 'bg-indigo-500 text-white' : 'bg-white border'}`}>
                                            {t}
                                        </button>
                                    );
                                })}
                            </div>
                            <button onClick={() => setEditingThemes(null)} className="mt-1 text-xs px-2 py-1 bg-gray-200 rounded">
                                Done
                            </button>
                        </div>
                    ) : (
                        <div className="mt-1 flex flex-wrap gap-1">
                            {(task.themes || []).map(t => (
                                <span key={t} className="text-xs px-2 py-1 bg-indigo-50 text-indigo-700 rounded-full">
                                    🏷️ {t}
                                </span>
                            ))}
                            {task.project && (
                                <button onClick={() => setEditingThemes(task.id)} className="text-xs text-gray-500">
                                    {(task.themes || []).length === 0 ? '+ themes' : 'edit'}
                                </button>
                            )}
                        </div>
                    )}
                </div>
                <button onClick={() => onDelete(task.id)} className="text-red-500 text-sm">
                    🗑️
                </button>
            </div>
        </div>
    );
}

// Render the app
ReactDOM.render(<App />, document.getElementById('root'));
