// ==================== GITHUB SYNC ====================

/**
 * GitHub Sync Manager
 * Handles loading and saving data to GitHub repository
 */
const GitHubSync = {
    
    /**
     * Load data from GitHub
     */
    async load(token, onSuccess, onError) {
        try {
            const response = await fetch(
                `https://api.github.com/repos/${CONFIG.GITHUB_USERNAME}/${CONFIG.REPO_NAME}/contents/${CONFIG.FILE_PATH}?ref=${CONFIG.BRANCH}`,
                {
                    headers: {
                        'Authorization': `token ${token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                }
            );

            if (!response.ok) {
                throw new Error('Failed to load from GitHub');
            }

            const data = await response.json();
            const content = JSON.parse(atob(data.content));
            
            onSuccess({
                tasks: content.tasks || [],
                recurringTasks: content.recurringTasks || [],
                projects: content.projects || CONFIG.DEFAULT_PROJECTS,
                themes: content.themes || CONFIG.DEFAULT_THEMES,
                sha: data.sha
            });
        } catch (error) {
            console.error('GitHub load error:', error);
            onError(error);
        }
    },

    /**
     * Save data to GitHub
     */
    async save(token, sha, tasks, recurringTasks, projects, themes, onSuccess, onError) {
        try {
            const content = {
                tasks: tasks,
                recurringTasks: recurringTasks,
                projects: projects,
                themes: themes
            };

            const encodedContent = btoa(JSON.stringify(content, null, 2));

            const response = await fetch(
                `https://api.github.com/repos/${CONFIG.GITHUB_USERNAME}/${CONFIG.REPO_NAME}/contents/${CONFIG.FILE_PATH}`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `token ${token}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        message: `Update tasks - ${new Date().toISOString()}`,
                        content: encodedContent,
                        sha: sha,
                        branch: CONFIG.BRANCH
                    })
                }
            );

            if (!response.ok) {
                throw new Error('Failed to save to GitHub');
            }

            const data = await response.json();
            onSuccess(data.content.sha);
        } catch (error) {
            console.error('GitHub save error:', error);
            onError(error);
        }
    },

    /**
     * Token management
     */
    saveToken(token) {
        localStorage.setItem('githubToken', token);
    },

    getToken() {
        return localStorage.getItem('githubToken');
    },

    removeToken() {
        localStorage.removeItem('githubToken');
    }
};

// Export for ES6 modules
if (typeof window !== 'undefined') {
    window.GitHubSync = GitHubSync;
}
