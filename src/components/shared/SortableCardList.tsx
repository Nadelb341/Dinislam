import { ReactNode, CSSProperties } from "react";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, rectSortingStrategy,
  useSortable, arrayMove, SortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export interface DragItemProps {
  ref: (node: HTMLElement | null) => void;
  style: CSSProperties;
  isDragging: boolean;
  [key: string]: unknown;
}

interface SortableCardListProps<T extends { id: string | number }> {
  items: T[];
  onReorder: (items: T[]) => void;
  /** Rend l'élément (carte, <tr>...) : appliquer dragProps.ref/style + spread dragProps sur la racine. */
  renderItem: (item: T, dragProps: DragItemProps) => ReactNode;
  /** Grille (grid-cols-...) → rectSortingStrategy. Liste verticale (défaut) → verticalListSortingStrategy. */
  strategy?: SortingStrategy;
}

/**
 * Liste réordonnable par appui long (maintenir puis déplacer), sans wrapper DOM imposé —
 * renderItem contrôle l'élément rendu (div de carte, <tr> de tableau...).
 * activationConstraint.delay évite qu'un simple tap/clic (checkbox, menu...) ne déclenche un déplacement.
 */
export function SortableCardList<T extends { id: string | number }>({
  items, onReorder, renderItem, strategy = verticalListSortingStrategy,
}: SortableCardListProps<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { delay: 350, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onReorder(arrayMove(items, oldIndex, newIndex));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((i) => i.id)} strategy={strategy}>
        {items.map((item) => (
          <SortableItemRenderer key={item.id} id={item.id} item={item} renderItem={renderItem} />
        ))}
      </SortableContext>
    </DndContext>
  );
}

export { rectSortingStrategy };

function SortableItemRenderer<T extends { id: string | number }>({
  id, item, renderItem,
}: { id: string | number; item: T; renderItem: SortableCardListProps<T>["renderItem"] }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    position: "relative",
    zIndex: isDragging ? 10 : undefined,
  };
  return <>{renderItem(item, { ref: setNodeRef, style, isDragging, ...attributes, ...listeners })}</>;
}

/** Réassigne sort_order = i*10 sur un tableau déjà réordonné (convention du projet). */
export function withResequencedOrder<T extends { id: string | number }>(items: T[]): (T & { sort_order: number })[] {
  return items.map((item, i) => ({ ...item, sort_order: i * 10 }));
}
