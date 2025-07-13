import React from 'react';

interface PanelSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  values: {
    sets: number;
    reps: number;
    durationSeconds?: number;
    restBetweenSets: number;
    restAfter: string;
  };
  onChange: (field: string, value: string | number) => void;
  isDurationBased?: boolean;
  exerciseName?: string;
}

export const PanelSettings: React.FC<PanelSettingsProps> = ({ 
  isOpen, 
  onClose, 
  values, 
  onChange, 
  isDurationBased = false,
  exerciseName = "l'exercice"
}) => (
  <div
    className={`fixed top-0 right-0 h-full w-[30vw] bg-white shadow-lg z-40 p-8 border-l border-gray-200 transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'}`}
    style={{ minWidth: 320 }}
  >
    <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-700" onClick={onClose} aria-label="Fermer">
      ✕
    </button>
    <h2 className="text-xl font-bold mb-6">Paramètres de {exerciseName}</h2>
    {isDurationBased && (
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
        <div className="flex items-center">
          <svg className="w-4 h-4 text-orange-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm text-orange-800 font-medium">Exercice basé sur la durée</span>
        </div>
      </div>
    )}
    <form className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Séries</label>
        <input type="number" min={1} className="mt-1 w-full border rounded px-3 py-2" value={values.sets || ""} onChange={e => onChange('sets', Number(e.target.value) || 1)} />
      </div>
      
      {isDurationBased ? (
        <div>
          <label className="block text-sm font-medium">Durée par série (secondes)</label>
          <input 
            type="number" 
            min={1} 
            className="mt-1 w-full border rounded px-3 py-2" 
            value={values.durationSeconds || ""} 
            onChange={e => onChange('durationSeconds', Number(e.target.value) || 1)}
            placeholder="ex: 30 pour 30 secondes"
          />
          <p className="text-xs text-gray-500 mt-1">
            Temps de maintien ou d'exécution pour chaque série
          </p>
        </div>
      ) : (
        <div>
          <label className="block text-sm font-medium">Répétitions</label>
          <input type="number" min={1} className="mt-1 w-full border rounded px-3 py-2" value={values.reps || ""} onChange={e => onChange('reps', Number(e.target.value) || 1)} />
        </div>
      )}
      
      <div>
        <label className="block text-sm font-medium">Repos entre séries (sec)</label>
        <input type="number" min={0} className="mt-1 w-full border rounded px-3 py-2" value={values.restBetweenSets || ""} onChange={e => onChange('restBetweenSets', Number(e.target.value) || 0)} />
      </div>
      <div>
        <label className="block text-sm font-medium">Repos après (mm:ss)</label>
        <input type="text" pattern="^\\d{1,2}:\\d{2}$" className="mt-1 w-full border rounded px-3 py-2" value={values.restAfter || ""} onChange={e => onChange('restAfter', e.target.value)} />
      </div>
    </form>
  </div>
);
