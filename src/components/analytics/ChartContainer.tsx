import React, { useState, useEffect } from 'react';
import { WorkoutDurationChart } from './WorkoutDurationChart';
import { ExerciseProgressChart } from './ExerciseProgressChart';
import { ExerciseSelector } from './ExerciseSelector';
import { type DateRange } from '@/utils/analyticsUtils';

interface ChartContainerProps {
  className?: string;
}

interface WorkoutData {
  date: string;
  duration: number;
  sessionId: string;
  title: string;
}

interface ExerciseData {
  date: string;
  sessionId: string;
  actualSets: number;
  averageReps: number;
  averageWeight: number;
  totalVolume: number;
}

interface Exercise {
  id: number;
  name: string;
  category: string;
  totalSessions: number;
  lastUsed: Date;
}

export const ChartContainer: React.FC<ChartContainerProps> = ({ className }) => {
  const [activeTab, setActiveTab] = useState<'duration' | 'progress'>('duration');
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [selectedExerciseId, setSelectedExerciseId] = useState<number | null>(null);
  
  // Data states
  const [workoutData, setWorkoutData] = useState<WorkoutData[]>([]);
  const [exerciseData, setExerciseData] = useState<ExerciseData[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  
  // Loading states
  const [loadingWorkouts, setLoadingWorkouts] = useState(false);
  const [loadingExercises, setLoadingExercises] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(false);

  // Fetch workout duration data
  const fetchWorkoutData = async (range: DateRange) => {
    setLoadingWorkouts(true);
    try {
      const response = await fetch(`/api/analytics/workout-duration?range=${range}`);
      const result = await response.json();
      if (result.success) {
        setWorkoutData(result.data.workouts);
      }
    } catch (error) {
      console.error('Error fetching workout data:', error);
    } finally {
      setLoadingWorkouts(false);
    }
  };

  // Fetch available exercises
  const fetchExercises = async () => {
    setLoadingExercises(true);
    try {
      const response = await fetch(`/api/analytics/exercises?range=${dateRange}`);
      const result = await response.json();
      if (result.success) {
        setExercises(result.data.exercises);
        // Auto-select first exercise if none selected
        if (result.data.exercises.length > 0 && !selectedExerciseId) {
          setSelectedExerciseId(result.data.exercises[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching exercises:', error);
    } finally {
      setLoadingExercises(false);
    }
  };

  // Fetch exercise progression data
  const fetchExerciseProgress = async (exerciseId: number, range: DateRange) => {
    setLoadingProgress(true);
    try {
      const response = await fetch(`/api/analytics/exercise-progression/${exerciseId}?range=${range}`);
      const result = await response.json();
      if (result.success) {
        setExerciseData(result.data.progressions);
      }
    } catch (error) {
      console.error('Error fetching exercise progress:', error);
    } finally {
      setLoadingProgress(false);
    }
  };

  // Initial data load
  useEffect(() => {
    fetchWorkoutData(dateRange);
    fetchExercises();
  }, [dateRange]);

  // Load exercise progress when exercise or range changes
  useEffect(() => {
    if (selectedExerciseId) {
      fetchExerciseProgress(selectedExerciseId, dateRange);
    }
  }, [selectedExerciseId, dateRange]);

  const dateRangeOptions = [
    { value: '30d' as DateRange, label: 'Derniers 30 jours' },
    { value: '3m' as DateRange, label: 'Derniers 3 mois' },
    { value: '6m' as DateRange, label: 'Derniers 6 mois' },
    { value: '1y' as DateRange, label: 'Dernière année' }
  ];

  const selectedExercise = exercises.find(e => e.id === selectedExerciseId);

  return (
    <div className={`bg-white rounded-2xl shadow-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 sm:mb-0">
          Statistiques des entraînements
        </h2>
        
        {/* Date Range Selector */}
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">Période :</label>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as DateRange)}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {dateRangeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('duration')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'duration'
              ? 'bg-white text-blue-600 shadow'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          📊 Durée des entraînements
        </button>
        <button
          onClick={() => setActiveTab('progress')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'progress'
              ? 'bg-white text-blue-600 shadow'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          💪 Progrès sur les exercices
        </button>
      </div>

      {/* Chart Content */}
      {activeTab === 'duration' ? (
        <WorkoutDurationChart
          data={workoutData}
          loading={loadingWorkouts}
          height={400}
        />
      ) : (
        <div className="space-y-6">
          {/* Exercise Selector */}
          <ExerciseSelector
            exercises={exercises}
            selectedExerciseId={selectedExerciseId}
            onExerciseSelect={setSelectedExerciseId}
            loading={loadingExercises}
          />
          
          {/* Progress Chart */}
          {selectedExerciseId && (
            <ExerciseProgressChart
              data={exerciseData}
              exerciseName={selectedExercise?.name}
              loading={loadingProgress}
              height={400}
            />
          )}
        </div>
      )}
    </div>
  );
};