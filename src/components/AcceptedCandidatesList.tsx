import React from 'react';
import { GripVertical, ExternalLink } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Candidate } from '../types';

interface SortableItemProps {
  candidate: Candidate;
}

function SortableItem({ candidate }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: candidate.name });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-2"
    >
      <button
        className="cursor-grab hover:text-blue-600 touch-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-5 h-5" />
      </button>
      
      <div className="flex-1">
        <span className="font-medium">{candidate.name}</span>
      </div>
      
      <a
        href={candidate.profileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-800"
      >
        <ExternalLink className="w-5 h-5" />
      </a>
    </div>
  );
}

interface Props {
  candidates: Candidate[];
  onReorder: (newOrder: Candidate[]) => void;
}

export default function AcceptedCandidatesList({ candidates, onReorder }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: any) {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = candidates.findIndex((c) => c.name === active.id);
      const newIndex = candidates.findIndex((c) => c.name === over.id);
      onReorder(arrayMove(candidates, oldIndex, newIndex));
    }
  }

  if (!candidates.length) return null;

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4 text-gray-900">
        Accepted Candidates ({candidates.length})
      </h2>
      
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={candidates.map(c => c.name)}
          strategy={verticalListSortingStrategy}
        >
          {candidates.map((candidate) => (
            <SortableItem key={candidate.name} candidate={candidate} />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}