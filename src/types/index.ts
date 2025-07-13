export interface Exercise {
  id: number;
  name: string;
  category: ExerciseCategory;
  muscleGroups: string[]; // parsed from JSON
  equipmentNeeded?: string | null;
  instructions?: string | null;
  isCustom: boolean;
  isDurationBased: boolean;
  defaultSets: number;
  defaultReps?: number | null;
  defaultDuration?: number | null;
  defaultRestBetweenSets: number;
  defaultRestAfter: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  id: string;
  title: string;
  date: Date;
  warmupSeconds: number;
  isTemplate: boolean;
  duration?: number | null;
  completed: boolean;
  terminatedEarly?: boolean;
  createdAt: Date;
  updatedAt: Date;
  sessionExercises: SessionExercise[];
}

export interface SessionExercise {
  id: string;
  exerciseId: number;
  sessionId: string;
  order: number;
  sets: number;
  reps?: number | null;
  durationSeconds?: number | null;
  restBetweenSets: number;
  restAfter: number;
  weight?: number[] | null; // parsed from JSON
  actualSets?: number | null;
  actualReps?: number[] | null; // parsed from JSON
  exercise?: Exercise;
}

export type ExerciseCategory = 'FORCE' | 'CARDIO';

export interface CreateSessionRequest {
  title: string;
  date: Date;
  warmupSeconds: number;
  isTemplate: boolean;
  exercises: {
    exerciseId: number;
    sets: number;
    reps?: number | null;
    durationSeconds?: number | null;
    restBetweenSets: number;
    restAfter: number;
    order: number;
  }[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface WorkoutProgress {
  completedExercises: SessionExercise[];
  partialExercises: SessionExercise[];
  untouchedExercises: SessionExercise[];
  totalCompletedSets: number;
  actualDuration: number;
}

export interface PartialWorkoutStats {
  exercisesCompleted: number;
  totalExercises: number;
  setsCompleted: number;
  totalPlannedSets: number;
  actualDuration: number;
  totalVolume: number;
  completionPercentage: number;
}

export interface TerminateWorkoutRequest {
  sessionId: string;
  actualDuration: number;
  completedExercises: {
    exerciseId: number;
    actualSets: number;
    actualReps: number[];
    weight: number[];
  }[];
}

export interface Photo {
  id: string;
  userId?: string | null;
  filename: string;
  originalName?: string | null;
  captureDate: Date;
  notes?: string | null;
  fileSize: number;
  mimeType: string;
  width?: number | null;
  height?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PhotoUploadRequest {
  file: File;
  notes?: string;
  captureDate?: Date;
}