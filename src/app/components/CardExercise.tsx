import React from 'react';

interface CardExerciseProps {
  name: string;
  onAdd: () => void;
}

export const CardExercise: React.FC<CardExerciseProps> = ({ name, onAdd }) => (
  <div className="flex items-center justify-between bg-white rounded-lg shadow p-4 mb-2 border border-gray-200">
    <span className="font-semibold text-gray-800">{name}</span>
    <button
      className="ml-4 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      onClick={onAdd}
      aria-label={`Ajouter ${name}`}
    >
      Ajouter
    </button>
  </div>
);
