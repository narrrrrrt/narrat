import { HandlerContext, MethodResult, ResponsePayload } from "../core/Types";

export async function statusHandler(
  _: HandlerContext,
  params: Record<string, any>
): Promise<MethodResult> {
  return {
    response: {
      ok: true,
      step: _.room.step,
      //error: undefined,
      error: `activitySize=${_.room.activity.size}`, // 👈 デバッグ用
      role: undefined,
      token: undefined,
      status: _.room.status,
      black: !!_.room.black,
      white: !!_.room.white,
    } as ResponsePayload,
    status: 200,
  } as MethodResult;
}