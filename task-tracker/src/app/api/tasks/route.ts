import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createTask, listTasks } from "@/lib/tasks";

const createSchema = z.object({
  title: z.string().min(1),
  body: z.string().optional(),
  subtasks: z.array(z.string()).optional(),
  priority: z.enum(["URGENT", "NORMAL"]).optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions as any);
  if (!session || !(session as any).user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const tasks = await listTasks({ userId: ((session as any).user as any).id });
  return NextResponse.json({ tasks });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions as any);
  if (!session || !(session as any).user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const id = await createTask({ userId: ((session as any).user as any).id, ...parsed.data });
  return NextResponse.json({ id }, { status: 201 });
}
