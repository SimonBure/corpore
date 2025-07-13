import React, { useState } from 'react';
import { Exercise, ExerciseCategory } from '@/types';

interface CreateExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (exerciseData: Omit<Exercise, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
}

const MUSCLE_GROUPS = [
  'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Forearms',
  'Abs', 'Obliques', 'Lower Back', 'Quadriceps', 'Hamstrings', 
  'Glutes', 'Calves', 'Traps', 'Lats', 'Core'
];

export const CreateExerciseModal: React.FC<CreateExerciseModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [formData, setFormData] = useState({
    name: '',
    category: 'FORCE' as ExerciseCategory,
    muscleGroups: [] as string[],
    equipmentNeeded: '',
    instructions: '',
    isCustom: true,
    isDurationBased: false,
    defaultSets: 3,
    defaultReps: 10,
    defaultDuration: null as number | null,
    defaultRestBetweenSets: 60,
    defaultRestAfter: 60
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleMuscleGroupToggle = (muscleGroup: string) => {
    setFormData(prev => ({
      ...prev,
      muscleGroups: prev.muscleGroups.includes(muscleGroup)
        ? prev.muscleGroups.filter(mg => mg !== muscleGroup)
        : [...prev.muscleGroups, muscleGroup]
    }));
  };

  const handleDurationToggle = (isDurationBased: boolean) => {
    setFormData(prev => ({
      ...prev,
      isDurationBased,
      defaultReps: isDurationBased ? null : 10,
      defaultDuration: isDurationBased ? 30 : null
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) return 'Exercise name is required';
    if (formData.muscleGroups.length === 0) return 'At least one muscle group is required';
    if (!formData.isDurationBased && (!formData.defaultReps || formData.defaultReps < 1)) {
      return 'Default reps must be greater than 0';
    }
    if (formData.isDurationBased && (!formData.defaultDuration || formData.defaultDuration < 1)) {
      return 'Default duration must be greater than 0';
    }
    if (formData.defaultSets < 1) return 'Default sets must be greater than 0';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onSubmit({
        ...formData,
        defaultReps: formData.isDurationBased ? null : formData.defaultReps
      });
      
      // Reset form on success
      setFormData({
        name: '',
        category: 'FORCE',
        muscleGroups: [],
        equipmentNeeded: '',
        instructions: '',
        isCustom: true,
        isDurationBased: false,
        defaultSets: 3,
        defaultReps: 10,
        defaultDuration: null,
        defaultRestBetweenSets: 60,
        defaultRestAfter: 60
      });
      
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create exercise');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Create New Exercise</h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Exercise Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Exercise Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Push-ups, Bench Press"
              disabled={loading}
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value as ExerciseCategory)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            >
              <option value="FORCE">Force</option>
              <option value="CARDIO">Cardio</option>
            </select>
          </div>

          {/* Duration vs Reps Toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Exercise Type
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="exerciseType"
                  checked={!formData.isDurationBased}
                  onChange={() => handleDurationToggle(false)}
                  className="mr-2"
                  disabled={loading}
                />
                Rep-based (e.g., 10 reps)
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="exerciseType"
                  checked={formData.isDurationBased}
                  onChange={() => handleDurationToggle(true)}
                  className="mr-2"
                  disabled={loading}
                />
                Duration-based (e.g., 30 seconds)
              </label>
            </div>
          </div>

          {/* Muscle Groups */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Muscle Groups * (Select all that apply)
            </label>
            <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-3">
              {MUSCLE_GROUPS.map((muscle) => (
                <label key={muscle} className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    checked={formData.muscleGroups.includes(muscle)}
                    onChange={() => handleMuscleGroupToggle(muscle)}
                    className="mr-2"
                    disabled={loading}
                  />
                  {muscle}
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Selected: {formData.muscleGroups.join(', ') || 'None'}
            </p>
          </div>

          {/* Defaults Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Sets *
              </label>
              <input
                type="number"
                min="1"
                value={formData.defaultSets}
                onChange={(e) => handleInputChange('defaultSets', Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
            </div>

            {!formData.isDurationBased ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Reps *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.defaultReps || ''}
                  onChange={(e) => handleInputChange('defaultReps', Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Duration (seconds) *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.defaultDuration || ''}
                  onChange={(e) => handleInputChange('defaultDuration', Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rest Between Sets (seconds)
              </label>
              <input
                type="number"
                min="0"
                value={formData.defaultRestBetweenSets}
                onChange={(e) => handleInputChange('defaultRestBetweenSets', Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rest After Exercise (seconds)
              </label>
              <input
                type="number"
                min="0"
                value={formData.defaultRestAfter}
                onChange={(e) => handleInputChange('defaultRestAfter', Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
            </div>
          </div>

          {/* Equipment (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Equipment Needed (Optional)
            </label>
            <input
              type="text"
              value={formData.equipmentNeeded}
              onChange={(e) => handleInputChange('equipmentNeeded', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Dumbbells, Barbell, Bodyweight"
              disabled={loading}
            />
          </div>

          {/* Instructions (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Instructions (Optional)
            </label>
            <textarea
              value={formData.instructions}
              onChange={(e) => handleInputChange('instructions', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Brief description of how to perform this exercise..."
              disabled={loading}
            />
          </div>

          {/* Actions */}
          <div className="flex space-x-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? 'Creating...' : 'Create Exercise'}
            </button>
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};