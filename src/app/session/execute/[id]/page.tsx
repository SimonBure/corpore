'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { sessionApi } from '@/lib/api';
import { Session, SessionExercise } from '@/types';
import { 
  analyzeWorkoutProgress, 
  calculatePartialWorkoutStats, 
  preparePartialWorkoutData,
  hasCompletableProgress,
  getTerminationSummary
} from '@/utils/workoutAnalysis';

interface ExecuteSessionPageProps {
  params: Promise<{ id: string }>;
}

export default function ExecuteSessionPage({ params }: ExecuteSessionPageProps) {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [currentPhase, setCurrentPhase] = useState<'warmup' | 'exercises'>('warmup');
  const [warmupTimeLeft, setWarmupTimeLeft] = useState(0);
  const [isWarmupActive, setIsWarmupActive] = useState(false);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [isResting, setIsResting] = useState(false);
  const [restTimeLeft, setRestTimeLeft] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [, setExerciseStartTime] = useState<Date | null>(null);
  const [completedSets, setCompletedSets] = useState<number[][]>([]);
  const [weights, setWeights] = useState<number[][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTerminateDialog, setShowTerminateDialog] = useState(false);

  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    const initializePage = async () => {
      const resolvedParams = await params;
      const id = resolvedParams.id;
      setSessionId(id);
      await fetchSession(id);
    };
    initializePage();
  }, [params]);

  const fetchSession = async (id: string) => {
    try {
      setLoading(true);
      const response = await sessionApi.getById(id);
      
      if (response.success && response.data) {
        setSession(response.data);
        // Initialize completed sets and weights arrays
        setCompletedSets(response.data.sessionExercises.map(se => Array(se.sets).fill(0)));
        setWeights(response.data.sessionExercises.map(se => Array(se.sets).fill(0)));
        
        // Initialize warmup or go directly to exercises
        if (response.data.warmupSeconds > 0) {
          setCurrentPhase('warmup');
          setWarmupTimeLeft(response.data.warmupSeconds);
        } else {
          setCurrentPhase('exercises');
          setSessionStartTime(new Date());
          setExerciseStartTime(new Date());
        }
      } else {
        setError('Session not found');
      }
    } catch (err) {
      setError('Failed to load session');
      console.error('Error fetching session:', err);
    } finally {
      setLoading(false);
    }
  };

  // Warmup control functions
  const handleWarmupStart = () => {
    setIsWarmupActive(true);
    setSessionStartTime(new Date());
  };

  const handleWarmupComplete = useCallback(() => {
    setCurrentPhase('exercises');
    setIsWarmupActive(false);
    if (!sessionStartTime) {
      setSessionStartTime(new Date());
    }
    setExerciseStartTime(new Date());
  }, [sessionStartTime]);

  const handleWarmupSkip = () => {
    setCurrentPhase('exercises');
    setIsWarmupActive(false);
    setSessionStartTime(new Date());
    setExerciseStartTime(new Date());
  };

  // Warmup timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isWarmupActive && warmupTimeLeft > 0) {
      interval = setInterval(() => {
        setWarmupTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (warmupTimeLeft === 0 && isWarmupActive) {
      // Auto-transition to exercises when warmup time is up
      handleWarmupComplete();
    }
    return () => clearInterval(interval);
  }, [isWarmupActive, warmupTimeLeft, handleWarmupComplete]);

  // Rest timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isResting && restTimeLeft > 0) {
      interval = setInterval(() => {
        setRestTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (restTimeLeft === 0 && isResting) {
      setIsResting(false);
    }
    return () => clearInterval(interval);
  }, [isResting, restTimeLeft]);

  const currentExercise = session?.sessionExercises[currentExerciseIndex];

  const handleWorkoutComplete = useCallback(async () => {
    if (!session || !sessionStartTime || !sessionId) return;

    const duration = Math.floor((new Date().getTime() - sessionStartTime.getTime()) / 1000);

    try {
      // Update session as completed
      await sessionApi.update(sessionId, {
        completed: true,
        duration: duration
      });

      // Update each exercise with actual results
      for (let i = 0; i < session.sessionExercises.length; i++) {
        const exercise = session.sessionExercises[i];
        await sessionApi.updateExercise(sessionId, exercise.exerciseId, {
          actualSets: completedSets[i].filter(reps => reps > 0).length,
          actualReps: completedSets[i].filter(reps => reps > 0),
          weight: weights[i].filter(w => w > 0)
        });
      }

      // Navigate to completion screen
      router.push(`/session/complete/${sessionId}`);
    } catch (err) {
      setError('Failed to save workout results');
      console.error('Error completing workout:', err);
    }
  }, [session, sessionStartTime, sessionId, completedSets, weights, router]);

  const handleTerminateWorkout = useCallback(async () => {
    if (!session || !sessionStartTime || !sessionId) return;

    const actualDuration = Math.floor((new Date().getTime() - sessionStartTime.getTime()) / 1000);
    
    // Analyze current workout progress
    const progress = analyzeWorkoutProgress(session, completedSets, weights, currentExerciseIndex);
    
    // Check if there's any progress worth saving
    if (!hasCompletableProgress(progress)) {
      // No progress to save, just mark as incomplete and go to dashboard
      router.push('/');
      return;
    }

    try {
      // Prepare data for API call
      const exerciseData = preparePartialWorkoutData(progress, sessionId, actualDuration);
      
      // Call terminate API
      await sessionApi.terminate(sessionId, {
        actualDuration,
        completedExercises: exerciseData
      });

      // Navigate to completion screen
      router.push(`/session/complete/${sessionId}?terminated=true`);
    } catch (err) {
      setError('Failed to save partial workout');
      console.error('Error terminating workout:', err);
    }
  }, [session, sessionStartTime, sessionId, completedSets, weights, currentExerciseIndex, router]);

  const handleShowTerminateDialog = () => {
    if (!session) return;
    
    // Analyze current progress for dialog
    const progress = analyzeWorkoutProgress(session, completedSets, weights, currentExerciseIndex);
    const stats = calculatePartialWorkoutStats(progress, session, 0);
    
    // Show different messages based on progress
    if (!hasCompletableProgress(progress)) {
      const confirmed = confirm('End workout? No exercises have been completed yet. All progress will be lost.');
      if (confirmed) {
        router.push('/');
      }
    } else {
      const summary = getTerminationSummary(stats);
      const confirmed = confirm(`End workout early?\n\n${summary}\n\nCompleted exercises will be saved to your workout history.`);
      if (confirmed) {
        handleTerminateWorkout();
      }
    }
  };

  const handleSetComplete = useCallback((reps: number, weight: number) => {
    if (!currentExercise) return;

    // Update completed sets and weights
    setCompletedSets(prev => {
      const newSets = [...prev];
      newSets[currentExerciseIndex][currentSet - 1] = reps;
      return newSets;
    });

    setWeights(prev => {
      const newWeights = [...prev];
      newWeights[currentExerciseIndex][currentSet - 1] = weight;
      return newWeights;
    });

    // Check if this was the last set of the exercise
    if (currentSet >= currentExercise.sets) {
      // Move to next exercise or finish workout
      if (currentExerciseIndex < (session?.sessionExercises.length || 0) - 1) {
        setCurrentExerciseIndex(prev => prev + 1);
        setCurrentSet(1);
        setExerciseStartTime(new Date());
        // Start rest period after exercise
        setRestTimeLeft(currentExercise.restAfter);
        setIsResting(true);
      } else {
        // Workout complete
        handleWorkoutComplete();
      }
    } else {
      // Move to next set
      setCurrentSet(prev => prev + 1);
      // Start rest period between sets
      setRestTimeLeft(currentExercise.restBetweenSets);
      setIsResting(true);
    }
  }, [currentExercise, currentExerciseIndex, currentSet, session?.sessionExercises.length, handleWorkoutComplete]);

  const handleSkipRest = () => {
    setIsResting(false);
    setRestTimeLeft(0);
  };

  const getOverallProgress = (): number => {
    if (!session) return 0;
    
    const hasWarmup = session.warmupSeconds > 0;
    const phases = hasWarmup ? 2 : 1; // échauffement + exercices
    
    if (currentPhase === 'warmup') {
      const warmupProgress = hasWarmup 
        ? (session.warmupSeconds - warmupTimeLeft) / session.warmupSeconds 
        : 0;
      return Math.round((warmupProgress / phases) * 100);
    } else {
      const exerciseProgress = session.sessionExercises.length > 0 && currentExercise
        ? (currentExerciseIndex + (currentSet - 1) / currentExercise.sets) / session.sessionExercises.length
        : 0;
      const baseProgress = hasWarmup ? 0.5 : 0; // 50% si échauffement terminé
      return Math.round((baseProgress + (exerciseProgress / phases)) * 100);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading workout...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Workout not found'}</p>
          <button 
            onClick={() => router.push('/session/new')} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Sessions
          </button>
        </div>
      </div>
    );
  }

  if (currentPhase === 'exercises' && !currentExercise) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">No exercises found in this session</p>
          <button 
            onClick={() => router.push('/session/new')} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Sessions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm px-6 py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">{session.title}</h1>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              {currentPhase === 'warmup' ? (
                `Échauffement - ${Math.floor(warmupTimeLeft / 60)}:${(warmupTimeLeft % 60).toString().padStart(2, '0')}`
              ) : (
                `Exercise ${currentExerciseIndex + 1} of ${session.sessionExercises.length}`
              )}
            </div>
            {currentPhase === 'exercises' && (
              <button
                onClick={handleShowTerminateDialog}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
              >
                End Workout
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {currentPhase === 'warmup' ? (
          <WarmupScreen 
            timeLeft={warmupTimeLeft}
            totalTime={session.warmupSeconds}
            onStart={handleWarmupStart}
            onComplete={handleWarmupComplete}
            onSkip={handleWarmupSkip}
            isActive={isWarmupActive}
          />
        ) : isResting ? (
          <RestScreen 
            timeLeft={restTimeLeft} 
            onSkip={handleSkipRest}
            nextExercise={session.sessionExercises[currentExerciseIndex]?.exercise?.name || 'Next set'}
          />
        ) : (
          <ExerciseScreen 
            exercise={currentExercise!}
            currentSet={currentSet}
            onSetComplete={handleSetComplete}
            completedSets={completedSets[currentExerciseIndex] || []}
            weights={weights[currentExerciseIndex] || []}
          />
        )}

        {/* Progress Bar */}
        <div className="mt-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span>{getOverallProgress()}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-blue-600 h-3 rounded-full transition-all duration-300" 
              style={{ width: `${getOverallProgress()}%` }}
            ></div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Warmup Screen Component
function WarmupScreen({ 
  timeLeft, 
  totalTime, 
  onStart, 
  onComplete, 
  onSkip,
  isActive 
}: { 
  timeLeft: number; 
  totalTime: number;
  onStart: () => void; 
  onComplete: () => void;
  onSkip: () => void;
  isActive: boolean;
}) {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="text-center">
      <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl shadow-lg p-12 max-w-md mx-auto border border-orange-200">
        <h2 className="text-3xl font-bold text-orange-800 mb-4">Échauffement</h2>
        
        <div className="text-6xl font-mono font-bold text-orange-600 mb-6">
          {formatTime(timeLeft)}
        </div>
        
        <p className="text-orange-700 mb-6 text-lg">
          Échauffement libre - bougez comme vous voulez !
        </p>
        
        <p className="text-sm text-orange-600 mb-8">
          Préparez votre corps pour l'entraînement
        </p>

        <div className="space-y-3">
          {!isActive ? (
            <>
              <button
                onClick={onStart}
                className="w-full px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold"
              >
                Commencer l'échauffement
              </button>
              <button
                onClick={onSkip}
                className="w-full px-6 py-2 text-orange-600 border border-orange-300 rounded-lg hover:bg-orange-50 transition-colors"
              >
                Passer l'échauffement
              </button>
            </>
          ) : (
            <button
              onClick={onComplete}
              className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
            >
              Terminer l'échauffement
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Rest Screen Component
function RestScreen({ timeLeft, onSkip, nextExercise }: { 
  timeLeft: number; 
  onSkip: () => void; 
  nextExercise: string;
}) {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="text-center">
      <div className="bg-white rounded-2xl shadow-lg p-12 max-w-md mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Rest Time</h2>
        <div className="text-6xl font-mono font-bold text-blue-600 mb-6">
          {formatTime(timeLeft)}
        </div>
        <p className="text-gray-600 mb-8">
          Next: {nextExercise}
        </p>
        <button
          onClick={onSkip}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
        >
          Skip Rest
        </button>
      </div>
    </div>
  );
}

// Exercise Screen Component
function ExerciseScreen({ 
  exercise, 
  currentSet, 
  onSetComplete, 
  completedSets, 
  weights 
}: { 
  exercise: SessionExercise; 
  currentSet: number; 
  onSetComplete: (reps: number, weight: number) => void;
  completedSets: number[];
  weights: number[];
}) {
  const [reps, setReps] = useState(exercise.reps || 0);
  const [weight, setWeight] = useState(0);

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl mx-auto">
      {/* Exercise Info */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          {exercise.exercise?.name || 'Exercise'}
        </h2>
        <div className="flex justify-center items-center gap-4 text-lg text-gray-600">
          <span>Set {currentSet} of {exercise.sets}</span>
          <span>•</span>
          <span>Target: {exercise.reps} reps</span>
        </div>
        {exercise.exercise?.muscleGroups && (
          <div className="flex justify-center flex-wrap gap-2 mt-4">
            {exercise.exercise.muscleGroups.map((muscle, index) => (
              <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                {muscle}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Input Section */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reps Completed
          </label>
          <input
            type="number"
            min="0"
            value={reps || ""}
            onChange={(e) => setReps(Number(e.target.value) || 0)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-xl font-semibold"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Weight (kg)
          </label>
          <input
            type="number"
            min="0"
            step="0.5"
            value={weight || ""}
            onChange={(e) => setWeight(Number(e.target.value) || 0)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-xl font-semibold"
          />
        </div>
      </div>

      {/* Complete Set Button */}
      <button
        onClick={() => onSetComplete(reps, weight)}
        className="w-full px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-lg"
      >
        Complete Set
      </button>

      {/* Previous Sets */}
      {completedSets.some(reps => reps > 0) && (
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Previous Sets</h3>
          <div className="grid grid-cols-3 gap-4">
            {completedSets.map((setReps, index) => {
              if (setReps === 0) return null;
              return (
                <div key={index} className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-sm text-gray-600">Set {index + 1}</div>
                  <div className="font-semibold">{setReps} reps</div>
                  {weights[index] > 0 && (
                    <div className="text-sm text-gray-600">{weights[index]} kg</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}