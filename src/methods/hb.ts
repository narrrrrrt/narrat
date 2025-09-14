import { HandlerContext, MethodResult, ResponsePayload } from "../core/Types";

export async function hbHandler(
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
      } as ResponsePayload,
      status: 400,
    } as MethodResult;
  }

  // ★ ハートビート更新
  if (_.room.updateActivity(token, "hb")) {
    await _.state.storage.setAlarm(new Date(Date.now() + Number(_.env.HEARTBEAT_TIMEOUT)));
  }

  return {
    response: {
      ok: true as boolean,
      step: _.room.step,
      error: undefined,
      role: undefined,
      token,
    } as ResponsePayload,
    status: 200,
  } as MethodResult;
}