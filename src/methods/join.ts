import { HandlerContext, MethodResult, SSEMessage, JoinResult } from "../core/Types";

export async function joinHandler(
  _: HandlerContext,
  params: Record<string, any>
): Promise<MethodResult> {
  const { token: givenToken, seat } = params as { token?: string; seat?: string };

  // ★ ルームに join を依頼（内部処理は Room 側）
  const result: JoinResult = _.room.join(givenToken, seat);

  // ★ Activity 更新 & アラーム設定
  if (_.room.updateActivity(result.token, "lu")) {
    await _.state.storage.setAlarm(
      new Date(Date.now() + Number(_.env.HEARTBEAT_TIMEOUT))
    );
  }

  // ★ broadcast データ
  const broadcast: SSEMessage = {
    event: "join",
    data: {
      status: _.room.status,
      step: _.room.step,
      role: result.role,
      black: !!_.room.black,
      white: !!_.room.white,
      board: _.room.boardData,
    },
  };

  // ★ レスポンス
  return {
    broadcast,
    response: {
      ok: true as true,
      step: _.room.step as number,
      error: undefined,
      role: result.role,
      token: result.token,
    },
  } as MethodResult;
}