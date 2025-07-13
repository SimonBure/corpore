import React from 'react';

interface Exercise {
  id: number;
  name: string;
  category: string;
  totalSessions: number;
  lastUsed: Date;
}

interface ExerciseSelectorProps {
  exercises: Exercise[];
  selectedExerciseId: number | null;
  onExerciseSelect: (exerciseId: number) => void;
  loading?: boolean;
}

export const ExerciseSelector: React.FC<ExerciseSelectorProps> = ({
  exercises,
  selectedExerciseId,
  onExerciseSelect,
  loading = false
}) => {
  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <span className="text-gray-500">Loading exercises...</span>
      </div>
    );
  }

  if (exercises.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-600">No exercises with progress data found</p>
        <p className="text-sm text-gray-500">Complete some workouts to see exercise progress!</p>
      </div>
    );
  }

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'force':
        return '💪';
      case 'cardio':
        return '🏃';
      default:
        return '🏋️';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'force':
        return 'bg-red-100 text-red-800';
      case 'cardio':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Select Exercise</h3>
        <span className="text-sm text-gray-500">{exercises.length} exercises</span>
      </div>
      
      {/* Quick selector dropdown for mobile/compact view */}
      <div className="md:hidden">
        <select
          value={selectedExerciseId || ''}
          onChange={(e) => {
            const id = parseInt(e.target.value);
            if (!isNaN(id)) onExerciseSelect(id);
          }}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Choose an exercise...</option>
          {exercises.map((exercise) => (
            <option key={exercise.id} value={exercise.id}>
              {exercise.name} ({exercise.totalSessions} sessions)
            </option>
          ))}
        </select>
      </div>

      {/* Grid view for desktop */}
      <div className="hidden md:grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
        {exercises.map((exercise) => (
          <button
            key={exercise.id}
            onClick={() => onExerciseSelect(exercise.id)}
            className={`p-3 rounded-lg border transition-colors text-left ${
              selectedExerciseId === exercise.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-lg">{getCategoryIcon(exercise.category)}</span>
                <div>
                  <div className="font-medium text-gray-900">{exercise.name}</div>
                  <div className="text-sm text-gray-500">
                    {exercise.totalSessions} session{exercise.totalSessions !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end space-y-1">
                <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(exercise.category)}`}>
                  {exercise.category}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(exercise.lastUsed).toLocaleDateString()}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Selected exercise summary */}
      {selectedExerciseId && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          {(() => {
            const selectedExercise = exercises.find(e => e.id === selectedExerciseId);
            return selectedExercise ? (
              <div className="flex items-center space-x-3">
                <span className="text-lg">{getCategoryIcon(selectedExercise.category)}</span>
                <div>
                  <div className="font-medium text-blue-900">
                    Showing progress for: {selectedExercise.name}
                  </div>
                  <div className="text-sm text-blue-700">
                    {selectedExercise.totalSessions} sessions tracked
                  </div>
                </div>
              </div>
            ) : null;
          })()}
        </div>
      )}
    </div>
  );
};