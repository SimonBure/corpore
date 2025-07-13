import React from 'react';
import { ExerciseCategory } from '@/types';

interface CardExerciseProps {
  name: string;
  category?: ExerciseCategory;
  muscleGroups?: string[];
  onAdd: () => void;
}

const getCategoryColor = (category: ExerciseCategory) => {
  switch (category) {
    case 'force':
      return 'bg-red-100 text-red-800';
    case 'cardio':
      return 'bg-green-100 text-green-800';
    case 'souplesse':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const CardExercise: React.FC<CardExerciseProps> = ({ name, category, muscleGroups, onAdd }) => (
  <div className="flex items-center justify-between bg-white rounded-lg shadow p-4 mb-2 border border-gray-200">
    <div className="flex-1">
      <div className="flex items-center gap-2 mb-1">
        <span className="font-semibold text-gray-800">{name}</span>
        {category && (
          <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(category)}`}>
            {category}
          </span>
        )}
      </div>
      {muscleGroups && muscleGroups.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {muscleGroups.map((muscle, index) => (
            <span key={index} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
              {muscle}
            </span>
          ))}
        </div>
      )}
    </div>
    <button
      className="ml-4 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      onClick={onAdd}
      aria-label={`Ajouter ${name}`}
    >
      Ajouter
    </button>
  </div>
);
