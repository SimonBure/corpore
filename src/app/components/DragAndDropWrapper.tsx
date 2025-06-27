import React from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';

interface Exercise {
  id: number;
  name: string;
  sets: number;
  reps: number;
  restBetweenSets: number;
  restAfter: string;
}

interface DragAndDropWrapperProps {
  exercises: Exercise[];
  onReorder: (exercises: Exercise[]) => void;
  onEdit: (id: number) => void;
  onRemove: (id: number) => void;
}

export const DragAndDropWrapper: React.FC<DragAndDropWrapperProps> = ({ exercises, onReorder, onEdit, onRemove }) => {
  function handleOnDragEnd(result: DropResult) {
    if (!result.destination) return;
    const items = Array.from(exercises);
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);
    onReorder(items);
  }

  return (
    <DragDropContext onDragEnd={handleOnDragEnd}>
      <Droppable droppableId="session-exercises">
        {(provided, snapshot) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className={`space-y-3 min-h-[200px] p-2 rounded-lg border-2 ${snapshot.isDraggingOver ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}
          >
            {exercises.map((ex, idx) => (
              <Draggable key={ex.id} draggableId={ex.id.toString()} index={idx}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`flex items-center justify-between p-4 rounded shadow border transition ${snapshot.isDragging ? 'bg-blue-100 border-blue-400 scale-105' : 'bg-white border-gray-200'}`}
                  >
                    <div>
                      <div className="font-semibold text-gray-800">{ex.name}</div>
                      <div className="text-xs text-gray-500">{ex.sets}x{ex.reps} • Repos: {ex.restBetweenSets}s / {ex.restAfter}</div>
                    </div>
                    <div className="flex gap-2">
                      <button className="text-blue-600 hover:underline" onClick={() => onEdit(ex.id)}>Éditer</button>
                      <button className="text-red-500 hover:underline" onClick={() => onRemove(ex.id)}>Supprimer</button>
                    </div>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};
