"use server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TaskPriority, TaskStatus } from "@/generated/prisma";
import { revalidatePath } from "next/cache";
import { encryptString } from "@/lib/crypto";

export async function toggleComplete(id: string, completed: boolean) {
  const session = await getServerSession(authOptions as any);
  if (!session || !(session as any).user?.id) throw new Error("Unauthorized");
  await prisma.task.update({
    where: { id, createdById: ((session as any).user as any).id },
    data: {
      status: completed ? TaskStatus.COMPLETED : TaskStatus.OPEN,
      completedAt: completed ? new Date() : null,
    },
  });
  revalidatePath("/board");
}

export async function togglePriority(id: string) {
  const session = await getServerSession(authOptions as any);
  if (!session || !(session as any).user?.id) throw new Error("Unauthorized");
  const t = await prisma.task.findFirst({ where: { id, createdById: ((session as any).user as any).id } });
  if (!t) return;
  await prisma.task.update({
    where: { id },
    data: {
      priority: t.priority === TaskPriority.URGENT ? TaskPriority.NORMAL : TaskPriority.URGENT,
    },
  });
  revalidatePath("/board");
}

export async function removeTask(id: string) {
  const session = await getServerSession(authOptions as any);
  if (!session || !(session as any).user?.id) throw new Error("Unauthorized");
  await prisma.task.delete({ where: { id, createdById: ((session as any).user as any).id } });
  revalidatePath("/board");
}

export async function createQuickTask(formData: FormData) {
  const session = await getServerSession(authOptions as any);
  if (!session || !(session as any).user?.id) throw new Error("Unauthorized");
  const raw = String(formData.get("raw") ?? "");
  const title = raw.trim().slice(0, 140);
  const bundle = encryptString(title);
  await prisma.task.create({
    data: {
      createdById: ((session as any).user as any).id,
      titleCiphertext: bundle.ciphertext,
      titleIv: bundle.iv,
      titleAuthTag: bundle.authTag,
    },
  });
  revalidatePath("/board");
}
