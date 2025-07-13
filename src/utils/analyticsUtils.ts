import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Date range options
export type DateRange = '30d' | '3m' | '6m' | '1y';

// Analytics data types
export interface WorkoutDurationData {
  date: string;
  duration: number;
  sessionId: string;
  title: string;
}

export interface ExerciseProgressionData {
  date: string;
  sessionId: string;
  actualSets: number;
  averageReps: number;
  averageWeight: number;
  totalVolume: number;
  averageDuration?: number; // For duration-based exercises (in seconds)
  isDurationBased?: boolean;
}

export interface ExerciseHistoryItem {
  id: number;
  name: string;
  category: string;
  totalSessions: number;
  lastUsed: Date;
}

/**
 * Convert date range string to actual date
 */
export function getDateFromRange(range: DateRange): Date {
  const now = new Date();
  
  switch (range) {
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case '3m':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case '6m':
      return new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
    case '1y':
      return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
}

/**
 * Get workout duration history for charts
 */
export async function getWorkoutDurationHistory(
  dateRange: DateRange = '30d'
): Promise<WorkoutDurationData[]> {
  try {
    const startDate = getDateFromRange(dateRange);
    
    const sessions = await prisma.session.findMany({
      where: {
        completed: true,
        duration: { not: null },
        date: { gte: startDate }
      },
      select: {
        id: true,
        title: true,
        date: true,
        duration: true
      },
      orderBy: { date: 'asc' }
    });

    return sessions.map(session => ({
      date: session.date.toISOString().split('T')[0], // Format as YYYY-MM-DD
      duration: session.duration || 0,
      sessionId: session.id,
      title: session.title
    }));
  } catch (error) {
    console.error('Error fetching workout duration history:', error);
    return [];
  }
}

/**
 * Get exercise progression data for specific exercise
 */
export async function getExerciseProgressionData(
  exerciseId: number,
  dateRange: DateRange = '30d'
): Promise<ExerciseProgressionData[]> {
  try {
    const startDate = getDateFromRange(dateRange);
    
    // Get all exercises from completed sessions, including those without actualSets
    const sessionExercises = await prisma.sessionExercise.findMany({
      where: {
        exerciseId: exerciseId,
        session: {
          completed: true,
          date: { gte: startDate }
        }
      },
      include: {
        session: {
          select: {
            id: true,
            date: true
          }
        },
        exercise: {
          select: {
            isDurationBased: true
          }
        }
      },
      orderBy: {
        session: { date: 'asc' }
      }
    });

    // Filter to only include sessions with actual performance data for meaningful progression
    const sessionsWithData = sessionExercises.filter(se => se.actualSets !== null);
    
    return sessionsWithData.map(se => {
      const isDurationBased = se.exercise?.isDurationBased || false;
      const actualReps = se.actualReps ? JSON.parse(se.actualReps) : [];
      const weights = se.weight ? JSON.parse(se.weight) : [];
      
      let averageReps = 0;
      let averageDuration = 0;
      
      if (isDurationBased) {
        // For duration-based exercises, actualReps contains duration values in seconds
        averageDuration = actualReps.length > 0 
          ? actualReps.reduce((sum: number, duration: number) => sum + duration, 0) / actualReps.length 
          : 0;
      } else {
        // For rep-based exercises, calculate average reps
        averageReps = actualReps.length > 0 
          ? actualReps.reduce((sum: number, reps: number) => sum + reps, 0) / actualReps.length 
          : 0;
      }
      
      const averageWeight = weights.length > 0 
        ? weights.reduce((sum: number, weight: number) => sum + weight, 0) / weights.length 
        : 0;
      
      // Calculate total volume (weight × reps or weight × duration)
      const totalVolume = actualReps.reduce((total: number, value: number, index: number) => {
        const weight = weights[index] || 0;
        return total + (value * weight);
      }, 0);

      return {
        date: se.session.date.toISOString().split('T')[0],
        sessionId: se.session.id,
        actualSets: se.actualSets || 0,
        averageReps: Math.round(averageReps * 10) / 10,
        averageWeight: Math.round(averageWeight * 10) / 10,
        totalVolume: Math.round(totalVolume),
        averageDuration: Math.round(averageDuration * 10) / 10,
        isDurationBased
      };
    });
  } catch (error) {
    console.error('Error fetching exercise progression data:', error);
    return [];
  }
}

/**
 * Get list of exercises from user's workout history
 */
export async function getAvailableExercisesFromHistory(): Promise<ExerciseHistoryItem[]> {
  try {
    // Get all exercises from completed sessions, not just those with actualSets data
    const exercisesWithHistory = await prisma.sessionExercise.groupBy({
      by: ['exerciseId'],
      where: {
        session: { completed: true }
      },
      _count: {
        exerciseId: true
      },
      _max: {
        id: true
      }
    });

    // Get exercise details for each exerciseId
    const exerciseDetails = await Promise.all(
      exercisesWithHistory.map(async (item) => {
        const exercise = await prisma.exercise.findUnique({
          where: { id: item.exerciseId },
          select: {
            id: true,
            name: true,
            category: true
          }
        });

        return {
          id: item.exerciseId,
          name: exercise?.name || 'Unknown Exercise',
          category: exercise?.category || 'UNKNOWN',
          totalSessions: item._count?.exerciseId || 0,
          lastUsed: new Date() // Use current date as placeholder since we can't easily get last used
        };
      })
    );

    // Sort by most recently used
    return exerciseDetails.sort((a, b) => 
      new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime()
    );
  } catch (error) {
    console.error('Error fetching exercises from history:', error);
    return [];
  }
}

/**
 * Get workout frequency statistics
 */
export async function getWorkoutFrequencyStats(dateRange: DateRange = '30d') {
  try {
    const startDate = getDateFromRange(dateRange);
    
    const totalWorkouts = await prisma.session.count({
      where: {
        completed: true,
        date: { gte: startDate }
      }
    });

    const daysDiff = Math.ceil((new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const averageFrequency = totalWorkouts / daysDiff;

    return {
      totalWorkouts,
      period: daysDiff,
      averagePerDay: Math.round(averageFrequency * 100) / 100,
      averagePerWeek: Math.round(averageFrequency * 7 * 100) / 100
    };
  } catch (error) {
    console.error('Error fetching workout frequency stats:', error);
    return {
      totalWorkouts: 0,
      period: 0,
      averagePerDay: 0,
      averagePerWeek: 0
    };
  }
}

/**
 * Format duration in seconds to human readable format
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

/**
 * Calculate percentage change between two values
 */
export function calculatePercentageChange(oldValue: number, newValue: number): number {
  if (oldValue === 0) return newValue > 0 ? 100 : 0;
  return Math.round(((newValue - oldValue) / oldValue) * 100);
}