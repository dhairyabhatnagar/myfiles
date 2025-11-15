// ==================== NATURAL LANGUAGE PARSER ====================

/**
 * Parse natural language input to extract task properties
 * Examples:
 *   "Buy milk tomorrow #Personal pts:5"
 *   "Meeting p0 12/25 #Work @Goals"
 *   "Exercise today @Fitness"
 */
function parseNaturalLanguage(text, projects, themes) {
    let parsedTask = {
        title: text,
        priority: 'P1',
        project: null,
        themes: [],
        dueDate: null,
        points: CONFIG.DEFAULT_POINTS
    };

    // Extract priority (p0 or p1)
    const priorityMatch = text.match(/\bp0\b|\bp1\b/i);
    if (priorityMatch) {
        parsedTask.priority = priorityMatch[0].toUpperCase();
        text = text.replace(priorityMatch[0], '').trim();
    }

    // Extract points (pts:5 or points:10)
    const pointsMatch = text.match(/(?:pts?|points?):\s*(\d+)/i);
    if (pointsMatch) {
        parsedTask.points = parseInt(pointsMatch[1]);
        text = text.replace(pointsMatch[0], '').trim();
    }

    // Extract project (#ProjectName)
    const projectMatch = text.match(/#(\w+)/);
    if (projectMatch) {
        const projectName = projectMatch[1];
        const matchedProject = projects.find(p => 
            p.toLowerCase() === projectName.toLowerCase()
        );
        if (matchedProject) {
            parsedTask.project = matchedProject;
        }
        text = text.replace(projectMatch[0], '').trim();
    }

    // Extract themes (@ThemeName)
    const themeMatches = text.match(/@(\w+)/g);
    if (themeMatches && parsedTask.project) {
        const projectThemes = themes[parsedTask.project] || [];
        themeMatches.forEach(match => {
            const themeName = match.substring(1);
            const matchedTheme = projectThemes.find(t => 
                t.toLowerCase().includes(themeName.toLowerCase())
            );
            if (matchedTheme && !parsedTask.themes.includes(matchedTheme)) {
                parsedTask.themes.push(matchedTheme);
            }
        });
        themeMatches.forEach(match => {
            text = text.replace(match, '').trim();
        });
    }

    // Extract dates
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (/\btomorrow\b/i.test(text)) {
        parsedTask.dueDate = tomorrow.toISOString();
        text = text.replace(/\btomorrow\b/i, '').trim();
    } else if (/\btoday\b/i.test(text)) {
        parsedTask.dueDate = today.toISOString();
        text = text.replace(/\btoday\b/i, '').trim();
    } else {
        // Match dates like "12/25", "dec 25", "december 25"
        const dateMatch = text.match(/(\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?)|(\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2}\b)/i);
        if (dateMatch) {
            try {
                const parsed = new Date(dateMatch[0]);
                if (!isNaN(parsed.getTime())) {
                    parsedTask.dueDate = parsed.toISOString();
                    text = text.replace(dateMatch[0], '').trim();
                }
            } catch (e) {
                console.error('Date parse error:', e);
            }
        }
    }

    parsedTask.title = text.trim();
    return parsedTask;
}
