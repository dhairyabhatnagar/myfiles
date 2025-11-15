// ==================== CONFIGURATION ====================
// Update these values for your GitHub setup

const CONFIG = {
    GITHUB_USERNAME: 'YOUR_GITHUB_USERNAME',  // Change this!
    REPO_NAME: 'myfiles',
    FILE_PATH: 'task-data.json',
    BRANCH: 'main',
    
    DEFAULT_PROJECTS: ['Personal', 'Work', 'Health', 'Home'],
    DEFAULT_THEMES: {
        'Work': ['Q4 Goals', 'Client Projects'],
        'Personal': ['Self Improvement', 'Hobbies', 'Finances'],
        'Health': ['Fitness', 'Nutrition'],
        'Home': ['Maintenance', 'Organization']
    },
    
    DEFAULT_POINTS: 10,
    POINT_THRESHOLDS: {
        GREEN: 100,   // 100% = green
        YELLOW: 60,   // 60-99% = yellow
        RED: 0        // < 60% = red
    }
};
