import React from 'react';

interface PanelSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  values: {
    sets: number;
    reps: number;
    restBetweenSets: number;
    restAfter: string;
  };
  onChange: (field: string, value: any) => void;
}

export const PanelSettings: React.FC<PanelSettingsProps> = ({ isOpen, onClose, values, onChange }) => (
  <div
    className={`fixed top-0 right-0 h-full w-[30vw] bg-white shadow-lg z-40 p-8 border-l border-gray-200 transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'}`}
    style={{ minWidth: 320 }}
  >
    <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-700" onClick={onClose} aria-label="Fermer">
      ✕
    </button>
    <h2 className="text-xl font-bold mb-6">Paramètres de l'exercice</h2>
    <form className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Séries</label>
        <input type="number" min={1} className="mt-1 w-full border rounded px-3 py-2" value={values.sets} onChange={e => onChange('sets', Number(e.target.value))} />
      </div>
      <div>
        <label className="block text-sm font-medium">Répétitions</label>
        <input type="number" min={1} className="mt-1 w-full border rounded px-3 py-2" value={values.reps} onChange={e => onChange('reps', Number(e.target.value))} />
      </div>
      <div>
        <label className="block text-sm font-medium">Repos entre séries (sec)</label>
        <input type="number" min={0} className="mt-1 w-full border rounded px-3 py-2" value={values.restBetweenSets} onChange={e => onChange('restBetweenSets', Number(e.target.value))} />
      </div>
      <div>
        <label className="block text-sm font-medium">Repos après (mm:ss)</label>
        <input type="text" pattern="^\\d{1,2}:\\d{2}$" className="mt-1 w-full border rounded px-3 py-2" value={values.restAfter} onChange={e => onChange('restAfter', e.target.value)} />
      </div>
    </form>
  </div>
);
