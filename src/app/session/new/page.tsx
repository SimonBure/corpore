'use client';

import React, { useState } from 'react';
import { CardExercise } from '../../components/CardExercise';
import { ListTemplates } from '../../components/ListTemplates';
import { DragAndDropWrapper } from '../../components/DragAndDropWrapper';
import { PanelSettings } from '../../components/PanelSettings';

// --- Données mock ---
const MOCK_TEMPLATES = [
  {
    id: 1,
    name: 'Pompes + Pompes murales + crunch',
    exercises: [
      { name: 'Pompes', sets: 6, reps: 8 },
      { name: 'Pompes murales', sets: 3, reps: 10 },
      { name: 'Crunch', sets: 6, reps: 20 },
    ],
    estimatedDuration: '30 min',
  },
];

const MOCK_EXERCISES = [
  { id: 1, name: 'Pompes' },
  { id: 2, name: 'Pompes murales' },
  { id: 3, name: 'Crunch' },
  { id: 4, name: 'Squats' },
  { id: 5, name: 'Tractions' },
  { id: 6, name: 'Fentes' },
];

export default function NewSessionPage() {
  const [sessionExercises, setSessionExercises] = useState<any[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [settings, setSettings] = useState({ sets: 3, reps: 10, restBetweenSets: 60, restAfter: '01:00' });

  // Ajout d'un exercice individuel
  const handleAddExercise = (name: string) => {
    const exo = MOCK_EXERCISES.find((e) => e.name === name);
    setSessionExercises((prev) => [
      ...prev,
      { id: Date.now(), name, ...settings, exoId: exo ? exo.id : undefined },
    ]);
  };

  // Ajout d'un template complet
  const handleAddTemplate = (templateId: number) => {
    const template = MOCK_TEMPLATES.find((tpl) => tpl.id === templateId);
    if (!template) return;
    setSessionExercises((prev) => [
      ...prev,
      ...template.exercises.map((ex) => {
        const exo = MOCK_EXERCISES.find((e) => e.name === ex.name);
        return {
          id: Date.now() + Math.random(),
          name: ex.name,
          sets: ex.sets,
          reps: ex.reps,
          restBetweenSets: 60,
          restAfter: '01:00',
          exoId: exo ? exo.id : undefined,
        };
      }),
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
        <aside className="w-[20%] pl-8">
          <h2 className="text-lg font-semibold mb-4">Session Exemples</h2>
          {MOCK_TEMPLATES.map((tpl) => (
            <div key={tpl.id} className="bg-white rounded-lg shadow p-4 mb-4 border border-gray-200">
              <div className="font-bold text-lg text-gray-800 mb-1">{tpl.name}</div>
              <div className="flex flex-wrap gap-2 text-sm text-gray-600 mb-2">
                {tpl.exercises.map((ex, i) => (
                  <span key={i} className="bg-gray-100 rounded px-2 py-0.5">
                    {ex.name} ({ex.sets}x{ex.reps})
                  </span>
                ))}
              </div>
              <div className="text-xs text-gray-400 mb-2">Durée estimée : {tpl.estimatedDuration}</div>
              <button
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                onClick={() => handleAddTemplate(tpl.id)}
              >
                Ajouter tous les exercices
              </button>
            </div>
          ))}
        </aside>
        {/* Colonne centrale */}
        <section className="w-[50%]">
          <h2 className="text-lg font-semibold mb-4">Exercices</h2>
          <div className="mb-6">
            {MOCK_EXERCISES.map((ex) => (
              <CardExercise key={ex.id} name={ex.name} onAdd={() => handleAddExercise(ex.name)} />
            ))}
          </div>
          <h2 className="text-lg font-semibold mb-2">Session prévue</h2>
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
