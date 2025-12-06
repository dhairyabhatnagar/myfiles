/**
 * GitHub Subtask Sync Service
 * 
 * Handles one-way synchronization of subtasks to GitHub issue descriptions
 * App is the source of truth - GitHub is read-only
 */

/**
 * Formats subtasks as Markdown checklist for GitHub
 * @param {Array} subtasks - Array of subtask objects
 * @returns {string} Markdown formatted checklist
 */
export function formatSubtasksForGitHub(subtasks) {
  if (!subtasks || subtasks.length === 0) {
    return '';
  }

  // Sort by order
  const sorted = [...subtasks].sort((a, b) => a.order - b.order);

  let markdown = '\n\n---\n\n## Subtasks\n\n';

  sorted.forEach(subtask => {
    const checkbox = subtask.completed ? '[x]' : '[ ]';
    markdown += `- ${checkbox} ${subtask.title}\n`;
    
    // Add notes as indented text if they exist
    if (subtask.notes && subtask.notes.trim()) {
      markdown += `  - *${subtask.notes.trim()}*\n`;
    }
  });

  // Add progress summary
  const completed = subtasks.filter(st => st.completed).length;
  const total = subtasks.length;
  const percentage = Math.round((completed / total) * 100);

  markdown += `\n**Progress: ${completed}/${total} complete (${percentage}%)**\n`;

  return markdown;
}

/**
 * Extracts the main description from an issue body, removing existing subtask section
 * @param {string} issueBody - Full issue body from GitHub
 * @returns {string} Issue body without subtask section
 */
export function extractMainDescription(issueBody) {
  if (!issueBody) return '';

  // Remove existing subtask section (everything after the subtask marker)
  const subtaskMarker = '\n---\n\n## Subtasks';
  const markerIndex = issueBody.indexOf(subtaskMarker);
  
  if (markerIndex !== -1) {
    return issueBody.substring(0, markerIndex);
  }

  return issueBody;
}

/**
 * Combines main description with subtask section
 * @param {string} mainDescription - Main issue description
 * @param {Array} subtasks - Array of subtask objects
 * @returns {string} Complete issue body with subtasks
 */
export function buildIssueBodyWithSubtasks(mainDescription, subtasks) {
  const cleanDescription = extractMainDescription(mainDescription || '');
  const subtaskSection = formatSubtasksForGitHub(subtasks);
  
  return cleanDescription + subtaskSection;
}

/**
 * Updates a GitHub issue with subtask information
 * This is called whenever subtasks are created/updated/deleted
 * 
 * @param {Object} params
 * @param {string} params.owner - Repository owner
 * @param {string} params.repo - Repository name
 * @param {number} params.issueNumber - Issue number
 * @param {string} params.token - GitHub personal access token
 * @param {string} params.currentBody - Current issue body/description
 * @param {Array} params.subtasks - Array of subtask objects
 * @returns {Promise<Object>} Updated issue data
 */
export async function syncSubtasksToGitHub({ 
  owner, 
  repo, 
  issueNumber, 
  token, 
  currentBody, 
  subtasks 
}) {
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

/**
 * Batch sync multiple tasks' subtasks to GitHub
 * Useful when initializing or doing bulk updates
 * 
 * @param {Object} params
 * @param {string} params.owner - Repository owner
 * @param {string} params.repo - Repository name
 * @param {string} params.token - GitHub personal access token
 * @param {Array} params.tasks - Array of task objects with subtasks
 * @returns {Promise<Array>} Array of sync results
 */
export async function batchSyncSubtasksToGitHub({ owner, repo, token, tasks }) {
  const results = [];
  
  for (const task of tasks) {
    if (!task.githubIssueNumber) continue;
    
    try {
      const result = await syncSubtasksToGitHub({
        owner,
        repo,
        issueNumber: task.githubIssueNumber,
        token,
        currentBody: task.description || '',
        subtasks: task.subtasks || []
      });
      
      results.push({ taskId: task.id, success: true, data: result });
    } catch (error) {
      results.push({ taskId: task.id, success: false, error: error.message });
    }
  }
  
  return results;
}

/**
 * Validates subtask sync configuration
 * @param {Object} config
 * @returns {Object} Validation result
 */
export function validateSyncConfig(config) {
  const errors = [];

  if (!config.owner || typeof config.owner !== 'string') {
    errors.push('Repository owner is required');
  }

  if (!config.repo || typeof config.repo !== 'string') {
    errors.push('Repository name is required');
  }

  if (!config.token || typeof config.token !== 'string') {
    errors.push('GitHub token is required');
  }

  if (!config.issueNumber || typeof config.issueNumber !== 'number') {
    errors.push('Issue number must be a valid number');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
