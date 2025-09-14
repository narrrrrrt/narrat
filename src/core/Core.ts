import { Room } from "./Room";
import { HandlerContext, MethodResult } from "./Types";

// === 動的 import のマップ（ラベルだけ） ===
const importers: Record<string, () => Promise<any>> = {
  join:  () => import("../methods/join"),
  move:  () => import("../methods/move"),
  leave: () => import("../methods/leave"),
  reset: () => import("../methods/reset"),
  hb:    () => import("../methods/hb"),
  status: () => import("../methods/status"),
};

// === Coreのメイン関数 ===
export async function handleAction(
  _: HandlerContext,
  action: string,
  params: Record<string, any>
): Promise<Response> {
  const importer = importers[action];
  if (!importer) {
    return new Response(`Unknown action: ${action}`, { status: 400 });
  }

  // モジュールを import
  const mod = await importer();

  // 命名規則で関数を取り出す (join → joinHandler)
  const fn = mod[`${action}Handler`];
  if (!fn) {
    return new Response(`Handler not found: ${action}`, { status: 500 });
  }

  // スタブ実行（board/\*.ts の処理）
  const result: MethodResult = await fn(_, params);

  // ★ Core.ts の責務 → SSE にブロードキャスト
  if (result.broadcast) {
    _.room.sse.broadcast(result.broadcast);
  }

  // ★ Core.ts の責務 → ユーザーへのレスポンス
  return new Response(JSON.stringify(result.response), {
    status: result.status ?? 200,
    headers: { "Content-Type": "application/json" },
  });
}