import { HandlerContext, MethodResult, SSEMessage, Seat } from "../core/Types";

// ★ 1行関数で token 生成（join.ts 専用）
function generateToken(): string {
  return Math.random().toString(36).slice(2, 10); // 8文字英数字
}

export async function joinHandler(
  _: HandlerContext,
  params: Record<string, any>
): Promise<MethodResult> {
  const { seat } = params as { seat: Seat };

  // token を生成
  const token: string = generateToken();

  // ★ Room.join に渡して role を確定
  const role: Seat = _.room.join(token, seat);
  await _.room.save();

  // ★ Activity 更新 & アラーム設定
  if (_.room.updateActivity(token, "lu")) {
    await _.state.storage.setAlarm(new Date(Date.now() + Number(_.env.HEARTBEAT_TIMEOUT)));
  }

  // broadcast は SSEMessage 型に統一
  const broadcast: SSEMessage = {
    event: "join",
    data: {
      status: _.room.status,   // 1. status
      step: _.room.step,       // 2. step
      role,                    // 3. role（join 時のみ）
      black: !!_.room.black,   // 4. black occupancy
      white: !!_.room.white,   // 5. white occupancy
      board: _.room.boardData, // 6. board
    },
  };

  return {
    broadcast,
    response: {
      ok: true as true,                // 1. ok
      step: _.room.step as number,     // 2. step
      error: undefined,                // 3. error（成功時は空）
      role,                            // 4. role
      token,                           // 5. token（join で払い出した）
    },
  } as MethodResult;
}