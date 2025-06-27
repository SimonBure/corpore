import React from 'react';

interface ExercisePreview {
  name: string;
  sets: number;
  reps: number;
}

interface Template {
  id: number;
  name: string;
  exercises: ExercisePreview[];
  estimatedDuration: string;
}

interface ListTemplatesProps {
  templates: Template[];
  onSelect: (id: number) => void;
}

export const ListTemplates: React.FC<ListTemplatesProps> = ({ templates, onSelect }) => (
  <div className="space-y-4">
    {templates.map((tpl) => (
      <div
        key={tpl.id}
        className="bg-white rounded-lg shadow p-4 cursor-pointer border border-gray-200 hover:border-blue-500 transition"
        onClick={() => onSelect(tpl.id)}
      >
        <div className="font-bold text-lg text-gray-800 mb-1">{tpl.name}</div>
        <div className="flex flex-wrap gap-2 text-sm text-gray-600 mb-2">
          {tpl.exercises.map((ex, i) => (
            <span key={i} className="bg-gray-100 rounded px-2 py-0.5">
              {ex.name} ({ex.sets}x{ex.reps})
            </span>
          ))}
        </div>
        <div className="text-xs text-gray-400">Durée estimée : {tpl.estimatedDuration}</div>
      </div>
    ))}
  </div>
);
