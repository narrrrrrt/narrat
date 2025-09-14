import { HandlerContext, MethodResult, SSEMessage } from "../core/Types";

export async function leaveHandler(
  _: HandlerContext,
  params: Record<string, any>
): Promise<MethodResult> {
  const { token } = params as { token: string };

  if (!token) {
    return {
      response: {
        ok: false as boolean,
        step: undefined,
        error: "Missing token",
        role: undefined,
        token: undefined,
      },
      status: 400,
    } as MethodResult;
  }

  // Room.leave() で黒/白/observer の実データを更新
  _.room.leave(token);
  await _.room.save();

  // activity から削除 → 空ならアラーム停止
  if (_.room.deleteActivityToken(token)) {
    await _.state.storage.deleteAlarm(); 
  }

  const broadcast: SSEMessage = {
    event: "leave",
    data: {
      status: _.room.status,
      step: _.room.step,
      black: !!_.room.black,
      white: !!_.room.white,
      board: _.room.boardData,
    },
  };

  return {
    broadcast,
    response: {
      ok: true as boolean,
      step: _.room.step,
      error: undefined,
      role: undefined,
      token: undefined,
    },
    status: 200,
  } as MethodResult;
}