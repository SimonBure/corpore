'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CardExercise } from '../../components/CardExercise';
import { DragAndDropWrapper } from '../../components/DragAndDropWrapper';
import { PanelSettings } from '../../components/PanelSettings';
import { CreateExerciseModal } from '../../components/CreateExerciseModal';
import { Exercise, Session, SessionExercise } from '@/types';
import { exerciseApi, templateApi, sessionApi } from '@/lib/api';

export default function NewSessionPage() {
  const router = useRouter();
  const [sessionExercises, setSessionExercises] = useState<SessionExercise[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [settings, setSettings] = useState({ sets: 3, reps: 10, durationSeconds: 30, restBetweenSets: 60, restAfter: '02:00' });
  const [warmupDuration, setWarmupDuration] = useState('05:00'); // Durée d'échauffement en mm:ss
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [templates, setTemplates] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateExerciseModal, setShowCreateExerciseModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [exercisesResponse, templatesResponse] = await Promise.all([
          exerciseApi.getAll(),
          templateApi.getAll()
        ]);

        if (exercisesResponse.success && exercisesResponse.data) {
          setExercises(exercisesResponse.data);
        }

        if (templatesResponse.success && templatesResponse.data) {
          setTemplates(templatesResponse.data);
        }
      } catch (err) {
        setError('Failed to load data');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Convert mm:ss to seconds
  const parseTimeToSeconds = (time: string): number => {
    const [minutes, seconds] = time.split(':').map(Number);
    return minutes * 60 + seconds;
  };

  // Ajout d'un exercice individuel
  const handleAddExercise = (exerciseId: number) => {
    const exercise = exercises.find((e) => e.id === exerciseId);
    if (!exercise) return;
    
    const newSessionExercise: SessionExercise = {
      sessionId: '',
      exerciseId: exercise.id,
      sets: settings.sets,
      reps: exercise.isDurationBased ? null : settings.reps,
      durationSeconds: exercise.isDurationBased ? exercise.defaultDuration : null,
      restBetweenSets: settings.restBetweenSets,
      restAfter: parseTimeToSeconds(settings.restAfter),
      order: sessionExercises.length + 1,
      exercise: exercise
    };
    
    setSessionExercises((prev) => [...prev, newSessionExercise]);
  };

  // Ajout d'un template complet
  const handleAddTemplate = (templateId: string) => {
    const template = templates.find((tpl) => tpl.id === templateId);
    if (!template) return;
    
    const templateExercises = template.sessionExercises.map((se, index) => ({
      ...se,
      sessionId: '',
      order: sessionExercises.length + index + 1,
    }));
    
    setSessionExercises((prev) => [...prev, ...templateExercises]);
    setWarmupDuration(`${Math.floor(template.warmupSeconds / 60).toString().padStart(2, '0')}:${(template.warmupSeconds % 60).toString().padStart(2, '0')}`);
  };

  // Convert seconds to mm:ss format
  const formatRestAfter = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleEdit = (exerciseId: number) => {
    const idx = sessionExercises.findIndex((ex) => ex.exerciseId === exerciseId);
    if (idx === -1) return;
    
    setEditingIdx(idx);
    const exercise = sessionExercises[idx];
    setSettings({
      sets: exercise.sets,
      reps: exercise.reps || 0,
      durationSeconds: exercise.durationSeconds || 30,
      restBetweenSets: exercise.restBetweenSets,
      restAfter: formatRestAfter(exercise.restAfter),
    });
    setPanelOpen(true);
  };

  const handleRemove = (exerciseId: number) => {
    setSessionExercises((prev) => prev.filter((ex) => ex.exerciseId !== exerciseId));
    setPanelOpen(false);
  };

  const handleReorder = (exercises: SessionExercise[]) => {
    const reorderedExercises = exercises.map((ex, index) => ({
      ...ex,
      order: index + 1
    }));
    setSessionExercises(reorderedExercises);
  };

  const handleSettingsChange = (field: string, value: string | number) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
    if (editingIdx !== null) {
      const finalValue = field === 'restAfter' ? parseTimeToSeconds(value as string) : value;
      
      // For duration-based exercises, ensure reps is null when updating durationSeconds
      if (field === 'durationSeconds') {
        setSessionExercises((prev) => prev.map((ex, i) => (
          i === editingIdx ? { ...ex, durationSeconds: finalValue as number, reps: null } : ex
        )));
      } 
      // For rep-based exercises, ensure durationSeconds is null when updating reps
      else if (field === 'reps') {
        setSessionExercises((prev) => prev.map((ex, i) => (
          i === editingIdx ? { ...ex, reps: finalValue as number, durationSeconds: null } : ex
        )));
      }
      // For other fields, update normally
      else {
        setSessionExercises((prev) => prev.map((ex, i) => (i === editingIdx ? { ...ex, [field]: finalValue } : ex)));
      }
    }
  };

  // Create new exercise
  const handleCreateExercise = async (exerciseData: Omit<Exercise, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await exerciseApi.create(exerciseData);
      if (response.success && response.data) {
        // Add new exercise to local state
        setExercises(prev => [...prev, response.data]);
        
        // Optionally add immediately to the workout
        const newSessionExercise: SessionExercise = {
          sessionId: '',
          exerciseId: response.data.id,
          sets: settings.sets,
          reps: response.data.isDurationBased ? null : settings.reps,
          durationSeconds: response.data.isDurationBased ? response.data.defaultDuration : null,
          restBetweenSets: settings.restBetweenSets,
          restAfter: parseTimeToSeconds(settings.restAfter),
          order: sessionExercises.length + 1,
          exercise: response.data
        };
        
        setSessionExercises(prev => [...prev, newSessionExercise]);
        
        // Show success feedback (you could add a toast notification here)
        console.log('Exercise created and added to workout:', response.data.name);
      } else {
        throw new Error(response.error || 'Failed to create exercise');
      }
    } catch (err) {
      // Re-throw to be handled by the modal
      throw err;
    }
  };

  const handleSaveSession = async () => {
    try {
      const sessionData = {
        title: `Workout ${new Date().toLocaleDateString()}`,
        date: new Date(),
        warmupSeconds: parseTimeToSeconds(warmupDuration),
        isTemplate: false,
        exercises: sessionExercises.map((se) => ({
          exerciseId: se.exerciseId,
          sets: se.sets,
          reps: se.reps,
          durationSeconds: se.durationSeconds,
          restBetweenSets: se.restBetweenSets,
          restAfter: se.restAfter,
          order: se.order,
        }))
      };

      const response = await sessionApi.create(sessionData);
      if (response.success && response.data) {
        router.push(`/session/execute/${response.data.id}`);
      } else {
        setError('Failed to create session');
      }
    } catch (err) {
      setError('Failed to create session');
      console.error('Error creating session:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading exercises and templates...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* En-tête */}
      <header className="w-full flex items-center justify-between px-12 py-6 border-b bg-white shadow-sm">
        <h1 className="text-2xl font-bold">Nouvelle Session</h1>
        <div className="flex gap-4">
          <button 
            onClick={handleSaveSession}
            disabled={sessionExercises.length === 0}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
          >
            Créer Session
          </button>
          <button 
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 font-medium"
          >
            Retour
          </button>
        </div>
      </header>
      {/* Layout 3 colonnes */}
      <main className="flex flex-row w-full max-w-[1600px] mx-auto mt-8 gap-8">
        {/* Colonne gauche */}
        <aside className="w-[20%] pl-8">
          <h2 className="text-lg font-semibold mb-4">Templates</h2>
          {templates.map((template) => (
            <div key={template.id} className="bg-white rounded-lg shadow p-4 mb-4 border border-gray-200">
              <div className="font-bold text-lg text-gray-800 mb-1">{template.title}</div>
              <div className="flex flex-wrap gap-2 text-sm text-gray-600 mb-2">
                {template.sessionExercises.map((se, i) => (
                  <span key={i} className="bg-gray-100 rounded px-2 py-0.5">
                    {se.exercise?.name} ({se.sets}x{se.reps})
                  </span>
                ))}
              </div>
              <div className="text-xs text-gray-400 mb-2">
                {template.sessionExercises.length} exercices • {Math.round(template.warmupSeconds / 60)} min warmup
              </div>
              <button
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                onClick={() => handleAddTemplate(template.id)}
              >
                Ajouter tous les exercices
              </button>
            </div>
          ))}
        </aside>
        {/* Colonne centrale */}
        <section className="w-[50%]">
          {/* Durée d'échauffement */}
          <div className="mb-6 bg-orange-50 rounded-lg p-4 border border-orange-200">
            <h2 className="text-lg font-semibold mb-3 text-orange-700">Échauffement</h2>
            <div className="flex items-center gap-2">
              <label htmlFor="warmup-duration" className="text-sm font-medium text-gray-700">
                Durée:
              </label>
              <input
                id="warmup-duration"
                type="text"
                value={warmupDuration}
                onChange={(e) => setWarmupDuration(e.target.value)}
                placeholder="05:00"
                pattern="[0-9]{2}:[0-9]{2}"
                className="px-3 py-1 border border-orange-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 w-20"
              />
              <span className="text-sm text-gray-600">(mm:ss)</span>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              L'échauffement sera un timer libre avant de commencer les exercices
            </p>
          </div>

          {/* Section Exercices */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Exercices</h2>
            <button
              onClick={() => setShowCreateExerciseModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Exercise
            </button>
          </div>
          <div className="mb-6 max-h-96 overflow-y-auto">
            {exercises.map((exercise) => (
              <CardExercise 
                key={exercise.id} 
                name={exercise.name} 
                category={exercise.category}
                muscleGroups={exercise.muscleGroups}
                onAdd={() => handleAddExercise(exercise.id)} 
              />
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
            isDurationBased={editingIdx !== null ? sessionExercises[editingIdx]?.exercise?.isDurationBased : false}
            exerciseName={editingIdx !== null ? sessionExercises[editingIdx]?.exercise?.name : 'l\'exercice'}
          />
        </div>
      </main>

      {/* Exercise Creation Modal */}
      <CreateExerciseModal
        isOpen={showCreateExerciseModal}
        onClose={() => setShowCreateExerciseModal(false)}
        onSubmit={handleCreateExercise}
      />
    </div>
  );
}
