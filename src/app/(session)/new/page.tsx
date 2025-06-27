import React, { useState } from 'react';
import { CardExercise } from '../../components/CardExercise';
import { ListTemplates } from '../../components/ListTemplates';
import { DragAndDropWrapper } from '../../components/DragAndDropWrapper';
import { PanelSettings } from '../../components/PanelSettings';

// --- Données mock ---
const MOCK_TEMPLATES = [
  {
    id: 1,
    name: 'Full Body Express',
    exercises: [
      { name: 'Pompes', sets: 3, reps: 12 },
      { name: 'Squats', sets: 3, reps: 15 },
    ],
    estimatedDuration: '35 min',
  },
  {
    id: 2,
    name: 'Haut du corps',
    exercises: [
      { name: 'Tractions', sets: 4, reps: 8 },
      { name: 'Pompes', sets: 4, reps: 10 },
    ],
    estimatedDuration: '40 min',
  },
];

const MOCK_EXERCISES = [
  { id: 1, name: 'Pompes' },
  { id: 2, name: 'Squats' },
  { id: 3, name: 'Tractions' },
  { id: 4, name: 'Fentes' },
];

export default function NewSessionPage() {
  const [sessionExercises, setSessionExercises] = useState<any[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [settings, setSettings] = useState({ sets: 3, reps: 10, restBetweenSets: 60, restAfter: '01:00' });

  const handleAddExercise = (name: string) => {
    setSessionExercises((prev) => [
      ...prev,
      { id: Date.now(), name, ...settings },
    ]);
  };

  const handleEdit = (id: number) => {
    const idx = sessionExercises.findIndex((ex) => ex.id === id);
    setEditingIdx(idx);
    setSettings(sessionExercises[idx]);
    setPanelOpen(true);
  };

  const handleRemove = (id: number) => {
    setSessionExercises((prev) => prev.filter((ex) => ex.id !== id));
    setPanelOpen(false);
  };

  const handleReorder = (exercises: any[]) => setSessionExercises(exercises);

  const handleSettingsChange = (field: string, value: any) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
    if (editingIdx !== null) {
      setSessionExercises((prev) => prev.map((ex, i) => (i === editingIdx ? { ...ex, [field]: value } : ex)));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* En-tête */}
      <header className="w-full flex items-center justify-between px-12 py-6 border-b bg-white shadow-sm">
        <h1 className="text-2xl font-bold">Nouvelle Session</h1>
        <button className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 font-medium">Retour</button>
      </header>
      {/* Layout 3 colonnes */}
      <main className="flex flex-row w-full max-w-[1600px] mx-auto mt-8 gap-8">
        {/* Colonne gauche */}
        <aside className="w-[20%]">
          <h2 className="text-lg font-semibold mb-4">Templates</h2>
          <ListTemplates templates={MOCK_TEMPLATES} onSelect={() => {}} />
        </aside>
        {/* Colonne centrale */}
        <section className="w-[50%]">
          <h2 className="text-lg font-semibold mb-4">Exercices</h2>
          <div className="mb-6">
            {MOCK_EXERCISES.map((ex) => (
              <CardExercise key={ex.id} name={ex.name} onAdd={() => handleAddExercise(ex.name)} />
            ))}
          </div>
          <h2 className="text-lg font-semibold mb-2">Session en cours</h2>
          <DragAndDropWrapper
            exercises={sessionExercises}
            onReorder={handleReorder}
            onEdit={handleEdit}
            onRemove={handleRemove}
          />
        </section>
        {/* Colonne droite (PanelSettings slide-in) */}
        <div className="w-[30%] relative">
          <PanelSettings
            isOpen={panelOpen}
            onClose={() => setPanelOpen(false)}
            values={settings}
            onChange={handleSettingsChange}
          />
        </div>
      </main>
    </div>
  );
}
