import { LEVELS, POINTS_MAP } from '../constants'

/**
 * Calculate points for an observation based on category
 */
export function calculatePoints(
    category: keyof typeof POINTS_MAP,
    isSeasonalRare: boolean = false
): number {
    if (isSeasonalRare) {
        return POINTS_MAP.SeasonalRare
    }
    return POINTS_MAP[category] || 0
}

/**
 * Get user's level information based on total points
 */
export function getUserLevel(totalPoints: number) {
    const level = LEVELS.find(
        (l) => totalPoints >= l.minPoints && totalPoints <= l.maxPoints
    ) || LEVELS[LEVELS.length - 1]

    const nextLevel = LEVELS.find((l) => l.level === level.level + 1)
    const pointsToNextLevel = nextLevel ? nextLevel.minPoints - totalPoints : 0
    const progressPercentage = nextLevel
        ? ((totalPoints - level.minPoints) / (nextLevel.minPoints - level.minPoints)) * 100
        : 100

    return {
        ...level,
        nextLevel,
        pointsToNextLevel,
        progressPercentage: Math.min(Math.max(progressPercentage, 0), 100),
    }
}

/**
 * Check if user leveled up after earning points
 */
export function checkLevelUp(oldPoints: number, newPoints: number): boolean {
    const oldLevel = getUserLevel(oldPoints).level
    const newLevel = getUserLevel(newPoints).level
    return newLevel > oldLevel
}

/**
 * Format points with commas
 */
export function formatPoints(points: number): string {
    return points.toLocaleString()
}
