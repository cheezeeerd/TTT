import { prisma } from "@/lib/prisma";
import { encryptString, decryptString, type CipherBundle } from "@/lib/crypto";
import { TaskPriority, TaskStatus } from "@/generated/prisma";

export type DecryptedTask = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date | null;
  status: TaskStatus;
  priority: TaskPriority;
  title: string;
  body?: string | null;
  subtasks?: string[] | null; // simple list for now
};

function pack({ ciphertext, iv, authTag }: CipherBundle) {
  return { ciphertext, iv, authTag };
}

function unpack<T extends { ciphertext: string; iv: string; authTag: string }>(b: T): CipherBundle {
  return { ciphertext: b.ciphertext, iv: b.iv, authTag: b.authTag };
}

export async function createTask(params: {
  userId: string;
  title: string;
  body?: string;
  subtasks?: string[];
  priority?: TaskPriority;
}) {
  const titleBundle = encryptString(params.title);
  const bodyBundle = params.body ? encryptString(params.body) : undefined;
  const subtasksJson = params.subtasks ? JSON.stringify(params.subtasks) : undefined;
  const subtasksBundle = subtasksJson ? encryptString(subtasksJson) : undefined;

  const created = await prisma.task.create({
    data: {
      createdById: params.userId,
      priority: params.priority ?? TaskPriority.NORMAL,
      titleCiphertext: titleBundle.ciphertext,
      titleIv: titleBundle.iv,
      titleAuthTag: titleBundle.authTag,
      bodyCiphertext: bodyBundle?.ciphertext,
      bodyIv: bodyBundle?.iv,
      bodyAuthTag: bodyBundle?.authTag,
      subtasksCiphertext: subtasksBundle?.ciphertext,
      subtasksIv: subtasksBundle?.iv,
      subtasksAuthTag: subtasksBundle?.authTag,
    },
  });

  return created.id;
}

export async function listTasks(params: { userId: string }) {
  const tasks = await prisma.task.findMany({
    where: { createdById: params.userId },
    orderBy: [
      { status: "asc" }, // OPEN before COMPLETED
      { priority: "asc" }, // URGENT before NORMAL (enum order)
      { createdAt: "desc" },
    ],
  });

  return tasks.map((t) => {
    const title = decryptString({
      ciphertext: t.titleCiphertext,
      iv: t.titleIv,
      authTag: t.titleAuthTag,
    });
    const body = t.bodyCiphertext
      ? decryptString(unpack({
          ciphertext: t.bodyCiphertext,
          iv: t.bodyIv!,
          authTag: t.bodyAuthTag!,
        }))
      : null;
    const subtasks = t.subtasksCiphertext
      ? JSON.parse(
          decryptString(
            unpack({
              ciphertext: t.subtasksCiphertext,
              iv: t.subtasksIv!,
              authTag: t.subtasksAuthTag!,
            })
          )
        )
      : null;

    return {
      id: t.id,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      completedAt: t.completedAt,
      status: t.status,
      priority: t.priority,
      title,
      body,
      subtasks,
    } satisfies DecryptedTask;
  });
}

export async function updateTask(params: {
  id: string;
  userId: string;
  title?: string;
  body?: string | null;
  subtasks?: string[] | null;
  priority?: TaskPriority;
  status?: TaskStatus;
  completed?: boolean;
}) {
  const data: any = {};
  if (params.title !== undefined) {
    const b = encryptString(params.title);
    data.titleCiphertext = b.ciphertext;
    data.titleIv = b.iv;
    data.titleAuthTag = b.authTag;
  }
  if (params.body !== undefined) {
    if (params.body === null) {
      data.bodyCiphertext = null;
      data.bodyIv = null;
      data.bodyAuthTag = null;
    } else {
      const b = encryptString(params.body);
      data.bodyCiphertext = b.ciphertext;
      data.bodyIv = b.iv;
      data.bodyAuthTag = b.authTag;
    }
  }
  if (params.subtasks !== undefined) {
    if (params.subtasks === null) {
      data.subtasksCiphertext = null;
      data.subtasksIv = null;
      data.subtasksAuthTag = null;
    } else {
      const b = encryptString(JSON.stringify(params.subtasks));
      data.subtasksCiphertext = b.ciphertext;
      data.subtasksIv = b.iv;
      data.subtasksAuthTag = b.authTag;
    }
  }
  if (params.priority !== undefined) data.priority = params.priority;
  if (params.status !== undefined) data.status = params.status;
  if (params.completed !== undefined)
    data.completedAt = params.completed ? new Date() : null;

  await prisma.task.update({
    where: { id: params.id, createdById: params.userId },
    data,
  });
}

export async function deleteTask(params: { id: string; userId: string }) {
  await prisma.task.delete({ where: { id: params.id, createdById: params.userId } });
}
