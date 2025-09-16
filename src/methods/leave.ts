import { HandlerContext, MethodResult, SSEMessage, Seat } from "../core/Types";

export async function leaveHandler(
  _: HandlerContext,
  params: Record<string, any>
): Promise<MethodResult> {
  const { token } = params as { token: string };

  if (!token) {
    return {
      response: {
        ok: false,
        error: "Missing token",
        step: undefined,
        role: undefined,
        token: undefined,
      },
      status: 400,
    } as MethodResult;
  }

  // ★ Room.leave() が Seat を返す
  const seat: Seat = _.room.leave(token);

  if (_.room.deleteActivityToken(token)) {
    await _.state.storage.deleteAlarm();
  }

  let broadcast: SSEMessage | undefined;
  if (seat !== "observer") {
    // 観戦者以外の退出時のみ broadcast
    broadcast = {
      event: "leave",
      data: {
        status: _.room.status,
        step: _.room.step,
        black: !!_.room.black,
        white: !!_.room.white,
        board: _.room.boardData,
      },
    };
  }

  return {
    ...(broadcast ? { broadcast } : {}),
    response: {
      ok: true,
      step: _.room.step,
      role: seat,
      error: undefined,
      token: undefined,
    },
    status: 200,
  } as MethodResult;
}