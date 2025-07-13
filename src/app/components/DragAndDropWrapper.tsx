import React from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';
import { SessionExercise } from '@/types';

interface DragAndDropWrapperProps {
  exercises: SessionExercise[];
  onReorder: (exercises: SessionExercise[]) => void;
  onEdit: (exerciseId: number) => void;
  onRemove: (exerciseId: number) => void;
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
              <Draggable key={`${ex.exerciseId}-${idx}`} draggableId={`${ex.exerciseId}-${idx}`} index={idx}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`flex items-center justify-between p-4 rounded shadow border transition ${snapshot.isDragging ? 'bg-blue-100 border-blue-400 scale-105' : 'bg-white border-gray-200'}`}
                  >
                    <div>
                      <div className="font-semibold text-gray-800">{ex.exercise?.name || 'Unknown Exercise'}</div>
                      <div className="text-xs text-gray-500">
                        {ex.sets}x{ex.reps ? `${ex.reps} reps` : `${ex.durationSeconds}s`} • Repos: {ex.restBetweenSets}s / {ex.restAfter}s
                      </div>
                      {ex.exercise?.muscleGroups && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {ex.exercise.muscleGroups.map((muscle, index) => (
                            <span key={index} className="text-xs bg-gray-100 text-gray-600 px-1 py-0.5 rounded">
                              {muscle}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button className="text-blue-600 hover:underline" onClick={() => onEdit(ex.exerciseId)}>Éditer</button>
                      <button className="text-red-500 hover:underline" onClick={() => onRemove(ex.exerciseId)}>Supprimer</button>
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
