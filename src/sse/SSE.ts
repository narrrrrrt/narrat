// SSE.ts
import { SSEManager } from "./SSEManager";

export function createSSE(manager: SSEManager, request: Request): Response {
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  // 接続登録
  manager.addConnection(writer);

  // 切断時クリーンアップ（closeはSSEManager側で実施）
  request.signal.addEventListener("abort", () => {
    manager.removeConnection(writer);
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}