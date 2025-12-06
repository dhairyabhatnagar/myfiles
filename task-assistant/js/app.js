// ==================== MAIN APP - NO POINTS IN TASKS ====================
// Gamification only for Recurring Tasks

// NO IMPORTS - subtasks.js loaded via script tag

const { useState, useEffect } = React;

function App() {
    // ========== STATE ==========
    const [tasks, setTasks] = useState([]);
    const [recurringTasks, setRecurringTasks] = useState([]);
    const [projects, setProjects] = useState([]);
    const [themes, setThemes] = useState({});
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
            
            // Initialize with CONFIG defaults if available
            if (typeof CONFIG !== 'undefined') {
                setProjects(CONFIG.DEFAULT_PROJECTS || []);
                setThemes(CONFIG.DEFAULT_THEMES || {});
            }
            
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

    // Rest of your existing functions...
    // (I'll include the critical ones and note where to keep your existing code)

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

    const loadData = (token) => {
        setSyncStatus('syncing');
        GitHubSync.load(
            token,
            (data) => {
                setTasks(data.tasks || []);
                setRecurringTasks(data.recurringTasks || []);
                setProjects(data.projects || []);
                setThemes(data.themes || {});
                setFileSha(data.sha || '');
                setSyncStatus('success');
                setIsLoading(false);
                setTimeout(() => setSyncStatus(''), 2000);
            },
            (error) => {
                console.error('Load error:', error);
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
                console.error('Save error:', error);
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

    // Show loading screen
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

    // Show token input if no token
    if (showTokenInput) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
                    <h1 className="text-2xl font-bold mb-4 text-gray-900">🔐 GitHub Setup</h1>
                    <p className="text-gray-600 mb-4">
                        Enter your GitHub Personal Access Token to enable cross-device syncing.
                    </p>
                    <input
                        type="password"
                        placeholder="ghp_xxxxxxxxxxxx"
                        className="w-full px-4 py-3 border rounded-lg mb-4 text-gray-900"
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
                        className="w-full px-4 py-3 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600">
                        Connect to GitHub
                    </button>
                    <div className="mt-4 p-3 bg-yellow-50 rounded-lg text-sm">
                        <p className="font-semibold mb-1 text-gray-900">⚠️ First time setup:</p>
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

    // Main app - just return a simple test for now
    return (
        <div className={`min-h-screen ${darkMode ? 'dark bg-gradient' : 'bg-gradient-to-br from-blue-50 to-indigo-100'}`}>
            <div className="p-4 max-w-4xl mx-auto pt-8">
                <div className="bg-white rounded-xl p-8 text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">✅ Task Assistant Loaded Successfully!</h1>
                    <p className="text-gray-600 mb-4">The app structure is working. Your tasks will appear here.</p>
                    <p className="text-sm text-gray-500">Tasks: {tasks.length} | Recurring: {recurringTasks.length}</p>
                </div>
            </div>
        </div>
    );
}

// Render the app
ReactDOM.render(<App />, document.getElementById('root'));
