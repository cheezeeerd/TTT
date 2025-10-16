import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { deleteTask, updateTask } from "@/lib/tasks";

const updateSchema = z.object({
  title: z.string().optional(),
  body: z.string().nullable().optional(),
  subtasks: z.array(z.string()).nullable().optional(),
  priority: z.enum(["URGENT", "NORMAL"]).optional(),
  status: z.enum(["OPEN", "COMPLETED"]).optional(),
  completed: z.boolean().optional(),
});

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions as any);
  if (!session || !(session as any).user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { id } = await context.params;
  await updateTask({ id, userId: ((session as any).user as any).id, ...parsed.data });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions as any);
  if (!session || !(session as any).user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  await deleteTask({ id, userId: ((session as any).user as any).id });
  return NextResponse.json({ ok: true });
}
