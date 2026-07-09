"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { Plus } from "lucide-react";
import {
  createDeal,
  moveDeal,
  setDealStatus,
  type PipelineBoard,
} from "@/actions/deals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type DealRow = PipelineBoard["stages"][number]["deals"][number];

type ContactOption = { id: string; name: string };

function formatValue(value: number, currency: string) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function DealCard({
  deal,
  isDragging,
}: {
  deal: DealRow;
  isDragging?: boolean;
}) {
  return (
    <div
      className={cn(
        "cursor-grab rounded border border-secondary-container bg-surface-container-lowest p-3 active:cursor-grabbing",
        deal.status !== "open" && "opacity-60",
        isDragging && "shadow-confidence",
      )}
    >
      <p className="text-sm font-medium text-on-surface">{deal.title}</p>
      <p className="mt-1 text-xs text-secondary">
        {formatValue(Number(deal.value), deal.currency)}
      </p>
      {deal.status !== "open" ? (
        <p className="mt-2 text-xs font-medium uppercase tracking-wide text-secondary">
          {deal.status}
        </p>
      ) : null}
    </div>
  );
}

function DraggableDeal({ deal }: { deal: DealRow }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: deal.id, disabled: deal.status !== "open" });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <DealCard deal={deal} isDragging={isDragging} />
    </div>
  );
}

function StageColumn({
  stageId,
  name,
  color,
  deals,
  onWonLost,
}: {
  stageId: string;
  name: string;
  color: string;
  deals: DealRow[];
  onWonLost: (dealId: string, status: "won" | "lost") => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stageId });

  return (
    <div className="flex w-72 shrink-0 flex-col">
      <div className="mb-3 flex items-center gap-2">
        <span
          className="size-2.5 shrink-0 rounded-none"
          style={{ backgroundColor: color }}
        />
        <h3 className="text-sm font-semibold tracking-wide text-on-surface uppercase">
          {name}
        </h3>
        <span className="text-xs text-secondary">{deals.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-[200px] flex-1 flex-col gap-2 rounded border border-secondary-container bg-surface-container p-2",
          isOver && "border-primary-container bg-surface-container-low",
        )}
      >
        {deals.map((deal) => (
          <div key={deal.id} className="space-y-1">
            <DraggableDeal deal={deal} />
            {deal.status === "open" ? (
              <div className="flex gap-1 px-1">
                <button
                  type="button"
                  onClick={() => onWonLost(deal.id, "won")}
                  className="flex-1 rounded border border-primary-container/30 py-0.5 text-[10px] font-medium tracking-wide text-primary-container uppercase hover:bg-primary-container/10"
                >
                  Won
                </button>
                <button
                  type="button"
                  onClick={() => onWonLost(deal.id, "lost")}
                  className="flex-1 rounded border border-error/30 py-0.5 text-[10px] font-medium tracking-wide text-error uppercase hover:bg-error-container"
                >
                  Lost
                </button>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

export function KanbanBoard({
  board: initialBoard,
  contacts,
}: {
  board: PipelineBoard;
  contacts: ContactOption[];
}) {
  const router = useRouter();
  const [board, setBoard] = useState(initialBoard);
  const [activeDeal, setActiveDeal] = useState<DealRow | null>(null);

  useEffect(() => {
    setBoard(initialBoard);
  }, [initialBoard]);
  const [showNew, setShowNew] = useState(false);
  const [title, setTitle] = useState("");
  const [value, setValue] = useState("");
  const [stageId, setStageId] = useState(board.stages[0]?.id ?? "");
  const [contactId, setContactId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const dealMap = useMemo(() => {
    const map = new Map<string, DealRow>();
    for (const stage of board.stages) {
      for (const deal of stage.deals) {
        map.set(deal.id, deal);
      }
    }
    return map;
  }, [board.stages]);

  function handleDragStart(event: DragStartEvent) {
    const deal = dealMap.get(String(event.active.id));
    if (deal) setActiveDeal(deal);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDeal(null);
    const dealId = String(event.active.id);
    const overId = event.over?.id;
    if (!overId || dealId === overId) return;

    const targetStageId = String(overId);
    const deal = dealMap.get(dealId);
    if (!deal || deal.stage_id === targetStageId) return;

    setBoard((prev) => {
      const next = {
        ...prev,
        stages: prev.stages.map((s) => ({
          ...s,
          deals:
            s.id === deal.stage_id
              ? s.deals.filter((d) => d.id !== dealId)
              : s.id === targetStageId
                ? [...s.deals, { ...deal, stage_id: targetStageId }]
                : s.deals,
        })),
      };
      return next;
    });

    startTransition(async () => {
      const result = await moveDeal(dealId, targetStageId);
      if (result.error) {
        setError(result.error);
        setBoard(initialBoard);
        return;
      }
      router.refresh();
    });
  }

  function handleWonLost(dealId: string, status: "won" | "lost") {
    startTransition(async () => {
      const result = await setDealStatus(dealId, status);
      if (result.error) {
        setError(result.error);
        return;
      }
      setBoard((prev) => ({
        ...prev,
        stages: prev.stages.map((s) => ({
          ...s,
          deals: s.deals.map((d) =>
            d.id === dealId && result.data
              ? { ...d, status: result.data.status }
              : d,
          ),
        })),
      }));
      router.refresh();
    });
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-headline text-3xl text-on-surface">
            {board.pipeline.name}
          </h1>
          <p className="mt-1 text-secondary">Drag deals between stages</p>
        </div>
        <Button size="sm" onClick={() => setShowNew(!showNew)}>
          <Plus className="size-4" />
          New deal
        </Button>
      </div>

      {error ? <p className="mb-4 text-sm text-error">{error}</p> : null}

      {showNew ? (
        <form
          className="mb-6 grid gap-4 rounded-xl border border-secondary-container bg-surface-container-lowest p-6 sm:grid-cols-2 lg:grid-cols-4"
          onSubmit={(e) => {
            e.preventDefault();
            startTransition(async () => {
              const result = await createDeal({
                title,
                pipeline_id: board.pipeline.id,
                stage_id: stageId,
                contact_id: contactId || null,
                value: Number(value) || 0,
              });
              if (result.error) {
                setError(result.error);
                return;
              }
              setShowNew(false);
              setTitle("");
              setValue("");
              setContactId("");
              router.refresh();
            });
          }}
        >
          <Input
            placeholder="Deal title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="border-secondary-container bg-surface-container-lowest lg:col-span-2"
          />
          <Input
            type="number"
            min={0}
            placeholder="Value"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="border-secondary-container bg-surface-container-lowest"
          />
          <select
            value={stageId}
            onChange={(e) => setStageId(e.target.value)}
            className="rounded border border-secondary-container bg-surface-container-lowest px-3 py-2 text-sm"
          >
            {board.stages.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <select
            value={contactId}
            onChange={(e) => setContactId(e.target.value)}
            className="rounded border border-secondary-container bg-surface-container-lowest px-3 py-2 text-sm sm:col-span-2"
          >
            <option value="">No contact</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <Button type="submit" disabled={pending} className="sm:col-span-2">
            {pending ? "Creating…" : "Create deal"}
          </Button>
        </form>
      ) : null}

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {board.stages.map((stage) => (
            <StageColumn
              key={stage.id}
              stageId={stage.id}
              name={stage.name}
              color={stage.color}
              deals={stage.deals}
              onWonLost={handleWonLost}
            />
          ))}
        </div>
        <DragOverlay>
          {activeDeal ? <DealCard deal={activeDeal} isDragging /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
