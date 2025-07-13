import React from 'react';
import { Session } from '@/types';

interface StatsCardProps {
  sessions: Session[];
}

export const StatsCard: React.FC<StatsCardProps> = ({ sessions }) => {
  const totalWorkouts = sessions.length;
  const totalTime = sessions.reduce((sum, session) => sum + (session.duration || 0), 0);
  const totalVolume = sessions.reduce((sum, session) => {
    return sum + session.sessionExercises.reduce((exerciseSum, exercise) => {
      if (exercise.actualReps && exercise.weight) {
        return exerciseSum + exercise.actualReps.reduce((setSum, reps, index) => {
          const weight = exercise.weight?.[index] || 0;
          return setSum + (reps * weight);
        }, 0);
      }
      return exerciseSum;
    }, 0);
  }, 0);

  const averageWorkoutTime = totalWorkouts > 0 ? Math.floor(totalTime / totalWorkouts / 60) : 0;

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="bg-white rounded-xl shadow p-6 border border-gray-200">
        <div className="text-2xl font-bold text-blue-600 mb-2">{totalWorkouts}</div>
        <div className="text-gray-600 text-sm">Total Workouts</div>
      </div>

      <div className="bg-white rounded-xl shadow p-6 border border-gray-200">
        <div className="text-2xl font-bold text-green-600 mb-2">
          {formatTime(totalTime)}
        </div>
        <div className="text-gray-600 text-sm">Total Time</div>
      </div>

      <div className="bg-white rounded-xl shadow p-6 border border-gray-200">
        <div className="text-2xl font-bold text-purple-600 mb-2">
          {totalVolume.toFixed(0)} kg
        </div>
        <div className="text-gray-600 text-sm">Total Volume</div>
      </div>

      <div className="bg-white rounded-xl shadow p-6 border border-gray-200">
        <div className="text-2xl font-bold text-orange-600 mb-2">
          {averageWorkoutTime}m
        </div>
        <div className="text-gray-600 text-sm">Avg. Duration</div>
      </div>
    </div>
  );
};
