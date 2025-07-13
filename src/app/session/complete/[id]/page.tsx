'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { sessionApi } from '@/lib/api';
import { Session, CreateSessionRequest } from '@/types';
import { formatDuration } from '@/utils/workoutAnalysis';

interface CompleteSessionPageProps {
  params: Promise<{ id: string }>;
}

export default function CompleteSessionPage({ params }: CompleteSessionPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const wasTerminated = searchParams.get('terminated') === 'true';

  useEffect(() => {
    const initializePage = async () => {
      const resolvedParams = await params;
      const id = resolvedParams.id;
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

  const getCompletedExercises = () => {
    if (!session) return [];
    return session.sessionExercises.filter(exercise => 
      exercise.actualSets && exercise.actualSets > 0
    );
  };

  const getPartialExercises = () => {
    if (!session) return [];
    return session.sessionExercises.filter(exercise => 
      exercise.actualSets && exercise.actualSets > 0 && exercise.actualSets < exercise.sets
    );
  };

  const getCompletionStats = () => {
    if (!session) return { completed: 0, total: 0, percentage: 0 };
    
    const completedExercises = getCompletedExercises();
    const total = session.sessionExercises.length;
    const completed = completedExercises.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { completed, total, percentage };
  };

  const getTotalVolume = (): number => {
    if (!session) return 0;
    
    return session.sessionExercises.reduce((total, exercise) => {
      if (exercise.actualReps && exercise.weight) {
        const exerciseVolume = exercise.actualReps.reduce((sum, reps, index) => {
          const weight = exercise.weight?.[index] || 0;
          return sum + (reps * weight);
        }, 0);
        return total + exerciseVolume;
      }
      return total;
    }, 0);
  };

  const getTotalReps = (): number => {
    if (!session) return 0;
    
    return session.sessionExercises.reduce((total, exercise) => {
      if (exercise.actualReps) {
        return total + exercise.actualReps.reduce((sum, reps) => sum + reps, 0);
      }
      return total;
    }, 0);
  };

  const handleSaveAsTemplate = async () => {
    if (!session) return;

    try {
      // Create a new template based on this session
      const templateData: CreateSessionRequest = {
        title: `${session.title} (Template)`,
        date: new Date(),
        warmupSeconds: session.warmupSeconds,
        isTemplate: true,
        exercises: session.sessionExercises.map((se) => ({
          exerciseId: se.exerciseId,
          sets: se.actualSets || se.sets,
          reps: se.actualReps?.[0] || se.reps, // Use first set's reps as default
          durationSeconds: se.durationSeconds,
          restBetweenSets: se.restBetweenSets,
          restAfter: se.restAfter,
          order: se.order,
        }))
      };

      await sessionApi.create(templateData);
      
      // Show success message or navigate
      alert('Template saved successfully!');
    } catch (err) {
      console.error('Error saving template:', err);
      alert('Failed to save template');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Session not found'}</p>
          <button 
            onClick={() => router.push('/')} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const totalVolume = getTotalVolume();
  const totalReps = getTotalReps();
  const completionStats = getCompletionStats();
  const completedExercises = getCompletedExercises();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      {/* Header */}
      <header className="bg-white shadow-sm px-6 py-8">
        <div className="max-w-4xl mx-auto text-center">
          {wasTerminated ? (
            <>
              <div className="text-6xl mb-4">⏹️</div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Workout Ended Early</h1>
              <p className="text-xl text-gray-600">
                {completionStats.completed > 0 
                  ? `${completionStats.completed} of ${completionStats.total} exercises completed (${completionStats.percentage}%)`
                  : "Your progress has been saved"
                }
              </p>
            </>
          ) : (
            <>
              <div className="text-6xl mb-4">🎉</div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Workout Complete!</h1>
              <p className="text-xl text-gray-600">Great job finishing your workout</p>
            </>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {session.duration ? formatDuration(session.duration) : 'N/A'}
            </div>
            <div className="text-gray-600">Total Duration</div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {totalReps}
            </div>
            <div className="text-gray-600">Total Reps</div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {totalVolume.toFixed(1)} kg
            </div>
            <div className="text-gray-600">Total Volume</div>
          </div>
        </div>

        {/* Exercise Summary */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {wasTerminated ? 'Completed Exercises' : 'Exercise Summary'}
          </h2>
          
          {wasTerminated && completedExercises.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-4">📝</div>
              <p className="text-gray-600">No exercises were completed in this session.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {(wasTerminated ? completedExercises : session.sessionExercises).map((exercise, index) => (
              <div key={index} className="border-b border-gray-200 pb-6 last:border-b-0">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {exercise.exercise?.name || 'Unknown Exercise'}
                      </h3>
                      {exercise.actualSets && exercise.actualSets < exercise.sets && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                          Partial
                        </span>
                      )}
                    </div>
                    <div className="flex gap-4 text-sm text-gray-600 mt-1">
                      <span>Target: {exercise.sets} × {exercise.reps}</span>
                      <span>Actual: {exercise.actualSets || 0} sets</span>
                      {exercise.actualSets && exercise.actualSets < exercise.sets && (
                        <span className="text-yellow-600">({exercise.sets - exercise.actualSets} sets incomplete)</span>
                      )}
                    </div>
                  </div>
                  {exercise.exercise?.muscleGroups && (
                    <div className="flex flex-wrap gap-1">
                      {exercise.exercise.muscleGroups.map((muscle, muscleIndex) => (
                        <span key={muscleIndex} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                          {muscle}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sets Details */}
                {exercise.actualReps && exercise.actualReps.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {exercise.actualReps.map((reps, setIndex) => (
                      <div key={setIndex} className="bg-gray-50 rounded-lg p-3 text-center">
                        <div className="text-sm text-gray-600">Set {setIndex + 1}</div>
                        <div className="font-semibold">{reps} reps</div>
                        {exercise.weight?.[setIndex] && (
                          <div className="text-sm text-gray-600">{exercise.weight[setIndex]} kg</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleSaveAsTemplate}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            Save as Template
          </button>
          
          <button
            onClick={() => router.push('/session/new')}
            className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
          >
            Start New Workout
          </button>
          
          <button
            onClick={() => router.push('/')}
            className="px-8 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold"
          >
            Back to Dashboard
          </button>
        </div>
      </main>
    </div>
  );
}