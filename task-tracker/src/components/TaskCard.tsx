"use client";
import { GlassCard } from "@/components/Card";
import { useState } from "react";
import { Check, Clock, Flag, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export type TaskModel = {
  id: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
  status: "OPEN" | "COMPLETED";
  priority: "URGENT" | "NORMAL";
  title: string;
  body?: string | null;
  subtasks?: string[] | null;
};

export function TaskCard({ task, onToggleComplete, onDelete, onTogglePriority }: {
  task: TaskModel;
  onToggleComplete: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
  onTogglePriority: (id: string) => void;
}) {
  const [hover, setHover] = useState(false);
  const created = new Date(task.createdAt);

  return (
    <GlassCard
      className="p-4 group relative"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={() => onToggleComplete(task.id, task.status !== "COMPLETED")}
          className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/20 bg-white/10 hover:bg-white/15"
          aria-label="Toggle complete"
        >
          {task.status === "COMPLETED" ? <Check size={16} /> : <div className="h-3 w-3 rounded-full bg-transparent" />}
        </button>
        <div className="flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-medium leading-tight">
              {task.title}
            </h3>
            <div className="flex items-center gap-1 opacity-80 text-xs">
              <Clock size={14} />
              <span title={created.toLocaleString()}>{formatDistanceToNow(created, { addSuffix: true })}</span>
            </div>
          </div>
          {task.body && <p className="opacity-85 text-sm mt-1">{task.body}</p>}
          {task.subtasks?.length ? (
            <ul className="mt-2 space-y-1">
              {task.subtasks.map((s, i) => (
                <li key={i} className="text-sm opacity-90">
                  - {s}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={() => onTogglePriority(task.id)}
          className="inline-flex items-center gap-1 text-xs rounded-full px-2 py-1 border border-white/10 bg-white/5 hover:bg-white/10"
        >
          <Flag size={12} /> {task.priority === "URGENT" ? "Urgent" : "Less urgent"}
        </button>
        <button
          onClick={() => onDelete(task.id)}
          className="ml-auto inline-flex items-center gap-1 text-xs rounded-full px-2 py-1 border border-white/10 bg-white/5 hover:bg-white/10 text-red-300"
        >
          <Trash2 size={12} /> Delete
        </button>
      </div>
    </GlassCard>
  );
}
