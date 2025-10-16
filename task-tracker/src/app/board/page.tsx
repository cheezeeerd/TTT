import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { decryptString } from "@/lib/crypto";
import { GlassCard } from "@/components/Card";
import { TaskCard, type TaskModel } from "@/components/TaskCard";
import { createQuickTask, removeTask, toggleComplete, togglePriority } from "./actions";
import { Plus, Mic } from "lucide-react";
import Link from "next/link";

function toTaskModel(row: any): TaskModel {
  const title = decryptString({ ciphertext: row.titleCiphertext, iv: row.titleIv, authTag: row.titleAuthTag });
  const body = row.bodyCiphertext ? decryptString({ ciphertext: row.bodyCiphertext, iv: row.bodyIv!, authTag: row.bodyAuthTag! }) : null;
  const subtasks = row.subtasksCiphertext ? JSON.parse(decryptString({ ciphertext: row.subtasksCiphertext, iv: row.subtasksIv!, authTag: row.subtasksAuthTag! })) : null;
  return {
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    completedAt: row.completedAt ? row.completedAt.toISOString() : null,
    status: row.status,
    priority: row.priority,
    title,
    body,
    subtasks,
  };
}

export default async function BoardPage() {
  const session = await getServerSession(authOptions as any);
  if (!session || !(session as any).user?.id) return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <GlassCard className="p-6">
        <p className="opacity-80">Please <Link className="underline" href="/signin">sign in</Link> to view your board.</p>
      </GlassCard>
    </main>
  );

  const rows = await prisma.task.findMany({
    where: { createdById: ((session as any).user as any).id },
    orderBy: [
      { status: "asc" },
      { priority: "asc" },
      { createdAt: "desc" },
    ],
  });

  const tasks = rows.map(toTaskModel);
  const urgent = tasks.filter((t) => t.status === "OPEN" && t.priority === "URGENT");
  const normal = tasks.filter((t) => t.status === "OPEN" && t.priority === "NORMAL");
  const completed = tasks.filter((t) => t.status === "COMPLETED");

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Your tasks</h1>
        <div className="flex items-center gap-3">
          <Link href="/voice" className="inline-flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 px-4 py-2 text-sm"><Mic size={16}/> Dictate</Link>
          <form action={createQuickTask} className="inline">
            <input type="hidden" name="raw" value="Quick task" />
            <button className="inline-flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 px-4 py-2 text-sm"><Plus size={16}/> New</button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section>
          <h2 className="mb-3 text-sm uppercase tracking-wide opacity-70">Urgent</h2>
          <div className="space-y-3">
            {urgent.map((t) => (
              <TaskCard key={t.id} task={t} onToggleComplete={toggleComplete} onDelete={removeTask} onTogglePriority={togglePriority} />
            ))}
          </div>
        </section>
        <section>
          <h2 className="mb-3 text-sm uppercase tracking-wide opacity-70">Less urgent</h2>
          <div className="space-y-3">
            {normal.map((t) => (
              <TaskCard key={t.id} task={t} onToggleComplete={toggleComplete} onDelete={removeTask} onTogglePriority={togglePriority} />
            ))}
          </div>
        </section>
      </div>

      {completed.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-sm uppercase tracking-wide opacity-70">Completed</h2>
          <div className="space-y-3 opacity-60">
            {completed.map((t) => (
              <TaskCard key={t.id} task={t} onToggleComplete={toggleComplete} onDelete={removeTask} onTogglePriority={togglePriority} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
