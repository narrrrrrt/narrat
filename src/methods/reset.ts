import { HandlerContext, MethodResult, SSEMessage, ResponsePayload } from "../core/Types";

export async function resetHandler(
  _: HandlerContext,
  params: Record<string, any>
): Promise<MethodResult> {
  _.room.reset();
  await _.room.save();

  // ★ reset は全トークン削除後なので必ずアラーム停止
  await _.state.storage.deleteAlarm();

  const broadcast: SSEMessage = {
    event: "reset",
    data: {
      status: _.room.status,   // 1. status
      step: _.room.step,       // 2. step
      black: !!_.room.black,   // 3. black occupancy
      white: !!_.room.white,   // 4. white occupancy
      board: _.room.boardData, // 5. board
    },
  };

  const response: ResponsePayload = {
    ok: true as boolean,
    step: _.room.step,
    error: undefined,
    role: undefined,
    token: undefined,
  };

  return {
    broadcast,
    response,
    status: 200,
  } as MethodResult;
}