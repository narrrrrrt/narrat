import { HandlerContext, MethodResult, SSEMessage, ResponsePayload, Seat, MoveResult } from "../core/Types";

export async function moveHandler(
  _: HandlerContext,
  params: Record<string, any>
): Promise<MethodResult> {
  const { x, y, token } = params as { x: number; y: number; token: string };

  const response: ResponsePayload = {
    ok: false as boolean,
    step: undefined,
    error: undefined,
    role: undefined,
    token: undefined,
  };

  let statusCode = 400;
  let broadcast: SSEMessage | undefined = undefined;

  if (!token) {
    response.error = "Missing token";
    return { response, status: statusCode } as MethodResult;
  }

  // ★ token から seat を決定（黒・白・観戦者）
  const seat: Seat =
    _.room.black === token ? "black" :
    _.room.white === token ? "white" :
    "observer";

  // 観戦者は操作不可
  if (seat === "observer") {
    response.error = "Not a player";
    return { response, status: statusCode } as MethodResult;
  }

  // 手番不一致ならエラー
  if (_.room.status !== seat) {
    response.error = "Not your turn";
    return { response, status: statusCode } as MethodResult;
  }

  // ここから盤面処理
  const result: MoveResult = _.room.move(x, y, token) as MoveResult;

  if (!result.ok) {
    switch (result.reason) {
      case "token_mismatch":
        response.error = "Not a player";
        break;
      case "illegal_pass":
        response.error = "Illegal pass";
        break;
      case "invalid_move":
        response.error = "Invalid move";
        break;
      default:
        response.error = "Unknown error";
    }
  } else {
    // 成功時だけ 200
    await _.room.save();
    response.ok = true;
    response.step = _.room.step;
    statusCode = 200;

    broadcast = {
      event: "move",
      data: {
        status: _.room.status,
        step: _.room.step,
        black: !!_.room.black,
        white: !!_.room.white,
        board: _.room.boardData,
      },
    } as SSEMessage;
  }

  // ★ 成否に関わらず必ず更新する処理（オリジナル準拠）
  if (_.room.updateActivity(token, "lu")) {
    await _.state.storage.setAlarm(
      new Date(Date.now() + Number(_.env.HEARTBEAT_TIMEOUT))
    );
  }

  return {
    ...(broadcast ? { broadcast } : {}),
    response,
    status: statusCode,
  } as MethodResult;
}