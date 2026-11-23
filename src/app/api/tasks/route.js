
import {
  getTasks,
  updateTask,
} from "@/lib/task-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET — получить задачи диалога
export async function GET(request) {
  try {
    const url = new URL(request.url);

    const dialogId =
      url.searchParams.get("dialogId");

    if (!dialogId) {
      return Response.json(
        { error: "Не указан ID диалога." },
        { status: 400 }
      );
    }

    const result = await getTasks(dialogId);

    return Response.json(result);
  } catch (error) {
    console.error("Tasks GET error:", error);

    return Response.json(
      { error: "Не удалось загрузить задачи." },
      { status: 500 }
    );
  }
}

// PATCH — изменить существующую задачу
export async function PATCH(request) {
  try {
    const body = await request.json();

    const task = await updateTask({
      dialogId: body.dialogId,
      taskId: body.taskId,
      status: body.status,
      comment: body.comment,
    });

    return Response.json({
      success: true,
      task,
    });
  } catch (error) {
    console.error("Tasks PATCH error:", error);

    return Response.json(
      {
        error:
          error.message ||
          "Не удалось обновить задачу.",
      },
      { status: 400 }
    );
  }
}
