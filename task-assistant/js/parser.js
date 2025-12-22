// ==================== NATURAL LANGUAGE PARSER ====================
// Updated to support:
//   # for tags (new)
//   @ for projects (changed from themes)
//   Themes selected via UI (no symbol)

/**
 * Parse natural language input to extract task properties
 * Examples:
 *   "Buy milk tomorrow @Personal #urgent"
 *   "Meeting p0 12/25 @Work #client-alpha #followup"
 *   "Exercise today @Health #important"
 */
function parseNaturalLanguage(text, projects, themes) {
    let parsedTask = {
        title: text,
        priority: 'P1',
        project: null,
        themes: [],
        tags: [],      // NEW: tags array
        dueDate: null
    };

    // Extract priority (p0 or p1)
    const priorityMatch = text.match(/\bp0\b|\bp1\b/i);
    if (priorityMatch) {
        parsedTask.priority = priorityMatch[0].toUpperCase();
        text = text.replace(priorityMatch[0], '').trim();
    }

    // Extract tags (#tagname) - NEW
    // Must come BEFORE project extraction since we changed project to @
    const tagMatches = text.match(/#([a-zA-Z0-9_-]+)/g);
    if (tagMatches) {
        tagMatches.forEach(match => {
            const tagName = match.substring(1).toLowerCase().trim();
            if (tagName && !parsedTask.tags.includes(tagName)) {
                // Limit to 3 tags max
                if (parsedTask.tags.length < 3) {
                    parsedTask.tags.push(tagName);
                }
            }
            text = text.replace(match, '').trim();
        });
    }

    // Extract project (@ProjectName) - CHANGED from # to @
    const projectMatch = text.match(/@([a-zA-Z0-9_-]+)/);
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

    // Note: Themes are now selected via UI only, no symbol parsing
    // The old @ThemeName syntax for themes is removed
    // Themes are associated with a project and selected after project is set

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

    // Clean up extra whitespace
    parsedTask.title = text.replace(/\s+/g, ' ').trim();
    
    return parsedTask;
}

/**
 * Extract tags from existing task title (for migration)
 * Useful if users had informal tags in titles like "urgent:" or "[urgent]"
 */
function extractInformalTags(title) {
    const tags = [];
    
    // Match [tag] pattern
    const bracketMatches = title.match(/\[([a-zA-Z0-9_-]+)\]/g);
    if (bracketMatches) {
        bracketMatches.forEach(match => {
            const tag = match.slice(1, -1).toLowerCase();
            if (tag && !tags.includes(tag) && tags.length < 3) {
                tags.push(tag);
            }
        });
    }
    
    // Match tag: pattern at start
    const colonMatch = title.match(/^([a-zA-Z0-9_-]+):\s*/);
    if (colonMatch) {
        const tag = colonMatch[1].toLowerCase();
        if (tag && !tags.includes(tag) && tags.length < 3) {
            tags.push(tag);
        }
    }
    
    return tags;
}
