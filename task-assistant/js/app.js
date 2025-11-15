// ==================== MAIN APP - PART 1 ====================
// This file contains the React app state and logic

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
    const [editingPoints, setEditingPoints] = useState(null);
    const [newTheme, setNewTheme] = useState('');
    const [addingThemeTo, setAddingThemeTo] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [githubToken, setGithubToken] = useState('');
    const [showTokenInput, setShowTokenInput] = useState(false);
    const [syncStatus, setSyncStatus] = useState('');
    const [fileSha, setFileSha] = useState('');
    const [darkMode, setDarkMode] = useState(false);
    const [celebrateTask, setCelebrateTask] = useState(null);

    // ========== INITIALIZATION ==========
    useEffect(() => {
        const savedToken = GitHubSync.getToken();
        const savedDarkMode = localStorage.getItem('darkMode') === 'true';
        
        setDarkMode(savedDarkMode);
        if (savedDarkMode) document.documentElement.classList.add('dark');
        
        if (savedToken) {
            setGithubToken(savedToken);
            loadData(savedToken);
        } else {
            setShowTokenInput(true);
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
                setTimeout(() => setSyncStatus(''), 2000);
            },
            (error) => {
                setSyncStatus('error');
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
    const gameStats = calculateGameStats(tasks);
    const filtered = TaskOperations.filterTasks(tasks, view, showCompleted, priorityFilter, projectFilter);
    const recurringFiltered = TaskOperations.filterRecurringTasks(recurringTasks, recurringProjectFilter);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

// Continue to Part 2 for the UI rendering...
