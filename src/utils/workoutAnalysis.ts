import { Session, SessionExercise, WorkoutProgress, PartialWorkoutStats } from '@/types';

/**
 * Analyzes the current workout progress to categorize exercises
 * @param session Current workout session
 * @param completedSets Array of completed sets for each exercise 
 * @param weights Array of weights for each exercise
 * @param currentExerciseIndex Current exercise being performed
 * @returns WorkoutProgress object with categorized exercises
 */
export function analyzeWorkoutProgress(
  session: Session,
  completedSets: number[][],
  weights: number[][],
  currentExerciseIndex: number
): WorkoutProgress {
  const completedExercises: SessionExercise[] = [];
  const partialExercises: SessionExercise[] = [];
  const untouchedExercises: SessionExercise[] = [];
  let totalCompletedSets = 0;

  session.sessionExercises.forEach((exercise, index) => {
    const exerciseSets = completedSets[index] || [];
    const exerciseWeights = weights[index] || [];
    const completedSetsCount = exerciseSets.filter(reps => reps > 0).length;
    const plannedSets = exercise.sets;

    if (completedSetsCount === 0) {
      // No sets completed - untouched exercise
      untouchedExercises.push(exercise);
    } else if (completedSetsCount === plannedSets) {
      // All sets completed - completed exercise
      const exerciseWithActualData = {
        ...exercise,
        actualSets: completedSetsCount,
        actualReps: exerciseSets.filter(reps => reps > 0),
        weight: exerciseWeights.filter(w => w > 0)
      };
      completedExercises.push(exerciseWithActualData);
      totalCompletedSets += completedSetsCount;
    } else {
      // Some sets completed - partial exercise
      const exerciseWithActualData = {
        ...exercise,
        actualSets: completedSetsCount,
        actualReps: exerciseSets.filter(reps => reps > 0),
        weight: exerciseWeights.filter(w => w > 0)
      };
      partialExercises.push(exerciseWithActualData);
      totalCompletedSets += completedSetsCount;
    }
  });

  return {
    completedExercises,
    partialExercises,
    untouchedExercises,
    totalCompletedSets,
    actualDuration: 0 // Will be calculated by caller
  };
}

/**
 * Calculates comprehensive statistics for a partial workout
 * @param progress WorkoutProgress object from analyzeWorkoutProgress
 * @param session Original session data
 * @param actualDuration Actual workout duration in seconds
 * @returns PartialWorkoutStats with all calculated metrics
 */
export function calculatePartialWorkoutStats(
  progress: WorkoutProgress,
  session: Session,
  actualDuration: number
): PartialWorkoutStats {
  const exercisesCompleted = progress.completedExercises.length;
  const totalExercises = session.sessionExercises.length;
  
  // Calculate total completed sets including partial exercises
  const setsCompleted = progress.totalCompletedSets;
  const totalPlannedSets = session.sessionExercises.reduce((total, ex) => total + ex.sets, 0);
  
  // Calculate total volume (weight × reps)
  const totalVolume = [...progress.completedExercises, ...progress.partialExercises]
    .reduce((total, exercise) => {
      if (exercise.actualReps && exercise.weight) {
        const exerciseVolume = exercise.actualReps.reduce((sum, reps, index) => {
          const weight = exercise.weight?.[index] || 0;
          return sum + (reps * weight);
        }, 0);
        return total + exerciseVolume;
      }
      return total;
    }, 0);

  const completionPercentage = Math.round((setsCompleted / totalPlannedSets) * 100);

  return {
    exercisesCompleted,
    totalExercises,
    setsCompleted,
    totalPlannedSets,
    actualDuration,
    totalVolume,
    completionPercentage
  };
}

/**
 * Prepares workout data for saving to database after early termination
 * @param progress WorkoutProgress object
 * @param sessionId Session ID
 * @param actualDuration Actual workout duration
 * @returns Array of exercise data to save
 */
export function preparePartialWorkoutData(
  progress: WorkoutProgress,
  sessionId: string,
  actualDuration: number
) {
  const exercisesToSave = [...progress.completedExercises, ...progress.partialExercises];
  
  return exercisesToSave.map(exercise => ({
    exerciseId: exercise.exerciseId,
    actualSets: exercise.actualSets || 0,
    actualReps: exercise.actualReps || [],
    weight: exercise.weight || []
  }));
}

/**
 * Checks if a workout has any progress worth saving
 * @param progress WorkoutProgress object
 * @returns boolean indicating if workout has saveable progress
 */
export function hasCompletableProgress(progress: WorkoutProgress): boolean {
  return progress.completedExercises.length > 0 || progress.partialExercises.length > 0;
}

/**
 * Formats duration from seconds to human readable format
 * @param seconds Duration in seconds
 * @returns Formatted duration string
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  }
  return `${minutes}m ${secs}s`;
}

/**
 * Gets a summary message for early termination
 * @param stats PartialWorkoutStats object
 * @returns Summary message for UI display
 */
export function getTerminationSummary(stats: PartialWorkoutStats): string {
  if (stats.exercisesCompleted === 0) {
    return `Workout ended with ${stats.setsCompleted} sets completed across ${stats.totalExercises} exercises`;
  }
  
  return `${stats.exercisesCompleted} of ${stats.totalExercises} exercises completed (${stats.completionPercentage}% of planned workout)`;
}