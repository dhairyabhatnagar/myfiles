// ==================== GAMIFICATION (RECURRING TASKS ONLY) ====================

/**
 * Calculate recurring tasks statistics
 * Returns completion rates for all recurring tasks
 */
function calculateRecurringStats(recurringTasks) {
    const today = new Date().toISOString().split('T')[0];
    
    let totalScore = 0;
    let maxScore = 0;
    let completedToday = 0;

    recurringTasks.forEach(task => {
        const completions = task.completions || [];
        const frequency = task.frequency || 'daily';
        const score = getCompletionScore(completions, frequency);
        const max = frequency === 'daily' ? 7 : 4;
        
        totalScore += score;
        maxScore += max;
        
        if (completions.includes(today)) {
            completedToday++;
        }
    });

    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

    return { 
        totalScore, 
        maxScore, 
        percentage,
        completedToday,
        totalTasks: recurringTasks.length
    };
}

/**
 * Get color for percentage score
 */
function getScoreColor(percentage) {
    if (percentage >= CONFIG.POINT_THRESHOLDS.GREEN) return 'green';
    if (percentage >= CONFIG.POINT_THRESHOLDS.YELLOW) return 'yellow';
    return 'red';
}

/**
 * Calculate completion score for recurring tasks
 */
function getCompletionScore(completions, frequency) {
    if (frequency === 'daily') {
        const last7Days = getLast7Days();
        return last7Days.filter(day => completions.includes(day)).length;
    } else {
        // Weekly - check last 4 weeks
        const weeks = [];
        for (let i = 0; i < 4; i++) {
            const startOfWeek = new Date();
            startOfWeek.setDate(startOfWeek.getDate() - (7 * i) - startOfWeek.getDay());
            startOfWeek.setHours(0, 0, 0, 0);
            
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(endOfWeek.getDate() + 6);
            endOfWeek.setHours(23, 59, 59, 999);
            
            const weekCompleted = completions.some(date => {
                const d = new Date(date);
                return d >= startOfWeek && d <= endOfWeek;
            });
            
            if (weekCompleted) weeks.push(true);
        }
        return weeks.length;
    }
}

/**
 * Get last 7 days as ISO date strings
 */
function getLast7Days() {
    const days = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push(d.toISOString().split('T')[0]);
    }
    return days;
}
