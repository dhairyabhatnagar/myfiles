// ==================== GAMIFICATION ====================

/**
 * Calculate today's game statistics
 * Returns points earned vs total points for tasks due today/overdue
 */
function calculateGameStats(tasks) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    // Tasks due today or overdue (not completed)
    const dueTodayOrPast = tasks.filter(t => {
        if (!t.dueDate || t.completed) return false;
        const dueDate = new Date(t.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate <= today;
    });

    // Tasks completed today
    const completedToday = tasks.filter(t => {
        if (!t.completed || !t.completedAt) return false;
        const completedDate = new Date(t.completedAt).toISOString().split('T')[0];
        return completedDate === todayStr;
    });

    const totalPoints = dueTodayOrPast.reduce((sum, t) => sum + (t.points || CONFIG.DEFAULT_POINTS), 0);
    const earnedPoints = completedToday.reduce((sum, t) => sum + (t.points || CONFIG.DEFAULT_POINTS), 0);
    const percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;

    return { 
        totalPoints, 
        earnedPoints, 
        percentage, 
        completedCount: completedToday.length,
        dueCount: dueTodayOrPast.length
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
